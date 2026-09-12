# config.py
# Security policies and invariant thresholds for Aegis OS

POLICY_RULES = {
    # Currency configuration
    "CURRENCY_SYMBOL": "₹",
    "CURRENCY_CODE": "INR",

    # 1. Monetary ceiling: AI cannot authorize more than ₹5,000 autonomously
    "MAX_TRANSACTION_AMOUNT": 5000.00,
    
    # 2. Blocked dangerous actions
    "BLOCKED_ACTIONS": [
        "purge_audit_logs",
        "drop_database",
        "override_admin",
        "export_all_credentials"
    ],
    
    # 3. Blocked vendors (blacklist)
    "BLOCKED_VENDORS": [
        "GhostShell Syndicate",
        "DarkNet Offshore LLC"
    ]
}
