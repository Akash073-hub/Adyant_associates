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
import re
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


def is_active_member_record(user: dict[str, Any], email: str) -> bool:
    if user.get("email", "").strip().lower() != email or user.get("is_member") is not True:
        return False
    expires_at = user.get("membership_expires_at")
    if not expires_at:
        return True
    try:
        expiry = datetime.fromisoformat(str(expires_at).replace("Z", "+00:00"))
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=UTC)
    except ValueError:
        return False
    return datetime.now(UTC) < expiry


def hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 310_000).hex()


def password_matches(password: str, salt: str, expected_hash: str) -> bool:
    if not password or not salt or not expected_hash:
        return False
    actual_hash = hash_password(password, salt)
    return hmac.compare_digest(actual_hash, expected_hash)


def validate_managed_link(value: str, label: str) -> None:
    if not value:
        return
    parsed = urlparse(value)
    if value.startswith("/") and not value.startswith("//") or value.startswith("#"):
        return
    if parsed.scheme in {"http", "https"} and parsed.netloc:
        return
    raise ValueError(f"{label} must be a site path, anchor, or http(s) URL.")


def normalize_program(payload: dict[str, Any]) -> dict[str, Any]:
    title = str(payload.get("title", "")).strip()
    program_id = str(payload.get("id", "")).strip().lower()
    if not title or not program_id:
        raise ValueError("Program title and ID are required.")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", program_id):
        raise ValueError("Program ID must use lowercase letters, numbers, and hyphens.")
    highlights = payload.get("highlights", [])
    if isinstance(highlights, str):
        highlights = [item.strip() for item in highlights.split(",") if item.strip()]
    if not isinstance(highlights, list):
        raise ValueError("Program highlights must be a list or comma-separated text.")
    status = str(payload.get("status", "available")).strip().lower()
    if status not in {"available", "coming_soon", "hidden"}:
        raise ValueError("Program status must be available, coming_soon, or hidden.")
    for field, label in (("syllabus_url", "Syllabus link"), ("action_url", "Action link"), ("program_url", "Program link")):
        validate_managed_link(str(payload.get(field, "")).strip(), label)
    return {
        "id": program_id,
        "title": title[:120],
        "type": str(payload.get("type", "Program")).strip()[:80],
        "format": str(payload.get("format", "Self-paced")).strip()[:80],
        "description": str(payload.get("description", "")).strip()[:1000],
        "price_label": str(payload.get("price_label", "Start")).strip()[:40],
        "action_label": str(payload.get("action_label", "Enroll now")).strip()[:60],
        "rating": str(payload.get("rating", "")).strip()[:20],
        "alumni": str(payload.get("alumni", "")).strip()[:40],
        "old_price": str(payload.get("old_price", "")).strip()[:40],
        "highlights": [str(item).strip()[:80] for item in highlights if str(item).strip()][:12],
        "syllabus_url": str(payload.get("syllabus_url", "")).strip()[:300],
        "action_url": str(payload.get("action_url", "")).strip()[:300],
        "program_url": str(payload.get("program_url", "")).strip()[:300],
        "featured": bool(payload.get("featured", False)),
        "status": status,
    }


