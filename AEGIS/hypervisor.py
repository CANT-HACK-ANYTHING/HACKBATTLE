# aegis/hypervisor.py
import hashlib
import json
import uuid
from datetime import datetime, timezone
import config
from mock_system.legacy_erp import MockERP

class BoundaryHypervisor:
    """
    BE 3 Core Engine: Deterministic policy hypervisor,
    cryptographic Proof-of-Boundary (PoB), and atomic rollback.
    """

    def __init__(self):
        self.erp = MockERP()

    def generate_sha256(self, data: dict) -> str:
        """Generates an immutable SHA-256 cryptographic hash of the violation data."""
        serialized = json.dumps(data, sort_keys=True)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def evaluate_action(self, payload: dict, memory_state: dict = None) -> dict:
        """
        Pre-flight evaluation before committing actions to the ERP.
        Enforces policy invariants, currency ceilings, and blacklists.
        """
        # 1. Take atomic snapshot before mutation
        self.erp.create_snapshot()

        violations = []
        vendor = payload.get("vendor", "")
        amount = payload.get("amount", 0.0)
        action_name = payload.get("action_name", "")
        curr = config.POLICY_RULES.get("CURRENCY_SYMBOL", "₹")
        max_limit = config.POLICY_RULES["MAX_TRANSACTION_AMOUNT"]

        # 2. Check ₹5,000 spend limit
        if amount > max_limit:
            violations.append(
                f"TRANSACTION_CEILING_EXCEEDED: {curr}{amount:,.2f} > {curr}{max_limit:,.2f}"
            )

        # 3. Check vendor sanctions blacklist
        if vendor in config.POLICY_RULES["BLOCKED_VENDORS"]:
            violations.append(f"UNAUTHORIZED_VENDOR_DETECTED: '{vendor}' is on sanctions blacklist")

        # 4. Check forbidden OS commands
        if action_name in config.POLICY_RULES["BLOCKED_ACTIONS"]:
            violations.append(f"BLOCKED_CRITICAL_COMMAND: '{action_name}' is strictly forbidden")

        timestamp = datetime.now(timezone.utc).isoformat()
        default_memory = memory_state or {"nodes_cached": 6, "drift_detected": False, "drift_distance_px": 0.0}

        # 5. Handle violation: Rollback and issue SHA-256 Proof-of-Boundary
        if violations:
            self.erp.rollback()

            proof_id = f"POB-{uuid.uuid4().hex[:8].upper()}"
            proof_data = {
                "proof_id": proof_id,
                "timestamp": timestamp,
                "payload": payload,
                "violations": violations
            }
            sha256_hash = self.generate_sha256(proof_data)

            return {
                "event_type": "BOUNDARY_INTERCEPTED",
                "timestamp": timestamp,
                "payload": payload,
                "memory_state": default_memory,
                "hypervisor_disposition": "INTERCEPT_BOUNDARY_VIOLATION",
                "proof_of_boundary": {
                    "proof_id": proof_id,
                    "sha256": sha256_hash,
                    "violations": violations
                }
            }

        # 6. Action allowed: Commit to ERP
        if "invoice_id" in payload:
            self.erp.insert_invoice(payload["invoice_id"], vendor, amount)

        return {
            "event_type": "ACTION_EVALUATED",
            "timestamp": timestamp,
            "payload": payload,
            "memory_state": default_memory,
            "hypervisor_disposition": "ALLOW_ACTION_COMMITTED",
            "proof_of_boundary": None
        }
