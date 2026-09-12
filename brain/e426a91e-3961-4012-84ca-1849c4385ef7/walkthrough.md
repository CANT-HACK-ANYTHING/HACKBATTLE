# AegisOS: Verification & Walkthrough

We have built and verified **AegisOS**, an autonomous desktop operator created specifically to win the **Track 01: AI & Automation** challenge:
> *"Rescue AI from the chat window. Give it hands, memory, and a sense of boundaries so it can actually interact with the real world without needing constant adult supervision."*

---

## 📁 Project Structure

The project has been established in your scratch space at:
`C:\Users\Piyush\.gemini\antigravity\scratch\aegis_os`

```
aegis_os/
├── config.py                   # System boundary limits ($5,000 ceiling, prohibited actions)
├── README.md                   # Full presentation pitch, architecture, & 3-minute demo script
├── run_demo.py                 # Master orchestrator for the live 3-Act hackathon demo
├── aegis/
│   ├── __init__.py
│   ├── actuator.py             # Pillar 1: "Hands" (Smooth cursor kinematics & keyboard motor control)
│   ├── perception.py           # Senses (Live screen & widget coordinate perception)
│   ├── memory.py               # Pillar 2: "Memory" (SQLite episodic state graph & self-healing)
│   ├── hypervisor.py           # Pillar 3: "Boundaries" (Deterministic policy engine, snapshot & rollback)
│   └── hud.py                  # Zero-Chat Ambient Mission Control HUD (Topmost dark-mode telemetry bar)
├── mock_system/
│   ├── __init__.py
│   ├── legacy_erp.py           # Realistic legacy enterprise software with "Chaos Mode" switch
│   ├── erp_database.db         # Persistent SQLite audit ledger
│   └── sample_invoices.json    # Test vouchers (2 valid + 1 malicious $48,900 attack payload)
└── tests/
    └── test_hypervisor.py      # Automated invariant unit tests
```

---

## 🧪 Verification Results

We verified the core boundary and memory mechanisms using automated unit testing:

```powershell
python -m unittest tests.test_hypervisor
```

**Results:**
- `test_safe_transaction_permitted`: **PASSED** (Atomic snapshot created, action marked `PERMIT_MUTATING`).
- `test_over_budget_transaction_blocked`: **PASSED** (Evaluated amount $\$48,900 > \$5,000$, intercepted with `POB-` cryptographic proof).
- `test_prohibited_action_blocked`: **PASSED** (`purge_audit_logs` intercepted before execution).
- `test_drift_detection_and_self_healing`: **PASSED** (250px Euclidean displacement detected, logged to healing history, and graph node updated).

---

## 🚀 How to Run the Live Hackathon Demo

In your terminal or PowerShell, run:

```powershell
cd C:\Users\Piyush\.gemini\antigravity\scratch\aegis_os
python run_demo.py
```

### What Happens When You Click `[▶ START LIVE 3-ACT DEMO]`:

1. **Act I: The Hands (Zero-Chat Actuation)**
   - The agent receives a voucher directive for *Apex Cloud Systems* ($1,450.00).
   - Watch the cursor physically glide across the screen, click into each form field, type the data, and click `[Process & Wire Payout]`.
   - The ledger updates instantly.

2. **Act II: Memory & Self-Learning (The Chaos Test)**
   - The Legacy ERP triggers **Chaos Mode**: the submit button relocates across the screen and changes color.
   - The agent attempts to use cached muscle memory, detects the **240px visual drift**, initiates visual relocalization, and logs the healing event to `episodic_memory.db`.
   - It clicks the relocated button and settles *DataCore Logistics* ($3,200.50) without human intervention!

3. **Act III: Boundaries & Trust (The Showstopper)**
   - A malicious voucher arrives for *GhostShell Syndicate* ($48,900.00 + command injection attempting to wipe the audit trail).
   - The **Boundary Hypervisor** intercepts the action **at the policy layer before motor actuation**.
   - The HUD flashes crimson: `⛔ BOUNDARY CONTRACT BREACH DETECTED`.
   - Generates a SHA-256 cryptographic **Proof-of-Boundary**, leaving the ledger 100% untampered.

---

## 🌐 Peak-Level Interactive Frontend Mission Control

We created a cyberpunk standalone web simulator:
- **Artifact View**: Open [aegis_mission_control.html](file:///C:/Users/Piyush/.gemini/antigravity/brain/e426a91e-3961-4012-84ca-1849c4385ef7/aegis_mission_control.html)
- **Local Project View**: [`frontend/index.html`](file:///C:/Users/Piyush/.gemini/antigravity/scratch/aegis_os/frontend/index.html)

**Frontend Features**:
- **Virtual Desktop OS Simulator**: Smooth cursor kinematics gliding across an authentic Win32 legacy ERP window with real-time field typing and button actuation.
- **Interactive HTML5 Canvas Episodic Memory Graph**: Neural landmark nodes with particle edge flows, coordinate readouts, and dynamic vector relocalization arcs that animate during self-healing.
- **Boundary Hypervisor & Proof-of-Boundary**: Real-time contract verification, emergency danger styling, and cryptographic SHA-256 audit manifest cards.
- **Synthesized Web Audio Engine**: Zero-dependency procedural sound effects (actuation clicks, relocalization chimes, and boundary warning klaxons) with sound toggle.
- **Live Local Wi-Fi Integration (BE 2)**:
  - WebSocket link: `ws://172.18.238.74:8000/ws/telemetry` with auto-reconnect and live header status badge.
  - `MEMORY_DRIFT_DETECTED` handler: Displays live warning card, moves ERP button by $\Delta x = +120\text{px}$, and animates relocalization vector.
  - `SELF_HEALING_COMPLETED` handler: Displays flashing emerald success card and turns node emerald green (`#10b981`).
  - Initial memory graph sync: `GET http://172.18.238.74:8000/api/memory/graph?task_id=vendor_payout_task` on boot.


