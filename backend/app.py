"""Flask API for the Adyant Associates learning platform.

GitHub Contents API is used as the persistence layer. The GitHub token is
read only by this process and must never be exposed to the React application.
"""

from __future__ import annotations

import base64
import csv
import hashlib
import hmac
import io
import json
import os
import secrets
import threading
import urllib.error
import urllib.request
from datetime import UTC, datetime
from typing import Any

from flask import Flask, jsonify, request
from dotenv import load_dotenv


load_dotenv()


DEFAULT_STORE: dict[str, list[dict[str, Any]]] = {
    "users": [],
    "assessments": [],
    "support_requests": [],
    "reset_requests": [],
    "bookings": [],
}

PROGRAMS = [
    {
        "id": "ai-for-qa-managers",
        "title": "AI for QA Managers",
        "type": "Leadership",
        "format": "Self-paced",
    },
    {
        "id": "interview-preparation-guide",
        "title": "Interview Preparation Guide",
        "type": "Career Prep",
        "format": "Self-paced",
    },
    {
        "id": "ready-mock-preparation",
        "title": "Ready Mock Preparation",
        "type": "Practice",
        "format": "Live interview",
    },
]

COHORTS = [
    {
        "id": "ai-for-qa-managers-oct-2026",
        "program_id": "ai-for-qa-managers",
        "start_date": "2026-10-26",
        "schedule": "Sat & Sun",
        "status": "open",
    },
    {
        "id": "interview-preparation-guide-nov-2026",
        "program_id": "interview-preparation-guide",
        "start_date": "2026-11-04",
        "schedule": "Mon - Thu",
        "status": "open",
    },
    {
        "id": "ready-mock-preparation-nov-2026",
        "program_id": "ready-mock-preparation",
        "start_date": "2026-11-15",
        "schedule": "Sat & Sun",
        "status": "soon",
    },
]


class ConfigurationError(RuntimeError):
    """Raised when the GitHub persistence configuration is incomplete."""