def normalize_cohort(payload: dict[str, Any], programs: list[dict[str, Any]]) -> dict[str, Any]:
    cohort_title = str(payload.get("title", "")).strip()
    program_id = str(payload.get("program_id", "")).strip()
    if not cohort_title or not program_id:
        raise ValueError("Cohort title and program are required.")
    if not any(program.get("id") == program_id for program in programs):
        raise ValueError("Choose an existing program for this cohort.")
    start_date = str(payload.get("start_date", "")).strip()
    try:
        datetime.strptime(start_date, "%Y-%m-%d")
    except ValueError as error:
        raise ValueError("Start date must use YYYY-MM-DD format.") from error
    try:
        seats_total = int(payload.get("seats_total", 0))
        seats_taken = int(payload.get("seats_taken", 0))
    except (TypeError, ValueError) as error:
        raise ValueError("Seat totals must be whole numbers.") from error
    if seats_total < 0 or seats_taken < 0 or seats_taken > seats_total:
        raise ValueError("Seat counts must be non-negative and taken seats cannot exceed capacity.")
    if not str(payload.get("schedule", "")).strip():
        raise ValueError("Schedule is required.")
    status = str(payload.get("status", "open")).strip().lower()
    if status not in {"open", "soon", "closed"}:
        raise ValueError("Cohort status must be open, soon, or closed.")
    validate_managed_link(str(payload.get("booking_url", "")).strip(), "Booking link")
    cohort_id = str(payload.get("id", "")).strip().lower()
    if not cohort_id:
        cohort_id = re.sub(r"[^a-z0-9]+", "-", f"{program_id}-{start_date}-{cohort_title}".lower()).strip("-")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", cohort_id):
        raise ValueError("Cohort ID must use lowercase letters, numbers, and hyphens.")
    return {
        "id": cohort_id[:120],
        "program_id": program_id,
        "title": cohort_title[:120],
        "start_date": start_date,
        "schedule": str(payload.get("schedule", "")).strip()[:120],
        "time_ist": str(payload.get("time_ist", "")).strip()[:120],
        "time_est": str(payload.get("time_est", "")).strip()[:120],
        "instructor": str(payload.get("instructor", "")).strip()[:200],
        "instructor_role": str(payload.get("instructor_role", "")).strip()[:100],
        "seats_total": seats_total,
        "seats_taken": seats_taken,
        "booking_url": str(payload.get("booking_url", "")).strip()[:300],
        "status": status,
    }


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
    "programs": [],
    "cohorts": [],
    "catalog_meta": [],
}

PROGRAMS = [
    {
        "id": "ai-for-qa-managers",
        "title": "AI for QA Managers",
        "type": "Leadership",
        "format": "Self-paced",
        "description": "Adopt AI across quality operations with practical governance, team workflows, risk controls, and outcome-based implementation guidance.",
        "price_label": "Start",
        "action_label": "Start this program",
        "rating": "5.0",
        "alumni": "New",
        "old_price": "",
        "highlights": ["AI strategy", "Responsible adoption", "Team playbooks"],
        "syllabus_url": "/syllabus/ai-for-qa-managers",
        "action_url": "/membership#curriculum",
        "program_url": "/membership#track-ai-for-qa-managers",
        "featured": True,
        "status": "available",
    },
    {
        "id": "interview-preparation-guide",
        "title": "Interview Preparation Guide",
        "type": "Career Prep",
        "format": "Self-paced",
        "description": "Prepare for QA manager and automation leadership interviews with role-specific questions, frameworks, stories, and practice plans.",
        "price_label": "Start",
        "action_label": "Start this program",
        "rating": "5.0",
        "alumni": "New",
        "old_price": "",
        "highlights": ["Role research", "Answer frameworks", "Practice plan"],
        "syllabus_url": "/membership#curriculum",
        "action_url": "/membership#curriculum",
        "program_url": "/membership#track-interview-preparation-guide",
        "featured": False,
        "status": "available",
    },
    {
        "id": "ready-mock-preparation",
        "title": "Ready Mock Preparation",
        "type": "Practice",
        "format": "Live interview",
        "description": "Take a realistic mock interview with targeted questions, answer feedback, and a clear action plan for your next opportunity.",
        "price_label": "Book",
        "action_label": "Book your mock",
        "rating": "5.0",
        "alumni": "New",
        "old_price": "",
        "highlights": ["Mock questions", "Expert feedback", "Next steps"],
        "syllabus_url": "/membership#curriculum",
        "action_url": "/checkout",
        "program_url": "/membership#track-ready-mock-preparation",
        "featured": False,
        "status": "available",
    },
]

