import base64
import json
import unittest

from app import GitHubStore, create_app


class MemoryStore(GitHubStore):
    def __init__(self):
        super().__init__({"GITHUB_TOKEN": "test", "GITHUB_REPOSITORY": "owner/repo"})
        self.data = {}

    def read(self):
        return self._normalise(self.data), "test-sha"

    def write(self, data, sha):
        self.data = json.loads(json.dumps(data))


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.store = MemoryStore()
        self.client = create_app(
            {
                "SECRET_KEY": "test-secret",
                "CORS_ORIGINS": "http://localhost:3000",
            },
            self.store,
        ).test_client()

    def test_health_and_programs(self):
        self.assertEqual(self.client.get("/api/health").status_code, 200)
        response = self.client.get("/api/programs")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["programs"]), 3)

    def test_assessment_is_persisted(self):
        response = self.client.post(
            "/api/assessments",
            json={"role": "Junior QA Automation", "stack": "Ready Mock Preparation", "goal": "Switch from Manual to SDET"},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.store.data["assessments"][0]["role"], "Junior QA Automation")

    def test_booking_rejects_unknown_payment_method(self):
        response = self.client.post(
            "/api/bookings", json={"email": "learner@example.com", "payment_method": "cash"}
        )
        self.assertEqual(response.status_code, 400)

    def test_login_returns_signed_token(self):
        response = self.client.post(
            "/api/auth/login",
            json={"username": "alex.sdet", "email": "Alex@Example.com"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json["token"])
        self.assertEqual(self.store.data["users"][0]["email"], "alex@example.com")

    def test_missing_github_configuration_is_explicit(self):
        client = create_app({"SECRET_KEY": "test-secret", "CORS_ORIGINS": "*"}).test_client()
        response = client.post(
            "/api/support", json={"question": "How do I choose a program?"}
        )
        self.assertEqual(response.status_code, 503)
        self.assertIn("GITHUB_TOKEN", response.json["error"])


if __name__ == "__main__":
    unittest.main()
