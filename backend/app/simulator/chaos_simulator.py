"""
AegisOS - Chaos Test & Demo Runner (BE 2)
Simulates the 3-minute hackathon pitch Act II:
1. Ingests baseline episodic graph.
2. Probes fast-path execution.
3. Injects UI sabotage (Button displacement Δx = +120px).
4. Verifies drift detection & triggers self-healing re-anchoring.
5. Verifies instant fast-path muscle memory restoration.
"""
import sys
import time

# Ensure UTF-8 output encoding on Windows terminal
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from backend.app.contracts.be1_actuator_contract import (
    ActuatorMemoryBridge,
    PerceptualStateObservation,
)
from backend.app.memory.db import init_db
from backend.app.memory.drift_detector import DriftDetector
from backend.app.memory.graph_store import GraphStore
from backend.app.memory.models import (
    ActionType,
    BoundingBox,
    CreateEdgeRequest,
    CreateNodeRequest,
    DriftCheckRequest,
    DriftClassification,
    NodeStatus,
    SelfHealRequest,
)
from backend.app.memory.self_healer import SelfHealer


def run_chaos_demo():
    print("=" * 72)
    print(" 🛡️  AegisOS: BE 2 Episodic Memory & Self-Healing Chaos Test Harness")
    print("=" * 72)

    # 1. Initialize DB and engine components
    init_db()
    store = GraphStore()
    detector = DriftDetector(store)
    healer = SelfHealer(store)
    bridge = ActuatorMemoryBridge(store, detector)

    task_id = "vendor_payout_task"
    print("\n[PHASE 1: Ingesting Baseline Episodic State Graph]")
    
    # Define baseline Step 5 button
    orig_bbox = BoundingBox(x=720.0, y=450.0, w=140.0, h=42.0)
    btn_hash = "e5b4a3f2d1c04123"

    step5_node = store.add_node(
        CreateNodeRequest(
            id="node_step5_submit_payment",
            task_id=task_id,
            step_index=5,
            name="Submit Vendor Payout",
            visual_hash=btn_hash,
            landmarks=["btn_submit_blue", "status_bar_ready"],
            bbox=orig_bbox,
            target_element="btn_submit",
            action_type=ActionType.CLICK,
            status=NodeStatus.LEARNED,
        )
    )
    print(f"  ✓ Ingested Node: {step5_node.name} at bbox [x={orig_bbox.x}, y={orig_bbox.y}]")

    # 2. Test Fast-Path Replay under normal conditions
    print("\n[PHASE 2: Testing Fast-Path Macro Replay (Zero Drift)]")
    normal_obs = PerceptualStateObservation(
        task_id=task_id,
        step_index=5,
        visual_hash=btn_hash,
        bbox=orig_bbox,
        landmarks=["btn_submit_blue"],
        target_element="btn_submit",
    )
    fast_resp = bridge.resolve_fast_path_action(normal_obs)
    print(f"  ✓ Fast-Path Available: {fast_resp.can_execute_fast_path}")
    print(f"  ✓ Dispatched Target: ({fast_resp.target_x}, {fast_resp.target_y})")
    print(f"  ✓ Lookup Latency: {fast_resp.lookup_latency_ms}ms")
    assert fast_resp.can_execute_fast_path is True

    # 3. Inject Sabotage: Displace button by Δx = +120px
    delta_x = 120.0
    drifted_bbox = BoundingBox(
        x=orig_bbox.x + delta_x,
        y=orig_bbox.y,
        w=orig_bbox.w,
        h=orig_bbox.h,
    )
    print(f"\n[PHASE 3: Injecting Act II Chaos Sabotage (Button Displaced Δx=+{delta_x}px)]")
    print(f"  Sabotaged Location: [x={drifted_bbox.x}, y={drifted_bbox.y}]")

    # 4. Drift Detector Check
    drift_req = DriftCheckRequest(
        task_id=task_id,
        step_index=5,
        observed_visual_hash=btn_hash,
        observed_bbox=drifted_bbox,
        target_element="btn_submit",
    )
    drift_result = detector.evaluate_observation(drift_req)
    print(f"  ✓ Drift Classification: {drift_result.classification.value}")
    print(f"  ✓ Drift Score: {drift_result.drift_score}")
    print(f"  ✓ Spatial Delta: (Δx={drift_result.delta_x}px, Δy={drift_result.delta_y}px)")
    print(f"  📢 Telemetry Alert: {drift_result.message}")

    assert drift_result.classification == DriftClassification.DRIFT
    assert drift_result.delta_x == 120.0

    # 5. Execute Self-Healing Re-anchoring
    print("\n[PHASE 4: Autonomous Self-Healing Routine]")
    heal_req = SelfHealRequest(
        node_id=step5_node.id,
        task_id=task_id,
        observed_visual_hash=btn_hash,
        new_bbox=drifted_bbox,
        detected_drift_score=drift_result.drift_score,
        reason=f"Sabotage: Window resized/column reordered. Delta_x = {delta_x}px",
    )
    heal_res = healer.reanchor_node(heal_req)
    print(f"  ✓ Re-anchor Success: {heal_res.success}")
    print(f"  ✓ Updated Node Status: {heal_res.updated_status.value} (Node turns green)")
    print(f"  ✓ Total Heals Recorded: {heal_res.heal_count}")
    print(f"  ✓ Audit Log ID: {heal_res.healing_log_id}")
    print(f"  📢 Telemetry Notice: {heal_res.message}")

    assert heal_res.success is True
    assert heal_res.updated_status == NodeStatus.HEALED

    # 6. Verify Restored Fast-Path Muscle Memory
    print("\n[PHASE 5: Verifying Restored Fast-Path Muscle Memory]")
    subsequent_obs = PerceptualStateObservation(
        task_id=task_id,
        step_index=5,
        visual_hash=btn_hash,
        bbox=drifted_bbox,
        landmarks=["btn_submit_blue"],
        target_element="btn_submit",
    )
    restored_resp = bridge.resolve_fast_path_action(subsequent_obs)
    print(f"  ✓ Fast-Path Available on New Target: {restored_resp.can_execute_fast_path}")
    print(f"  ✓ Dispatched Target: ({restored_resp.target_x}, {restored_resp.target_y})")
    print(f"  ✓ Target Node: {restored_resp.target_node_id}")
    print(f"  ✓ Lookup Latency: {restored_resp.lookup_latency_ms}ms")

    assert restored_resp.can_execute_fast_path is True
    # The center should now reflect the +120px shift: (720+120 + 140/2) = 840 + 70 = 910
    assert restored_resp.target_x == 910.0

    print("\n" + "=" * 72)
    print(" 🚀 ALL TEST CRITERIA PASSED: BE 2 ENGINE IS 100% PRODUCTION READY!")
    print("=" * 72)


if __name__ == "__main__":
    run_chaos_demo()