COHORTS = [
    {
        "id": "ai-for-qa-managers-oct-2026",
        "program_id": "ai-for-qa-managers",
        "title": "Practical AI leadership workshop",
        "start_date": "2026-10-26",
        "schedule": "Sat & Sun",
        "time_ist": "07:30 PM – 10:00 PM IST",
        "time_est": "10:00 AM – 12:30 PM EST",
        "instructor": "Ganapati Heregange, Gaurish Hebbar & Kiran Kodlekere",
        "instructor_role": "QA Lecturers",
        "seats_total": 20,
        "seats_taken": 10,
        "booking_url": "/membership#curriculum",
        "status": "open",
    },
    {
        "id": "interview-preparation-guide-nov-2026",
        "program_id": "interview-preparation-guide",
        "title": "Role-focused preparation sessions",
        "start_date": "2026-11-04",
        "schedule": "Mon - Thu",
        "time_ist": "08:00 PM – 09:30 PM IST",
        "time_est": "10:30 AM – 12:00 PM EST",
        "instructor": "Ganapati Heregange",
        "instructor_role": "Interview Coach",
        "seats_total": 20,
        "seats_taken": 8,
        "booking_url": "/membership#curriculum",
        "status": "open",
    },
    {
        "id": "ready-mock-preparation-nov-2026",
        "program_id": "ready-mock-preparation",
        "title": "Live mock interview practice",
        "start_date": "2026-11-15",
        "schedule": "Sat & Sun",
        "time_ist": "06:00 PM – 08:30 PM IST",
        "time_est": "08:30 AM – 11:00 AM EST",
        "instructor": "Ganapati Heregange, Gaurish Hebbar & Kiran Kodlekere",
        "instructor_role": "QA Lecturers",
        "seats_total": 12,
        "seats_taken": 6,
        "booking_url": "/checkout",
        "status": "soon",
    },
]

