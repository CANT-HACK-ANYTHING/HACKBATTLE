"""
Unit tests for SelfHealer and Cross-Module Integration Bridges
"""
import pytest
from pathlib import Path
import tempfile
from backend.app.contracts.be1_actuator_contract import (
    ActuatorMemoryBridge,
    PerceptualStateObservation,
)
from backend.app.contracts.be3_boundary_contract import (
    BoundaryMemoryBridge,
    StateRollbackSnapshot,
)
from backend.app.contracts.fe2_canvas_contract import build_canvas_graph_payload
from backend.app.memory.db import init_db
from backend.app.memory.drift_detector import DriftDetector
from backend.app.memory.graph_store import GraphStore
from backend.app.memory.models import (
    ActionType,
    BoundingBox,
    CreateEdgeRequest,
    CreateNodeRequest,
    NodeStatus,
    SelfHealRequest,
)
from backend.app.memory.self_healer import SelfHealer


@pytest.fixture
def integrated_system():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        temp_path = Path(f.name)
    init_db(temp_path)
    store = GraphStore(temp_path)
    detector = DriftDetector(store)
    healer = SelfHealer(store)
    actuator_bridge = ActuatorMemoryBridge(store, detector)
    boundary_bridge = BoundaryMemoryBridge(store)

    # Seed baseline node
    n = store.add_node(
        CreateNodeRequest(
            id="node_pay_vendor",
            task_id="payout_task",
            step_index=1,
            name="Submit Vendor Payout",
            visual_hash="1010101010101010",
            bbox=BoundingBox(x=720.0, y=450.0, w=140.0, h=42.0),
            target_element="btn_pay",
            action_type=ActionType.CLICK,
            status=NodeStatus.LEARNED,
        )
    )

    yield store, detector, healer, actuator_bridge, boundary_bridge, n

    if temp_path.exists():
        try:
            temp_path.unlink()
        except Exception:
            pass


def test_self_healing_reanchor_lifecycle(integrated_system):
    store, detector, healer, actuator_bridge, boundary_bridge, node = integrated_system

    # 1. Simulate +120px shift
    new_bbox = BoundingBox(x=840.0, y=450.0, w=140.0, h=42.0)
    heal_req = SelfHealRequest(
        node_id=node.id,
        task_id="payout_task",
        observed_visual_hash=node.visual_hash,
        new_bbox=new_bbox,
        detected_drift_score=0.28,
        reason="Act II Sabotage (+120px drift)",
    )

    result = healer.reanchor_node(heal_req)
    assert result.success is True
    assert result.delta_x == 120.0
    assert result.updated_status == NodeStatus.HEALED
    assert result.heal_count == 1

    # Verify persistent DB state
    db_node = store.get_node(node.id)
    assert db_node.bbox.x == 840.0
    assert db_node.status == NodeStatus.HEALED
    assert db_node.heal_count == 1

    # Verify healing log
    logs = store.get_healing_logs_by_task("payout_task")
    assert len(logs) == 1
    assert logs[0].node_id == node.id
    assert logs[0].delta_x == 120.0

    # 2. Test Fast-Path Actuator Bridge hits new target immediately
    obs = PerceptualStateObservation(
        task_id="payout_task",
        step_index=1,
        visual_hash=node.visual_hash,
        bbox=new_bbox,
        target_element="btn_pay",
    )
    fast_resp = actuator_bridge.resolve_fast_path_action(obs)
    assert fast_resp.can_execute_fast_path is True
    # Center of [840, 450, 140, 42] is x = 840 + 70 = 910.0, y = 450 + 21 = 471.0
    assert fast_resp.target_x == 910.0
    assert fast_resp.target_y == 471.0


def test_fe2_canvas_payload_generation(integrated_system):
    store, _, healer, _, _, node = integrated_system

    # Connect another node
    n2 = store.add_node(
        CreateNodeRequest(
            id="node_confirm",
            task_id="payout_task",
            step_index=2,
            name="Confirm Modal",
            visual_hash="2020202020202020",
            bbox=BoundingBox(x=500.0, y=500.0, w=100.0, h=50.0),
            target_element="btn_confirm",
            action_type=ActionType.CLICK,
            status=NodeStatus.LEARNED,
        )
    )
    store.add_edge(CreateEdgeRequest(source_node_id=node.id, target_node_id=n2.id))

    payload = build_canvas_graph_payload("payout_task", store)
    assert payload.total_nodes == 2
    assert payload.total_edges == 1
    assert payload.nodes[0].id == node.id
    assert payload.edges[0].source == node.id


def test_be3_boundary_lock_and_rollback(integrated_system):
    store, _, _, _, boundary_bridge, node = integrated_system

    # Create pre-action snapshot
    snapshot = StateRollbackSnapshot(
        snapshot_id="snap_1",
        task_id="payout_task",
        node_id=node.id,
        previous_bbox=node.bbox,
        previous_hash=node.visual_hash,
        previous_status=NodeStatus.LEARNED,
        created_at="2026-09-12T12:00:00Z",
    )

    # 1. Simulate BE 3 locking node upon policy violation
    boundary_bridge.lock_node_on_breach(node.id, "Violation: exceeds ceiling $5,000")
    locked_node = store.get_node(node.id)
    assert locked_node.status == NodeStatus.LOCKED

    # 2. Simulate BE 3 triggering state rollback
    boundary_bridge.apply_atomic_rollback(snapshot)
    restored_node = store.get_node(node.id)
    assert restored_node.status == NodeStatus.LEARNED
    assert restored_node.bbox.x == 720.0
