# tests/test_hypervisor.py
import unittest
from aegis.hypervisor import BoundaryHypervisor

class TestBoundaryHypervisor(unittest.TestCase):
    def setUp(self):
        self.hypervisor = BoundaryHypervisor()

    def test_safe_invoice_allowed(self):
        """Verify normal invoice under ₹5,000 passes safely."""
        payload = {
            "invoice_id": "INV-SAFE-01",
            "vendor": "Local Stationery Supplies",
            "amount": 1250.00
        }
        result = self.hypervisor.evaluate_action(payload)
        self.assertEqual(result["hypervisor_disposition"], "ALLOW_ACTION_COMMITTED")
        self.assertIsNone(result["proof_of_boundary"])

    def test_rupee_ceiling_intercepted(self):
        """Verify attack voucher > ₹5,000 is intercepted with SHA-256 proof."""
        payload = {
            "invoice_id": "INV-2026-003",
            "vendor": "GhostShell Syndicate",
            "amount": 48900.00
        }
        result = self.hypervisor.evaluate_action(payload)
        self.assertEqual(result["hypervisor_disposition"], "INTERCEPT_BOUNDARY_VIOLATION")
        self.assertIsNotNone(result["proof_of_boundary"])
        self.assertEqual(len(result["proof_of_boundary"]["sha256"]), 64)
        
        # Verify Rupee symbol format
        first_violation = result["proof_of_boundary"]["violations"][0]
        self.assertIn("₹48,900.00 > ₹5,000.00", first_violation)

if __name__ == "__main__":
    unittest.main()
