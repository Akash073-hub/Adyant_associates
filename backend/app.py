"""Flask API for the Adyant Associates learning platform.

GitHub Contents API is used as the persistence layer. The GitHub token is
read only by this process and must never be exposed to the React application.
"""

from __future__ import annotations

import base64
import binascii
import csv
import hashlib
import hmac
import io
import json
import os
import secrets
import smtplib
import ssl
import threading
import urllib.error
import urllib.request
from urllib.parse import urlparse
from datetime import UTC, datetime
from email.message import EmailMessage
from email.utils import formataddr
from typing import Any
from zoneinfo import ZoneInfo

from flask import Flask, jsonify, request
from dotenv import load_dotenv


load_dotenv()

DISPLAY_TIME_ZONE = ZoneInfo("Asia/Kolkata")


def split_datetime(value: Any) -> tuple[str, str]:
    """Render a timestamp as separate, human-friendly India date and time."""
    if not isinstance(value, str) or not value.strip():
        return "", ""
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=UTC)
        local_time = parsed.astimezone(DISPLAY_TIME_ZONE)
        return local_time.strftime("%d %b %Y"), local_time.strftime("%I:%M %p")
    except ValueError:
        return value, ""


DEFAULT_STORE: dict[str, list[dict[str, Any]]] = {
    "users": [],
    "student_leads": [],
    "admins": [],
    "assessments": [],
    "support_requests": [],
    "mock_interview_requests": [],
    "reset_requests": [],
    "bookings": [],
    "videos": [],
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
            columns = ["id", "created_date", "created_time", "username", "email"]
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

        # Keep assessment submissions in their own easy-to-review GitHub table.
        assessment_path = f"{parent}/assessments.csv" if parent else "assessments.csv"
        for attempt in range(3):
            assessments_csv = io.StringIO(newline="")
            columns = ["id", "created_date", "created_time", "role", "stack", "goal"]
            writer = csv.DictWriter(assessments_csv, fieldnames=columns, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(normalized["assessments"])
            try:
                self._write_file(
                    assessment_path,
                    assessments_csv.getvalue().encode("utf-8"),
                    "Update assessment submissions table",
                )
                break
            except RuntimeError as error:
                if " (409):" not in str(error) or attempt == 2:
                    raise
                normalized, _ = self.read()

        # Keep student browse sign-ups separate from member and assessment records.
        student_leads_path = f"{parent}/student_leads.csv" if parent else "student_leads.csv"
        for attempt in range(3):
            student_leads_csv = io.StringIO(newline="")
            columns = ["id", "created_date", "created_time", "email", "interest", "current_status", "current_status_details"]
            writer = csv.DictWriter(student_leads_csv, fieldnames=columns, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(normalized["student_leads"])
            try:
                self._write_file(
                    student_leads_path,
                    student_leads_csv.getvalue().encode("utf-8"),
                    "Update student browse sign-ups table",
                )
                break
            except RuntimeError as error:
                if " (409):" not in str(error) or attempt == 2:
                    raise
                normalized, _ = self.read()

        # Publish the remaining submitted records as their own GitHub tables.
        table_exports = {
            "support_requests": ["id", "created_date", "created_time", "email", "question"],
            "mock_interview_requests": ["id", "created_date", "created_time", "name", "email", "preferred_time", "message"],
            "reset_requests": ["id", "created_date", "created_time", "email"],
            "bookings": ["id", "created_date", "created_time", "email", "payment_method", "status"],
            "videos": ["id", "created_date", "created_time", "title", "url", "description"],
        }
        for collection, columns in table_exports.items():
            csv_path = f"{parent}/{collection}.csv" if parent else f"{collection}.csv"
            for attempt in range(3):
                records_csv = io.StringIO(newline="")
                writer = csv.DictWriter(records_csv, fieldnames=columns, extrasaction="ignore")
                writer.writeheader()
                writer.writerows(normalized[collection])
                try:
                    self._write_file(
                        csv_path,
                        records_csv.getvalue().encode("utf-8"),
                        f"Update {collection.replace('_', ' ')} table",
                    )
                    break
                except RuntimeError as error:
                    if " (409):" not in str(error) or attempt == 2:
                        raise
                    normalized, _ = self.read()

    def write_admin_exports(self, admins: list[dict[str, Any]]) -> None:
        """Publish successful admin sign-ins without ever storing passwords."""
        parent = self.path.rsplit("/", 1)[0] if "/" in self.path else ""
        json_path = f"{parent}/admin.json" if parent else "admin.json"
        csv_path = f"{parent}/admin.csv" if parent else "admin.csv"
        admins = self._normalise({"admins": admins})["admins"]
        json_content = (json.dumps(admins, indent=2) + "\n").encode("utf-8")
        csv_file = io.StringIO(newline="")
        columns = ["id", "created_date", "created_time", "email", "event"]
        writer = csv.DictWriter(csv_file, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(admins)
        exports = [
            (json_path, json_content, "Update admin login history JSON"),
            (csv_path, csv_file.getvalue().encode("utf-8"), "Update admin login history table"),
        ]
        for path, content, message in exports:
            for attempt in range(3):
                try:
                    self._write_file(path, content, message)
                    break
                except RuntimeError as error:
                    if " (409):" not in str(error) or attempt == 2:
                        raise

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
        normalized = {
            key: value if isinstance(value, list) else []
            for key, value in {**DEFAULT_STORE, **data}.items()
        }
        for records in normalized.values():
            for record in records:
                if not isinstance(record, dict):
                    continue
                timestamp = record.get("created_at_iso") or record.get("created_at")
                if timestamp:
                    record["created_date"], record["created_time"] = split_datetime(timestamp)
                    record.pop("created_at_iso", None)
                    record.pop("created_at", None)
        return normalized


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
    support_email = env.get("SUPPORT_EMAIL", "akashrbhat73@gmail.com").strip()

    def send_support_email(subject: str, body: str, reply_to: str | None = None) -> None:
        smtp_host = env.get("SMTP_HOST", "").strip()
        smtp_username = env.get("SMTP_USERNAME", "").strip()
        smtp_password = env.get("SMTP_PASSWORD", "")
        from_email = env.get("SMTP_FROM_EMAIL", smtp_username).strip()
        try:
            smtp_port = int(env.get("SMTP_PORT", "587"))
        except ValueError as error:
            raise ConfigurationError("SMTP_PORT must be a valid port number.") from error
        if not all((smtp_host, smtp_username, smtp_password, from_email, support_email)):
            raise ConfigurationError(
                "Set SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, and SMTP_FROM_EMAIL in backend/.env."
            )
        if reply_to and any(char in reply_to for char in "\r\n"):
            raise ValueError("Reply email address is invalid.")

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = formataddr(("Adyant Associates", from_email))
        message["To"] = support_email
        if reply_to:
            message["Reply-To"] = reply_to
        message.set_content(body)
        try:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as smtp:
                smtp.ehlo()
                smtp.starttls(context=ssl.create_default_context())
                smtp.ehlo()
                smtp.login(smtp_username, smtp_password)
                smtp.send_message(message)
        except (OSError, smtplib.SMTPException) as error:
            raise RuntimeError(f"Email delivery failed: {error}") from error

    def email_failure(error: Exception) -> tuple[Any, int]:
        return jsonify({
            "error": f"Your request was saved, but the email could not be sent. {error}",
            "saved": True,
        }), 503

    @app.after_request
    def add_cors_headers(response: Any) -> Any:
        origin = request.headers.get("Origin")
        if origin in app.config["CORS_ORIGINS"]:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        return response

    @app.errorhandler(ConfigurationError)
    def configuration_error(error: ConfigurationError) -> tuple[Any, int]:
        return jsonify({"error": str(error)}), 503

    @app.errorhandler(RuntimeError)
    def runtime_error(error: RuntimeError) -> tuple[Any, int]:
        return jsonify({"error": str(error)}), 502

    @app.errorhandler(PermissionError)
    def permission_error(error: PermissionError) -> tuple[Any, int]:
        return jsonify({"error": str(error)}), 401

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
        payload = require_json({"email"})
        email = payload["email"].strip().lower()
        data, _ = persistence.read()
        is_member = any(
            user.get("email", "").strip().lower() == email and user.get("is_member") is True
            for user in data["users"]
        ) or any(
            booking.get("email", "").strip().lower() == email
            and booking.get("status", "").lower() in {"paid", "confirmed", "active"}
            for booking in data["bookings"]
        )
        if not is_member:
            return jsonify({"member": False, "message": "We couldn't find an active membership for this email. Browse as a student or contact support if you believe this is a mistake."}), 403
        return jsonify({"member": True, "message": "An active membership was found for this email."}), 200

    @app.post("/api/student-leads")
    def student_lead() -> Any:
        payload = require_json({"email"})
        email = payload["email"].strip().lower()
        if "@" not in email:
            return jsonify({"error": "Enter a valid email address."}), 400
        record = save_record("student_leads", {
            "email": email,
            "interest": str(payload.get("interest", "")).strip(),
            "current_status": str(payload.get("current_status", "")).strip(),
            "current_status_details": str(payload.get("current_status_details", "")).strip(),
        })
        return jsonify({"lead": record}), 201

    @app.post("/api/auth/admin-login")
    def admin_login() -> Any:
        payload = require_json({"email", "password"})
        if not isinstance(payload["email"], str) or not isinstance(payload["password"], str):
            return jsonify({"error": "Email and password must be text values."}), 400
        admin_password = env.get("ADMIN_PASSWORD", "")
        if not admin_password:
            raise ConfigurationError("Set ADMIN_PASSWORD to enable admin login.")
        password_matches = hmac.compare_digest(payload["password"], admin_password)
        if not password_matches:
            return jsonify({"error": "Invalid admin password."}), 401
        token = issue_token("admin")
        save_record("admins", {
            "email": payload["email"].strip().lower(),
            "event": "login_success",
        })
        return jsonify({"token": token}), 200

    @app.get("/api/videos")
    def videos() -> Any:
        data, _ = persistence.read()
        return jsonify({"videos": data["videos"]})

    @app.route("/api/admin/videos", methods=["GET", "POST"])
    def manage_videos() -> Any:
        require_admin()
        if request.method == "GET":
            data, _ = persistence.read()
            return jsonify({"videos": data["videos"]})

        payload = require_json({"title", "url"})
        url = payload["url"].strip()
        parsed_url = urlparse(url)
        if parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
            return jsonify({"error": "Video URL must start with http:// or https://."}), 400
        record = save_record("videos", {
            "title": payload["title"].strip(),
            "url": url,
            "description": str(payload.get("description", "")).strip(),
        })
        return jsonify({"video": record}), 201

    @app.post("/api/auth/reset")
    def reset() -> Any:
        payload = require_json({"email"})
        record = save_record("reset_requests", {"email": payload["email"].lower()})
        return jsonify({"request": record, "message": "If the email matches a purchase, instructions will be sent shortly."}), 202

    @app.post("/api/mock-interview-requests")
    def mock_interview_request() -> Any:
        payload = require_json({"name", "email", "preferred_time"})
        email = payload["email"].strip()
        record = save_record("mock_interview_requests", {
            "name": payload["name"].strip(),
            "email": email,
            "preferred_time": payload["preferred_time"].strip(),
            "message": str(payload.get("message", "Please send me a Google Meet link for the mock interview.")).strip(),
        })
        body = (
            "A new mock interview request was submitted.\n\n"
            f"Name: {record['name']}\nEmail: {email}\n"
            f"Preferred date/time: {record['preferred_time']}\n\n"
            f"Message: {record['message']}\n\nPlease reply with available times and the Google Meet link."
        )
        try:
            send_support_email("Mock interview / Google Meet link request", body, email)
        except (ConfigurationError, RuntimeError, ValueError) as error:
            return email_failure(error)
        return jsonify({"request": record, "email_sent": True}), 201

    @app.post("/api/support")
    def support() -> Any:
        payload = require_json({"question"})
        reply_to = str(payload.get("email", "")).strip()
        if reply_to and any(char in reply_to for char in "\r\n"):
            return jsonify({"error": "Reply email address is invalid."}), 400
        record = save_record("support_requests", {
            "question": payload["question"].strip(),
            "email": reply_to,
        })
        try:
            send_support_email("New website support request", payload["question"].strip(), reply_to or None)
        except (ConfigurationError, RuntimeError, ValueError) as error:
            return email_failure(error)
        return jsonify({"request": record, "email_sent": True}), 201

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
            now = datetime.now(DISPLAY_TIME_ZONE)
            record = {
                "id": secrets.token_urlsafe(12),
                "created_date": now.strftime("%d %b %Y"),
                "created_time": now.strftime("%I:%M %p"),
                **payload,
            }
            data[collection].append(record)
            persistence.write(data, sha)
            if collection == "admins" and type(persistence).write is GitHubStore.write:
                persistence.write_admin_exports(data["admins"])
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

    def require_admin() -> None:
        authorization = request.headers.get("Authorization", "")
        token = authorization.removeprefix("Bearer ").strip()
        try:
            decoded = base64.urlsafe_b64decode(token.encode()).decode()
            user_id, timestamp, supplied_signature = decoded.rsplit(".", 2)
            message = f"{user_id}.{timestamp}".encode()
            expected_signature = hmac.new(
                app.config["SECRET_KEY"].encode(), message, hashlib.sha256
            ).hexdigest()
            token_age = datetime.now(UTC).timestamp() - int(timestamp)
            valid = (
                user_id == "admin"
                and token_age >= 0
                and token_age <= 12 * 60 * 60
                and hmac.compare_digest(supplied_signature, expected_signature)
            )
        except (ValueError, UnicodeDecodeError, binascii.Error):
            valid = False
        if not valid:
            return_error = {"error": "Admin session is missing or expired. Please sign in again."}
            raise PermissionError(return_error["error"])

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=False)