BOOKING_PROMO_CODES = {
    "MOCK10": 10,
    "FIRSTMOCK15": 15,
}


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
            "mock_interview_requests": ["id", "created_date", "created_time", "name", "email", "message"],
            "reset_requests": ["id", "created_date", "created_time", "email"],
            "bookings": ["id", "created_date", "created_time", "name", "email", "preferred_time", "payment_method", "promo_code", "discount_percent", "status"],
            "videos": ["id", "created_date", "created_time", "title", "url", "description"],
            "programs": ["id", "title", "type", "format", "description", "price_label", "action_label", "status", "highlights", "syllabus_url", "action_url", "program_url"],
            "cohorts": ["id", "program_id", "title", "start_date", "schedule", "time_ist", "time_est", "instructor", "instructor_role", "seats_total", "seats_taken", "status", "booking_url"],
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

    def catalog_records(data: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        initialized = bool(data.get("catalog_meta"))
        programs = data["programs"] if initialized else data["programs"] or PROGRAMS
        cohorts = data["cohorts"] if initialized else data["cohorts"] or COHORTS
        return json.loads(json.dumps(programs)), json.loads(json.dumps(cohorts))

    def initialize_catalog(data: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        programs, cohorts = catalog_records(data)
        data["programs"] = programs
        data["cohorts"] = cohorts
        data["catalog_meta"] = [{"id": "catalog-v1", "initialized": True}]
        return programs, cohorts

    def send_support_email(subject: str, body: str, reply_to: str | None = None) -> None:
        smtp_host = env.get("SMTP_HOST", "").strip()
        smtp_username = env.get("SMTP_USERNAME", "").strip()
        smtp_password = env.get("SMTP_PASSWORD", "")
        from_email = env.get("SMTP_FROM_EMAIL", smtp_username).strip()
        try:
            smtp_port = int(env.get("SMTP_PORT", "587"))
        except ValueError as error:
            raise ConfigurationError("SMTP_PORT must be a valid port number.") from error
        missing_settings = [
            key for key, value in {
                "SMTP_HOST": smtp_host,
                "SMTP_USERNAME": smtp_username,
                "SMTP_PASSWORD": smtp_password,
                "SMTP_FROM_EMAIL": from_email,
                "SUPPORT_EMAIL": support_email,
            }.items() if not value
        ]
        if missing_settings:
            raise ConfigurationError(
                f"Set {', '.join(missing_settings)} in backend/.env to send email."
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
        data, _ = persistence.read()
        catalog_programs, cohorts = catalog_records(data)
        public_programs = [program for program in catalog_programs if program.get("status", "available") != "hidden"]
        program_titles = {program.get("id"): program.get("title", "") for program in public_programs}
        public_cohorts = [
            {
                **cohort,
                "program_title": program_titles.get(cohort.get("program_id"), ""),
                "seats_available": max(0, int(cohort.get("seats_total", 0)) - int(cohort.get("seats_taken", 0))),
                "status": "closed" if cohort.get("status") == "open" and int(cohort.get("seats_total", 0)) <= int(cohort.get("seats_taken", 0)) else cohort.get("status", "closed"),
            }
            for cohort in cohorts
            if cohort.get("program_id") in program_titles
        ]
        return jsonify({"programs": public_programs, "cohorts": public_cohorts})

    @app.route("/api/admin/programs", methods=["GET", "POST"])
    def manage_programs() -> Any:
        require_admin()
        if request.method == "GET":
            data, _ = persistence.read()
            catalog_programs, _ = catalog_records(data)
            return jsonify({"programs": catalog_programs})
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "Request body must be a JSON object."}), 400
        title = str(payload.get("title", "")).strip()
        if not title:
            return jsonify({"error": "Program title is required."}), 400
        record_id = str(payload.get("id", "")).strip().lower() or re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
        if not record_id or len(record_id) > 100:
            return jsonify({"error": "Program ID must be a short slug."}), 400
        try:
            normalized = normalize_program({**payload, "id": record_id, "title": title})
        except ValueError as error:
            return jsonify({"error": str(error)}), 400
        with persistence_lock:
            data, sha = persistence.read()
            catalog_programs, _ = initialize_catalog(data)
            if any(program.get("id") == record_id for program in catalog_programs):
                return jsonify({"error": "A program with this ID already exists."}), 409
            catalog_programs.append(normalized)
            data["programs"] = catalog_programs
            persistence.write(data, sha)
        return jsonify({"program": normalized}), 201

    @app.route("/api/admin/programs/<program_id>", methods=["PUT", "DELETE"])
    def update_program(program_id: str) -> Any:
        require_admin()
        with persistence_lock:
            data, sha = persistence.read()
            catalog_programs, cohorts = initialize_catalog(data)
            program = next((item for item in catalog_programs if item.get("id") == program_id), None)
            if not program:
                return jsonify({"error": "Program not found."}), 404
            if request.method == "DELETE":
                data["programs"] = [item for item in catalog_programs if item.get("id") != program_id]
                data["cohorts"] = [item for item in cohorts if item.get("program_id") != program_id]
                persistence.write(data, sha)
                return jsonify({"deleted": True})
            payload = request.get_json(silent=True)
            if not isinstance(payload, dict):
                return jsonify({"error": "Request body must be a JSON object."}), 400
            changes = {**program, **payload, "id": program_id}
            try:
                normalized = normalize_program(changes)
            except ValueError as error:
                return jsonify({"error": str(error)}), 400
            data["programs"] = [normalized if item.get("id") == program_id else item for item in catalog_programs]
            persistence.write(data, sha)
        return jsonify({"program": normalized})

    @app.route("/api/admin/cohorts", methods=["GET", "POST"])
    def manage_cohorts() -> Any:
        require_admin()
        if request.method == "GET":
            data, _ = persistence.read()
            _, catalog_cohorts = catalog_records(data)
            return jsonify({"cohorts": catalog_cohorts})
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "Request body must be a JSON object."}), 400
        with persistence_lock:
            data, sha = persistence.read()
            catalog_programs, catalog_cohorts = initialize_catalog(data)
            try:
                normalized = normalize_cohort(payload, catalog_programs)
            except ValueError as error:
                return jsonify({"error": str(error)}), 400
            if any(cohort.get("id") == normalized["id"] for cohort in catalog_cohorts):
                return jsonify({"error": "A cohort with this ID already exists."}), 409
            catalog_cohorts.append(normalized)
            data["cohorts"] = catalog_cohorts
            persistence.write(data, sha)
        return jsonify({"cohort": normalized}), 201

    @app.route("/api/admin/cohorts/<cohort_id>", methods=["PUT", "DELETE"])
    def update_cohort(cohort_id: str) -> Any:
        require_admin()
        with persistence_lock:
            data, sha = persistence.read()
            catalog_programs, catalog_cohorts = initialize_catalog(data)
            cohort = next((item for item in catalog_cohorts if item.get("id") == cohort_id), None)
            if not cohort:
                return jsonify({"error": "Cohort not found."}), 404
            if request.method == "DELETE":
                data["cohorts"] = [item for item in catalog_cohorts if item.get("id") != cohort_id]
                persistence.write(data, sha)
                return jsonify({"deleted": True})
            payload = request.get_json(silent=True)
            if not isinstance(payload, dict):
                return jsonify({"error": "Request body must be a JSON object."}), 400
            try:
                normalized = normalize_cohort({**cohort, **payload, "id": cohort_id}, catalog_programs)
            except ValueError as error:
                return jsonify({"error": str(error)}), 400
            data["cohorts"] = [normalized if item.get("id") == cohort_id else item for item in catalog_cohorts]
            persistence.write(data, sha)
        return jsonify({"cohort": normalized})

    @app.route("/api/admin/bookings", methods=["GET"])
    def admin_bookings() -> Any:
        require_admin()
        data, _ = persistence.read()
        return jsonify({"bookings": data["bookings"]})

    @app.route("/api/admin/bookings/<booking_id>", methods=["PUT", "DELETE"])
    def update_booking(booking_id: str) -> Any:
        require_admin()
        with persistence_lock:
            data, sha = persistence.read()
            booking = next((item for item in data["bookings"] if item.get("id") == booking_id), None)
            if not booking:
                return jsonify({"error": "Booking not found."}), 404
            if request.method == "DELETE":
                data["bookings"] = [item for item in data["bookings"] if item.get("id") != booking_id]
                persistence.write(data, sha)
                return jsonify({"deleted": True})
            payload = request.get_json(silent=True)
            if not isinstance(payload, dict):
                return jsonify({"error": "Request body must be a JSON object."}), 400
            status = str(payload.get("status", booking.get("status", ""))).strip().lower()
            allowed_statuses = {"pending_payment", "paid", "confirmed", "active", "cancelled", "completed", "rejected"}
            if status not in allowed_statuses:
                return jsonify({"error": "Booking status is not valid."}), 400
            for key in ("name", "email", "preferred_time"):
                if key in payload:
                    booking[key] = str(payload[key]).strip()
            booking["status"] = status
            persistence.write(data, sha)
        return jsonify({"booking": booking})

    @app.post("/api/assessments")
    def create_assessment() -> Any:
        payload = require_json({"role", "stack", "goal"})
        record = save_record("assessments", payload)
        return jsonify({"assessment": record}), 201

    @app.post("/api/auth/login")
    def login() -> Any:
        payload = require_json({"email"})
        if not isinstance(payload["email"], str):
            return jsonify({"error": "Enter a valid email address."}), 400
        email = payload["email"].strip().lower()
        developer_email = env.get("DEVELOPER_ACCESS_EMAIL", "").strip().lower()
        data, _ = persistence.read()
        member_record = next((user for user in data["users"] if is_active_member_record(user, email)), None)
        is_member = member_record is not None or any(
            booking.get("email", "").strip().lower() == email
            and booking.get("status", "").lower() in {"paid", "confirmed", "active"}
            for booking in data["bookings"]
        )
        if not is_member:
            if developer_email and email == developer_email:
                return jsonify({
                    "member": True,
                    "developer_access": True,
                    "token": issue_token(email),
                    "name": "",
                    "message": "Developer access confirmed.",
                }), 200
            return jsonify({"member": False, "message": "We couldn't find an active membership for this email. Browse as a student or contact support if you believe this is a mistake."}), 403
        if member_record and member_record.get("password_hash"):
            password = payload.get("password", "")
            if not isinstance(password, str) or not password_matches(
                password, member_record.get("password_salt", ""), member_record["password_hash"]
            ):
                return jsonify({"error": "The email or password is incorrect."}), 401
        return jsonify({
            "member": True,
            "token": issue_token(email),
            "name": member_record.get("name", "") if member_record else "",
            "message": "An active membership was found for this email.",
        }), 200

    @app.route("/api/auth/profile", methods=["GET", "POST"])
    def student_profile() -> Any:
        email = require_student()
        if request.method == "GET":
            data, _ = persistence.read()
            member = next(
                (user for user in data["users"] if is_active_member_record(user, email)),
                None,
            )
            if not member:
                return jsonify({"error": "An active member profile was not found."}), 404
            return jsonify({"email": email, "name": member.get("name", ""), "has_password": bool(member.get("password_hash"))})

        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "Request body must be a JSON object."}), 400
        name = str(payload.get("name", "")).strip()
        new_password = payload.get("new_password", "")
        current_password = payload.get("current_password", "")
        if len(name) > 120:
            return jsonify({"error": "Name must be 120 characters or fewer."}), 400
        if new_password and (not isinstance(new_password, str) or len(new_password) < 8):
            return jsonify({"error": "New password must be at least 8 characters."}), 400
        with persistence_lock:
            data, sha = persistence.read()
            member = next(
                (user for user in data["users"] if is_active_member_record(user, email)),
                None,
            )
            if not member:
                return jsonify({"error": "An active member profile was not found."}), 404
            if new_password:
                if member.get("password_hash") and not password_matches(
                    current_password if isinstance(current_password, str) else "",
                    member.get("password_salt", ""),
                    member["password_hash"],
                ):
                    return jsonify({"error": "Current password is incorrect."}), 401
                salt = secrets.token_hex(16)
                member["password_salt"] = salt
                member["password_hash"] = hash_password(new_password, salt)
            member["name"] = name
            persistence.write(data, sha)
        return jsonify({"email": email, "name": name, "has_password": bool(member.get("password_hash")), "message": "Profile updated."})

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
        return jsonify({"videos": [{key: value for key, value in video.items() if key != "description"} for video in data["videos"]]})

    @app.route("/api/admin/videos", methods=["GET", "POST"])
    def manage_videos() -> Any:
        require_admin()
        if request.method == "GET":
            data, _ = persistence.read()
            return jsonify({"videos": [{key: value for key, value in video.items() if key != "description"} for video in data["videos"]]})

        payload = require_json({"title", "url"})
        url = payload["url"].strip()
        parsed_url = urlparse(url)
        if parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
            return jsonify({"error": "Video URL must start with http:// or https://."}), 400
        record = save_record("videos", {
            "title": payload["title"].strip(),
            "url": url,
        })
        return jsonify({"video": record}), 201

    @app.route("/api/admin/videos/<video_id>", methods=["PUT", "DELETE"])
    def update_video(video_id: str) -> Any:
        require_admin()
        with persistence_lock:
            data, sha = persistence.read()
            video = next((item for item in data["videos"] if item.get("id") == video_id), None)
            if not video:
                return jsonify({"error": "Video not found."}), 404
            if request.method == "DELETE":
                data["videos"] = [item for item in data["videos"] if item.get("id") != video_id]
                persistence.write(data, sha)
                return jsonify({"deleted": True})
            payload = request.get_json(silent=True)
            if not isinstance(payload, dict):
                return jsonify({"error": "Request body must be a JSON object."}), 400
            title = str(payload.get("title", video.get("title", ""))).strip()
            url = str(payload.get("url", video.get("url", ""))).strip()
            parsed_url = urlparse(url)
            if not title:
                return jsonify({"error": "Video title is required."}), 400
            if parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
                return jsonify({"error": "Video URL must start with http:// or https://."}), 400
            video.update({
                "title": title[:120],
                "url": url,
            })
            video.pop("description", None)
            persistence.write(data, sha)
        return jsonify({"video": video})

    @app.post("/api/auth/reset")
    def reset() -> Any:
        payload = require_json({"email"})
        record = save_record("reset_requests", {"email": payload["email"].lower()})
        return jsonify({"request": record, "message": "If the email matches a purchase, instructions will be sent shortly."}), 202

    @app.post("/api/mock-interview-requests")
    def mock_interview_request() -> Any:
        payload = require_json({"name", "email"})
        email = payload["email"].strip()
        record = save_record("mock_interview_requests", {
            "name": payload["name"].strip(),
            "email": email,
            "message": str(payload.get("message", "Please send me a Google Meet link for the mock interview.")).strip(),
        })
        body = (
            "A new mock interview request was submitted.\n\n"
            f"Name: {record['name']}\nEmail: {email}\n"
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

    @app.post("/api/bookings/validate-promo")
    def validate_booking_promo() -> Any:
        payload = require_json({"code"})
        code = payload["code"].strip().upper()
        discount_percent = BOOKING_PROMO_CODES.get(code)
        if discount_percent is None:
            return jsonify({"valid": False, "error": "That booking code is not valid."}), 400
        return jsonify({"valid": True, "code": code, "discount_percent": discount_percent})

    @app.post("/api/bookings")
    def booking() -> Any:
        payload = require_json({"email", "payment_method"})
        if payload["payment_method"] not in {"upi", "card", "bank", "po"}:
            return jsonify({"error": "payment_method must be one of upi, card, bank, or po"}), 400
        email = payload["email"].strip().lower()
        name = str(payload.get("name", "")).strip()
        preferred_time = str(payload.get("preferred_time", "")).strip()
        promo_code = str(payload.get("promo_code", "")).strip().upper()
        if len(name) > 120:
            return jsonify({"error": "Name must be 120 characters or fewer."}), 400
        discount_percent = BOOKING_PROMO_CODES.get(promo_code, 0) if promo_code else 0
        if promo_code and not discount_percent:
            return jsonify({"error": "That booking code is not valid."}), 400
        record = save_record("bookings", {
            "name": name,
            "email": email,
            "preferred_time": preferred_time,
            "payment_method": payload["payment_method"],
            "promo_code": promo_code,
            "discount_percent": discount_percent,
            "status": "pending_payment",
        })
        body = (
            "A mock interview booking was created and is awaiting payment.\n\n"
            f"Booking ID: {record['id']}\nName: {name or 'Not provided'}\nEmail: {email}\n"
            f"Preferred date/time: {preferred_time or 'Not provided'}\n"
            f"Payment method: {record['payment_method']}\n"
            f"Booking code: {promo_code or 'None'} ({discount_percent}% discount)\n"
            "Status: Pending payment"
        )
        email_sent = True
        notification_error = ""
        try:
            send_support_email("Mock interview booking created", body, email)
        except (ConfigurationError, RuntimeError, ValueError) as error:
            email_sent = False
            notification_error = str(error)
        response = {"booking": record, "email_sent": email_sent}
        if notification_error:
            response["notification_message"] = "Booking saved, but the team email could not be sent."
            response["notification_error"] = notification_error
        return jsonify(response), 201

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

    def require_student() -> str:
        authorization = request.headers.get("Authorization", "")
        token = authorization.removeprefix("Bearer ").strip()
        try:
            decoded = base64.urlsafe_b64decode(token.encode()).decode()
            email, timestamp, supplied_signature = decoded.rsplit(".", 2)
            message = f"{email}.{timestamp}".encode()
            expected_signature = hmac.new(
                app.config["SECRET_KEY"].encode(), message, hashlib.sha256
            ).hexdigest()
            token_age = datetime.now(UTC).timestamp() - int(timestamp)
            valid = (
                "@" in email
                and token_age >= 0
                and token_age <= 12 * 60 * 60
                and hmac.compare_digest(supplied_signature, expected_signature)
            )
        except (ValueError, UnicodeDecodeError, binascii.Error):
            valid = False
            email = ""
        if not valid:
            raise PermissionError("Member session is missing or expired. Please sign in again.")
        return email

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=False)
