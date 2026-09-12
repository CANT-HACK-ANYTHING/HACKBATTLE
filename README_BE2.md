# AegisOS // BE 2: Episodic Memory, SQLite State Graph & Self-Healing Engine

> **Subsystem**: `BE 2`  
> **Status**: Verified, 18/18 Automated Tests Passing, 100% Production Ready  
> **Primary Responsibility**: Persistent Episodic State Graph (SQLite), Visual Drift Detection & Autonomous Self-Healing Re-anchoring routines.

---

## 🏛️ Architecture & The Mathematical Model

In AegisOS, AI agents are rescued from brittle pixel-level scripts through persistent visual-spatial memory.

### 1. Formal State Definition
Every operational state is formally captured as:
$$\text{State}_t = \langle \text{NodeID}, \mathcal{H}_{visual}, \mathcal{L}, \mathcal{B}, \mathcal{A} \rangle$$
- $\mathcal{H}_{visual}$: 64-bit Difference Perceptual Hash (`dHash`), invariant to lighting, contrast, and scaling.
- $\mathcal{L}$: Semantic landmarks (`["btn_submit_blue", "status_bar_ready"]`).
- $\mathcal{B} = [x, y, w, h]$: Normalized spatial bounding box in $[0, 1000]$ coordinate space.
- $\mathcal{A}$: Parameterized OS action (`CLICK`, `TYPE`, `HOTKEY`, `SCROLL`).

### 2. Multi-Tier Drift Metric
When a visual state is observed on screen:
$$D = w_h \cdot \frac{\text{Hamming}(\mathcal{H}_{obs}, \mathcal{H}_{ref})}{64} + w_s \cdot \frac{\|\mathbf{c}_{obs} - \mathbf{c}_{ref}\|_2}{D_{max}} + w_a \cdot \frac{|A_{obs} - A_{ref}|}{\max(A_{obs}, A_{ref})}$$
- **$D \le 0.15$ (`MATCH`)**: **Fast-Path Macro Replay**. Dispatches $(x, y)$ to mouse actuator in $<2\text{ms}$.
- **$0.15 < D \le 0.55$ (`DRIFT`)**: **UI Drift Detected**. Triggers **Autonomous Self-Healing**.
- **$D > 0.55$ (`ANOMALY`)**: Unrecognized modal or severe UI reorganization. Halts or queries multimodal vision core.

### 3. Self-Healing Re-Anchoring Routine
$$\Delta \mathbf{c} = [\Delta x, \Delta y]$$
$$\mathcal{B}_{updated} = [x + \Delta x, y + \Delta y, w_{new}, h_{new}]$$
1. Atomically updates the SQLite `nodes` table with new coordinates and observed visual hash.
2. Changes status from `DRIFTED` $\to$ `HEALED` (nodes turn green on FE 2 Canvas Graph).
3. Appends an immutable audit log to `healing_logs`.
4. Restores instant muscle memory so the next pass executes directly without hesitation.

---

## 🔌 Teammate Integration Guide & Contracts

### For FE 2 (Canvas Graph & Neural-Memory Simulator Lead)
- **REST Endpoint**: `GET http://127.0.0.1:8000/api/memory/graph?task_id=vendor_payout_task`
- **Output Schema**:
```json
{
  "task_id": "vendor_payout_task",
  "total_nodes": 5,
  "total_edges": 4,
  "drift_count": 0,
  "healed_count": 1,
  "nodes": [
    {
      "id": "node_step5_submit_payment",
      "label": "5. Submit Vendor Payout",
      "step_index": 5,
      "x": 840.0,
      "y": 450.0,
      "status": "HEALED",
      "color": "#10b981",
      "heal_count": 1,
      "action_type": "click"
    }
  ],
  "edges": [
    {
      "source": "node_step4_input_amount",
      "target": "node_step5_submit_payment",
      "confidence": 1.0,
      "executions": 0
    }
  ]
}
```
- **Node Colors**:
  - `#3b82f6` (Electric Blue) = `LEARNED`
  - `#06b6d4` (Cyan) = `ACTIVE`
  - `#f59e0b` (Amber) = `DRIFTED`
  - `#10b981` (Emerald Green) = `HEALED`
  - `#ef4444` (Crimson) = `LOCKED` (Boundary Halt)

---

### For FE 1 (Glassmorphic HUD Lead)
- **WebSocket Endpoint**: `ws://127.0.0.1:8000/ws/telemetry`
- **Live Event Stream Payload**:
```json
{
  "event_type": "MEMORY_DRIFT_DETECTED",
  "timestamp": "2026-09-12T07:12:00.000Z",
  "task_id": "vendor_payout_task",
  "node_id": "node_step5_submit_payment",
  "payload": {
    "drift_score": 0.2,
    "delta_x": 120.0,
    "delta_y": 0.0
  },
  "summary": "[MEMORY DRIFT DETECTED: Button 'Submit' relocated (Δx=+120px)]"
}
```
followed by:
```json
{
  "event_type": "SELF_HEALING_COMPLETED",
  "timestamp": "2026-09-12T07:12:00.150Z",
  "task_id": "vendor_payout_task",
  "node_id": "node_step5_submit_payment",
  "payload": {
    "delta_x": 120.0,
    "heal_count": 1,
    "status": "HEALED"
  },
  "summary": "[SELF-HEALING: Visual relocalization successful. Updated Episode #104. Node turns green.]"
}
```

---

### For BE 1 (OS Actuator & Vision Hooks Lead)
Call the `ActuatorMemoryBridge` in Python or via HTTP `POST /api/memory/drift-check`:
```python
from backend.app.contracts.be1_actuator_contract import ActuatorMemoryBridge, PerceptualStateObservation
from backend.app.memory import GraphStore, DriftDetector, BoundingBox

store = GraphStore()
detector = DriftDetector(store)
bridge = ActuatorMemoryBridge(store, detector)

obs = PerceptualStateObservation(
    task_id="vendor_payout_task",
    step_index=5,
    visual_hash="e5b4a3f2d1c04123",
    bbox=BoundingBox(x=840.0, y=450.0, w=140.0, h=42.0),
    target_element="btn_submit"
)

# Returns in <2ms:
action_res = bridge.resolve_fast_path_action(obs)
if action_res.can_execute_fast_path:
    # Glide mouse smoothly to target_x, target_y without calling Gemini!
    print(f"Glide mouse to ({action_res.target_x}, {action_res.target_y})")
```

---

### For BE 3 (Security Policy Engine & Invariant Hypervisor)
Call the `BoundaryMemoryBridge` to lock state or execute atomic rollback:
```python
from backend.app.contracts.be3_boundary_contract import BoundaryMemoryBridge, StateRollbackSnapshot

bridge = BoundaryMemoryBridge(store)

# 1. If transaction exceeds ceiling ($5,000):
bridge.lock_node_on_breach("node_step5_submit_payment", "Ceiling breached: $45,000")

# 2. If post-action invariant check fails:
bridge.apply_atomic_rollback(snapshot)
```

---

## ⚡ How to Run

### 1. Run the Chaos Test Harness (Act II Sabotage Simulation)
```powershell
python -m backend.app.simulator.chaos_simulator
```

### 2. Run the Full Automated Test Suite
```powershell
python -m pytest backend/tests -v
```

### 3. Start the Backend Server & Ambient Console
```powershell
python -m uvicorn backend.app.main:app --reload --port 8000
```
Open **`http://127.0.0.1:8000`** in your browser to view the real-time cyberpunk telemetry console!