class GitHubStore:
    def __init__(self, environ: dict[str, str] | None = None) -> None:
        env = environ or os.environ
        self.token = env.get("GITHUB_TOKEN", "").strip()
        self.repository = env.get("GITHUB_REPOSITORY", "").strip()
        self.path = env.get("GITHUB_DATA_PATH", "data/store.json").strip()
        self.api_url = env.get("GITHUB_API_URL", "https://api.github.com").rstrip("/")

    def _validate_configuration(self) -> None:
        if not self.token or not self.repository:
            raise ConfigurationError(
                "Set GITHUB_TOKEN and GITHUB_REPOSITORY before using persistent API endpoints."
            )

    def _request(self, method: str, url: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
        headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {self.token}",
            "User-Agent": "adyant-associates-api",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        encoded_body = json.dumps(body).encode("utf-8") if body is not None else None
        if encoded_body is not None:
            headers["Content-Type"] = "application/json"
        request_object = urllib.request.Request(
            url, data=encoded_body, headers=headers, method=method
        )
        try:
            with urllib.request.urlopen(request_object, timeout=10) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"GitHub API request failed ({error.code}): {detail}") from error
        except urllib.error.URLError as error:
            raise RuntimeError(f"GitHub API is unavailable: {error.reason}") from error

    def read(self) -> tuple[dict[str, list[dict[str, Any]]], str | None]:
        self._validate_configuration()
        url = f"{self.api_url}/repos/{self.repository}/contents/{self.path}"
        try:
            response = self._request("GET", url)
        except RuntimeError as error:
            if " (404):" not in str(error):
                raise
            return json.loads(json.dumps(DEFAULT_STORE)), None
        content = base64.b64decode(response["content"]).decode("utf-8")
        data = json.loads(content)
        return self._normalise(data), response["sha"]

    def write(self, data: dict[str, list[dict[str, Any]]], sha: str | None) -> None:
        self._validate_configuration()
        normalized = self._normalise(data)
        for attempt in range(3):
            try:
                self._write_file(
                    self.path,
                    (json.dumps(normalized, indent=2) + "\n").encode("utf-8"),
                    "Update platform records",
                    sha,
                )
                break
            except RuntimeError as error:
                if " (409):" not in str(error) or attempt == 2:
                    raise
                latest, sha = self.read()
                normalized = self._merge_new_records(latest, normalized)

        # GitHub renders CSV files as tables. Keep the complete login history in
        # the existing users collection and publish the useful columns beside it.
        parent = self.path.rsplit("/", 1)[0] if "/" in self.path else ""
        csv_path = f"{parent}/users.csv" if parent else "users.csv"
        for attempt in range(3):
            users_csv = io.StringIO(newline="")
            columns = ["id", "created_at", "username", "email"]
            writer = csv.DictWriter(users_csv, fieldnames=columns, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(normalized["users"])
            try:
                self._write_file(
                    csv_path,
                    users_csv.getvalue().encode("utf-8"),
                    "Update login history table",
                )
                break
            except RuntimeError as error:
                if " (409):" not in str(error) or attempt == 2:
                    raise
                normalized, _ = self.read()

    @staticmethod
    def _merge_new_records(
        latest: dict[str, list[dict[str, Any]]],
        attempted: dict[str, list[dict[str, Any]]],
    ) -> dict[str, list[dict[str, Any]]]:
        """Keep records added by this request while incorporating concurrent writes."""
        merged = GitHubStore._normalise(latest)
        for collection, attempted_records in attempted.items():
            known_ids = {record.get("id") for record in merged[collection]}
            merged[collection].extend(
                record
                for record in attempted_records
                if record.get("id") not in known_ids
            )
        return merged

    def _write_file(
        self, path: str, content: bytes, message: str, sha: str | None = None
    ) -> None:
        url = f"{self.api_url}/repos/{self.repository}/contents/{path}"
        body: dict[str, Any] = {
            "message": message,
            "content": base64.b64encode(content).decode("ascii"),
        }
        if sha is None:
            try:
                existing = self._request("GET", url)
                sha = existing.get("sha")
            except RuntimeError as error:
                if " (404):" not in str(error):
                    raise
        if sha:
            body["sha"] = sha
        self._request("PUT", url, body)

    @staticmethod
    def _normalise(data: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
        return {
            key: value if isinstance(value, list) else []
            for key, value in {**DEFAULT_STORE, **data}.items()
        }


def create_app(
    environ: dict[str, str] | None = None, store: GitHubStore | None = None
) -> Flask:
    app = Flask(__name__)
    env = environ or os.environ
    app.config["SECRET_KEY"] = env.get("SECRET_KEY", "").strip()
    app.config["CORS_ORIGINS"] = {
        origin.strip()
        for origin in env.get("CORS_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    }
    persistence = store or GitHubStore(env)
    # GitHub's Contents API uses optimistic concurrency (the file SHA). Keep
    # this process from issuing overlapping read/modify/write sequences.
    persistence_lock = threading.Lock()

    @app.after_request
    def add_cors_headers(response: Any) -> Any:
        origin = request.headers.get("Origin")
        if origin in app.config["CORS_ORIGINS"]:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        return response

    @app.errorhandler(ConfigurationError)
    def configuration_error(error: ConfigurationError) -> tuple[Any, int]:
        return jsonify({"error": str(error)}), 503

    @app.errorhandler(RuntimeError)
    def runtime_error(error: RuntimeError) -> tuple[Any, int]:
        return jsonify({"error": str(error)}), 502

    @app.get("/api/health")
    def health() -> Any:
        return jsonify({"status": "ok", "service": "adyant-associates-api"})

    @app.get("/api/programs")
    def programs() -> Any:
        return jsonify({"programs": PROGRAMS, "cohorts": COHORTS})

    @app.post("/api/assessments")
    def create_assessment() -> Any:
        payload = require_json({"role", "stack", "goal"})
        record = save_record("assessments", payload)
        return jsonify({"assessment": record}), 201

    @app.post("/api/auth/login")
    def login() -> Any:
        payload = require_json({"username", "email"})
        email = payload["email"].lower()
        record = save_record("users", {"username": payload["username"], "email": email})
        return jsonify({"user": record, "token": issue_token(record["id"])}), 200

    @app.post("/api/auth/reset")
    def reset() -> Any:
        payload = require_json({"email"})
        record = save_record("reset_requests", {"email": payload["email"].lower()})
        return jsonify({"request": record, "message": "If the email matches a purchase, instructions will be sent shortly."}), 202

    @app.post("/api/support")
    def support() -> Any:
        payload = require_json({"question"})
        record = save_record("support_requests", payload)
        return jsonify({"request": record}), 201

    @app.post("/api/bookings")
    def booking() -> Any:
        payload = require_json({"email", "payment_method"})
        if payload["payment_method"] not in {"upi", "card", "bank", "po"}:
            return jsonify({"error": "payment_method must be one of upi, card, bank, or po"}), 400
        record = save_record("bookings", payload | {"status": "pending_payment"})
        return jsonify({"booking": record}), 201

    def save_record(collection: str, payload: dict[str, Any]) -> dict[str, Any]:
        with persistence_lock:
            data, sha = persistence.read()
            record = {
                "id": secrets.token_urlsafe(12),
                "created_at": datetime.now(UTC).isoformat(),
                **payload,
            }
            data[collection].append(record)
            persistence.write(data, sha)
        return record

    def require_json(required_fields: set[str]) -> dict[str, Any]:
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return_error = {"error": "Request body must be a JSON object"}
            raise ValueError(return_error["error"])
        missing = sorted(field for field in required_fields if not str(payload.get(field, "")).strip())
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")
        return payload

    @app.errorhandler(ValueError)
    def validation_error(error: ValueError) -> tuple[Any, int]:
        return jsonify({"error": str(error)}), 400

    def issue_token(user_id: str) -> str:
        if not app.config["SECRET_KEY"]:
            raise ConfigurationError("Set SECRET_KEY before using authentication endpoints.")
        timestamp = str(int(datetime.now(UTC).timestamp()))
        message = f"{user_id}.{timestamp}".encode()
        signature = hmac.new(app.config["SECRET_KEY"].encode(), message, hashlib.sha256).hexdigest()
        return base64.urlsafe_b64encode(f"{user_id}.{timestamp}.{signature}".encode()).decode()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=False)
