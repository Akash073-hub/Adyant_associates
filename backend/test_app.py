import base64
import hashlib
import hmac
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

    def test_member_login_confirms_active_membership(self):
        self.store.data = {
            "users": [{"id": "member-1", "email": "alex@example.com", "is_member": True}]
        }
        response = self.client.post(
            "/api/auth/login",
            json={"email": "Alex@Example.com"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json["member"])

    def test_member_login_rejects_non_member(self):
        response = self.client.post(
            "/api/auth/login",
            json={"email": "visitor@example.com"},
        )
        self.assertEqual(response.status_code, 403)
        self.assertFalse(response.json["member"])

    def test_student_lead_saves_optional_fields(self):
        response = self.client.post(
            "/api/student-leads",
            json={
                "email": "Student@Example.com",
                "interest": "Agentic AI Engineering",
                "current_status": "College / university student",
                "current_status_details": "Studying computer science",
            },
        )
        self.assertEqual(response.status_code, 201)
        lead = self.store.data["student_leads"][0]
        self.assertEqual(lead["email"], "student@example.com")
        self.assertEqual(lead["interest"], "Agentic AI Engineering")
        self.assertEqual(lead["current_status"], "College / university student")
        self.assertEqual(lead["current_status_details"], "Studying computer science")
        self.assertEqual(lead["visit_count"], 1)
        self.assertEqual(response.json["total_visitors"], 1)
        self.assertEqual(response.json["total_visits"], 1)

    def test_student_lead_increments_visit_count_for_repeat_visitor(self):
        self.client.post("/api/student-leads", json={"email": "visitor@example.com", "interest": "QA"})
        response = self.client.post("/api/student-leads", json={"email": "Visitor@Example.com"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(self.store.data["student_leads"]), 1)
        self.assertEqual(self.store.data["student_leads"][0]["visit_count"], 2)
        self.assertEqual(self.store.data["student_leads"][0]["interest"], "QA")
        self.assertEqual(response.json["total_visitors"], 1)
        self.assertEqual(response.json["total_visits"], 2)

    def test_member_login_is_recorded_in_store(self):
        self.store.data = {
            "users": [{"id": "member-1", "email": "alex@example.com", "name": "Alex", "is_member": True}]
        }
        response = self.client.post("/api/auth/login", json={"email": "alex@example.com"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(self.store.data["member_logins"]), 1)
        self.assertEqual(self.store.data["member_logins"][0]["email"], "alex@example.com")
        self.assertEqual(self.store.data["member_logins"][0]["status"], "success")
        self.assertEqual(self.store.data["member_logins"][0]["login_count"], 1)
        self.assertEqual(self.store.data["users"][0]["login_count"], 1)

    def test_admin_visitors_returns_counts_and_logins(self):
        admin_client = create_app(
            {
                "SECRET_KEY": "test-secret",
                "CORS_ORIGINS": "http://localhost:3000",
                "ADMIN_PASSWORD": "secret-admin-password",
            },
            self.store,
        ).test_client()
        admin_client.post("/api/student-leads", json={"email": "student@example.com"})
        admin_client.post("/api/student-leads", json={"email": "student@example.com"})
        admin_client.post("/api/auth/login", json={"email": "visitor@example.com"})
        login_res = admin_client.post(
            "/api/auth/admin-login",
            json={"email": "admin@example.com", "password": "secret-admin-password"},
        )
        token = login_res.json["token"]
        visitors_res = admin_client.get(
            "/api/admin/visitors",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(visitors_res.status_code, 200)
        self.assertEqual(visitors_res.json["summary"]["unique_student_visitors"], 1)
        self.assertEqual(visitors_res.json["summary"]["total_student_visits"], 2)
        self.assertEqual(visitors_res.json["summary"]["total_logins"], 1)

    def test_payments_config_hides_secret_and_reports_status(self):
        unconfigured = create_app(
            {"SECRET_KEY": "test-secret", "CORS_ORIGINS": "*"},
            self.store,
        ).test_client()
        res = unconfigured.get("/api/payments/config")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.json["configured"])
        self.assertEqual(res.json["key_id"], "")
        self.assertEqual(len(res.json["plans"]), 3)

        configured = create_app(
            {
                "SECRET_KEY": "test-secret",
                "CORS_ORIGINS": "*",
                "RAZORPAY_KEY_ID": "rzp_test_123456",
                "RAZORPAY_KEY_SECRET": "super_secret_key",
            },
            self.store,
        ).test_client()
        res2 = configured.get("/api/payments/config")
        self.assertEqual(res2.status_code, 200)
        self.assertTrue(res2.json["configured"])
        self.assertEqual(res2.json["key_id"], "rzp_test_123456")
        self.assertNotIn("super_secret_key", json.dumps(res2.json))

    def test_razorpay_create_order_and_verify_activates_membership(self):
        created_orders = []

        def fake_order_creator(key_id, key_secret, amount_paise, currency, receipt, notes):
            created_orders.append((amount_paise, currency, notes))
            return {"id": "order_test_999", "amount": amount_paise, "currency": currency}

        rzp_secret = "rzp_secret_abc123"
        client = create_app(
            {
                "SECRET_KEY": "test-secret",
                "CORS_ORIGINS": "*",
                "RAZORPAY_KEY_ID": "rzp_test_123456",
                "RAZORPAY_KEY_SECRET": rzp_secret,
                "MOCK_INTERVIEW_FEE_INR": "2000",
            },
            self.store,
            razorpay_order_creator=fake_order_creator,
        ).test_client()

        order_res = client.post(
            "/api/payments/razorpay/create-order",
            json={
                "name": "Asha QA",
                "email": "asha@example.com",
                "plan_id": "ready-mock-preparation",
                "preferred_time": "2026-12-01T10:00",
                "payment_method": "upi",
                "promo_code": "MOCK10",
            },
        )
        self.assertEqual(order_res.status_code, 201)
        self.assertEqual(order_res.json["order"]["id"], "order_test_999")
        self.assertEqual(order_res.json["order"]["amount"], 180000)
        self.assertEqual(created_orders[0][0], 180000)
        booking_id = order_res.json["booking"]["id"]

        bad_verify = client.post(
            "/api/payments/razorpay/verify",
            json={
                "booking_id": booking_id,
                "razorpay_order_id": "order_test_999",
                "razorpay_payment_id": "pay_test_777",
                "razorpay_signature": "invalid_sig",
            },
        )
        self.assertEqual(bad_verify.status_code, 400)

        valid_sig = hmac.new(
            rzp_secret.encode("utf-8"),
            b"order_test_999|pay_test_777",
            hashlib.sha256,
        ).hexdigest()
        verify_res = client.post(
            "/api/payments/razorpay/verify",
            json={
                "booking_id": booking_id,
                "razorpay_order_id": "order_test_999",
                "razorpay_payment_id": "pay_test_777",
                "razorpay_signature": valid_sig,
            },
        )
        self.assertEqual(verify_res.status_code, 200)
        self.assertTrue(verify_res.json["verified"])
        self.assertEqual(self.store.data["bookings"][0]["status"], "paid")
        self.assertEqual(self.store.data["payments"][0]["razorpay_payment_id"], "pay_test_777")
        self.assertTrue(any(u["email"] == "asha@example.com" and u["is_member"] for u in self.store.data["users"]))

    def test_razorpay_webhook_marks_booking_paid(self):
        self.store.data = {
            "bookings": [{
                "id": "bk_1",
                "name": "Ravi",
                "email": "ravi@example.com",
                "plan_id": "ai-for-qa-managers",
                "amount_inr": 4999,
                "currency": "INR",
                "razorpay_order_id": "order_wh_1",
                "status": "pending_payment",
            }]
        }
        webhook_secret = "whsec_test_999"
        client = create_app(
            {
                "SECRET_KEY": "test-secret",
                "CORS_ORIGINS": "*",
                "RAZORPAY_WEBHOOK_SECRET": webhook_secret,
            },
            self.store,
        ).test_client()
        raw = json.dumps({
            "event": "payment.captured",
            "payload": {"payment": {"entity": {"id": "pay_wh_1", "order_id": "order_wh_1"}}},
        }).encode("utf-8")
        sig = hmac.new(webhook_secret.encode("utf-8"), raw, hashlib.sha256).hexdigest()
        res = client.post(
            "/api/payments/razorpay/webhook",
            data=raw,
            headers={"Content-Type": "application/json", "X-Razorpay-Signature": sig},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(self.store.data["bookings"][0]["status"], "paid")
        self.assertEqual(self.store.data["payments"][0]["source"], "webhook:payment.captured")

    def test_missing_github_configuration_is_explicit(self):
        client = create_app({"SECRET_KEY": "test-secret", "CORS_ORIGINS": "*"}).test_client()
        response = client.post(
            "/api/support", json={"question": "How do I choose a program?"}
        )
        self.assertEqual(response.status_code, 503)
        self.assertIn("GITHUB_TOKEN", response.json["error"])


if __name__ == "__main__":
    unittest.main()
