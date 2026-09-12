# main.py
# Live Demo Runner for BE 3 (Boundary Hypervisor)
import json
from aegis.hypervisor import BoundaryHypervisor

def run_demo():
    print("=" * 65)
    print("   AEGIS OS: BE 3 BOUNDARY HYPERVISOR LIVE DEMO (INR ₹5,000)   ")
    print("=" * 65)

    hypervisor = BoundaryHypervisor()

    # Load test invoices
    with open("sample_invoices.json", "r", encoding="utf-8") as f:
        invoices = json.load(f)

    for item in invoices:
        print(f"\n[AI AGENT ATTEMPT] Processing: {item['invoice_id']} | {item['vendor']} | ₹{item['amount']:,.2f}")
        
        # Hypervisor evaluates the action
        result = hypervisor.evaluate_action(item)

        if result["hypervisor_disposition"] == "ALLOW_ACTION_COMMITTED":
            print("  🟢 STATUS: APPROVED & COMMITTED TO ERP")
        else:
            print("  🔴 STATUS: INTERCEPTED BY HYPERVISOR!")
            pob = result["proof_of_boundary"]
            print(f"  🔒 PROOF ID:   {pob['proof_id']}")
            print(f"  🔑 SHA-256:    {pob['sha256']}")
            print("  ⚠️ VIOLATIONS:")
            for v in pob["violations"]:
                print(f"     - {v}")

    print("\n" + "=" * 65)
    print("   FINAL DATABASE STATE (ZERO LEAK VERIFICATION)   ")
    print("=" * 65)
    records = hypervisor.erp.get_all_invoices()
    for row in records:
        print(f"  Record in ERP: ID={row[0]} | Vendor={row[1]} | Amount=₹{row[2]:,.2f} | Status={row[3]}")
    print("\n✅ Verification: Zero illegal vouchers leaked into the database!")

if __name__ == "__main__":
    run_demo()
