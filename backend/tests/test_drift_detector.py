"""
Unit tests for DriftDetector
"""
import pytest
from pathlib import Path
import tempfile
from backend.app.memory.db import init_db
from backend.app.memory.drift_detector import DriftDetector
from backend.app.memory.graph_store import GraphStore
from backend.app.memory.models import (
    ActionType,
    BoundingBox,
    CreateNodeRequest,
    DriftCheckRequest,
    DriftClassification,
    NodeStatus,
)


@pytest.fixture
def memory_system():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        temp_path = Path(f.name)
    init_db(temp_path)
    store = GraphStore(temp_path)
    detector = DriftDetector(store)

    # Seed an initial reference node
    store.add_node(
        CreateNodeRequest(
            id="node_submit_btn",
            task_id="checkout_task",
            step_index=3,
            name="Submit Order Button",
            visual_hash="1111222233334444",
            bbox=BoundingBox(x=500.0, y=300.0, w=100.0, h=40.0),
            target_element="btn_submit",
            action_type=ActionType.CLICK,
            status=NodeStatus.LEARNED,
        )
    )

    yield store, detector

    if temp_path.exists():
        try:
            temp_path.unlink()
        except Exception:
            pass


def test_drift_detector_exact_match(memory_system):
    store, detector = memory_system
    req = DriftCheckRequest(
        task_id="checkout_task",
        step_index=3,
        observed_visual_hash="1111222233334444",
        observed_bbox=BoundingBox(x=500.0, y=300.0, w=100.0, h=40.0),
        target_element="btn_submit",
    )
    result = detector.evaluate_observation(req)
    assert result.classification == DriftClassification.MATCH
    assert result.drift_score == 0.0
    assert result.matched_node_id == "node_submit_btn"
    assert result.delta_x == 0.0
    assert result.delta_y == 0.0


def test_drift_detector_displaced_button(memory_system):
    store, detector = memory_system
    # Displace button +100px to the right
    req = DriftCheckRequest(
        task_id="checkout_task",
        step_index=3,
        observed_visual_hash="1111222233334444",
        observed_bbox=BoundingBox(x=600.0, y=300.0, w=100.0, h=40.0),
        target_element="btn_submit",
    )
    result = detector.evaluate_observation(req)
    assert result.classification == DriftClassification.DRIFT
    assert result.matched_node_id == "node_submit_btn"
    assert result.delta_x == 100.0
    assert result.delta_y == 0.0
    assert result.recommended_action == "TRIGGER_SELF_HEALING_REANCHOR"

    # Verify node status in DB is updated to DRIFTED
    node = store.get_node("node_submit_btn")
    assert node.status == NodeStatus.DRIFTED


def test_drift_detector_extreme_anomaly(memory_system):
    store, detector = memory_system
    # Displace button far away and change hash completely
    req = DriftCheckRequest(
        task_id="checkout_task",
        step_index=3,
        observed_visual_hash="ffffffffffffffff",
        observed_bbox=BoundingBox(x=900.0, y=800.0, w=20.0, h=20.0),
        target_element="btn_submit",
    )
    result = detector.evaluate_observation(req)
    assert result.classification == DriftClassification.ANOMALY
    assert result.drift_score > detector.tau_drift
