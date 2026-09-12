"""
Unit tests for GraphStore (SQLite persistent relational state graph)
"""
import pytest
from pathlib import Path
import tempfile
from backend.app.memory.db import init_db
from backend.app.memory.graph_store import GraphStore
from backend.app.memory.models import (
    ActionType,
    BoundingBox,
    CreateEdgeRequest,
    CreateNodeRequest,
    HealingLogEntry,
    NodeStatus,
)


@pytest.fixture
def temp_store():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        temp_path = Path(f.name)
    init_db(temp_path)
    store = GraphStore(temp_path)
    yield store
    if temp_path.exists():
        try:
            temp_path.unlink()
        except Exception:
            pass


def test_add_and_get_node(temp_store: GraphStore):
    bbox = BoundingBox(x=100.0, y=200.0, w=50.0, h=30.0)
    req = CreateNodeRequest(
        id="node_test_1",
        task_id="test_task",
        step_index=1,
        name="Click Login",
        visual_hash="1234567890abcdef",
        landmarks=["btn_login", "header_bar"],
        bbox=bbox,
        target_element="login_button",
        action_type=ActionType.CLICK,
        action_payload={"key": "val"},
        status=NodeStatus.LEARNED,
    )

    node = temp_store.add_node(req)
    assert node.id == "node_test_1"
    assert node.name == "Click Login"
    assert node.bbox.x == 100.0
    assert node.landmarks == ["btn_login", "header_bar"]
    assert node.action_payload == {"key": "val"}

    fetched = temp_store.get_node("node_test_1")
    assert fetched is not None
    assert fetched.id == "node_test_1"
    assert fetched.status == NodeStatus.LEARNED


def test_update_node_geometry_and_status(temp_store: GraphStore):
    bbox = BoundingBox(x=100.0, y=200.0, w=50.0, h=30.0)
    req = CreateNodeRequest(
        id="node_update_test",
        task_id="test_task",
        step_index=1,
        name="Target Button",
        visual_hash="1111222233334444",
        bbox=bbox,
        target_element="btn_target",
        action_type=ActionType.CLICK,
    )
    temp_store.add_node(req)

    # Move button +50px right
    new_bbox = BoundingBox(x=150.0, y=200.0, w=50.0, h=30.0)
    success = temp_store.update_node_geometry(
        node_id="node_update_test",
        new_bbox=new_bbox,
        visual_hash="5555666677778888",
        increment_heal=True,
        new_status=NodeStatus.HEALED,
    )
    assert success is True

    updated = temp_store.get_node("node_update_test")
    assert updated is not None
    assert updated.bbox.x == 150.0
    assert updated.visual_hash == "5555666677778888"
    assert updated.status == NodeStatus.HEALED
    assert updated.heal_count == 1


def test_add_edge_and_query(temp_store: GraphStore):
    n1 = temp_store.add_node(
        CreateNodeRequest(
            id="n1",
            task_id="t1",
            step_index=1,
            name="Step 1",
            visual_hash="h1",
            bbox=BoundingBox(x=10, y=10, w=20, h=20),
            target_element="e1",
            action_type=ActionType.CLICK,
        )
    )
    n2 = temp_store.add_node(
        CreateNodeRequest(
            id="n2",
            task_id="t1",
            step_index=2,
            name="Step 2",
            visual_hash="h2",
            bbox=BoundingBox(x=30, y=30, w=20, h=20),
            target_element="e2",
            action_type=ActionType.CLICK,
        )
    )

    edge = temp_store.add_edge(CreateEdgeRequest(source_node_id=n1.id, target_node_id=n2.id))
    assert edge.source_node_id == "n1"
    assert edge.target_node_id == "n2"

    edges = temp_store.get_edges_by_task("t1")
    assert len(edges) == 1
    assert edges[0].id == edge.id


def test_healing_log_and_episode(temp_store: GraphStore):
    temp_store.add_node(
        CreateNodeRequest(
            id="n_heal",
            task_id="task_h",
            step_index=1,
            name="Heal Test",
            visual_hash="hh",
            bbox=BoundingBox(x=10, y=10, w=20, h=20),
            target_element="eh",
            action_type=ActionType.CLICK,
        )
    )

    entry = HealingLogEntry(
        id="hl_1",
        node_id="n_heal",
        task_id="task_h",
        detected_drift_score=0.35,
        delta_x=120.0,
        delta_y=0.0,
        delta_w=0.0,
        delta_h=0.0,
        reason="Window resize",
        relocalized_at="2026-09-12T12:00:00Z",
    )
    assert temp_store.log_healing_event(entry) is True

    logs = temp_store.get_healing_logs_by_task("task_h")
    assert len(logs) == 1
    assert logs[0].delta_x == 120.0

    ep = temp_store.create_episode("ep_1", "Test Episode")
    assert ep.episode_id == "ep_1"
    assert ep.status == "IN_PROGRESS"

    temp_store.record_episode_drift("ep_1")
    temp_store.record_episode_healing("ep_1")
    temp_store.complete_episode("ep_1", "COMPLETED")

    ep_updated = temp_store.get_episode("ep_1")
    assert ep_updated is not None
    assert ep_updated.drift_incidents == 1
    assert ep_updated.self_healed_count == 1
    assert ep_updated.status == "COMPLETED"


def test_edge_idempotency_and_deletion(temp_store: GraphStore):
    n1 = temp_store.add_node(
        CreateNodeRequest(
            id="node_a",
            task_id="task_dup",
            step_index=1,
            name="Node A",
            visual_hash="ha",
            bbox=BoundingBox(x=10, y=10, w=10, h=10),
            target_element="ea",
            action_type=ActionType.CLICK,
        )
    )
    n2 = temp_store.add_node(
        CreateNodeRequest(
            id="node_b",
            task_id="task_dup",
            step_index=2,
            name="Node B",
            visual_hash="hb",
            bbox=BoundingBox(x=20, y=20, w=10, h=10),
            target_element="eb",
            action_type=ActionType.CLICK,
        )
    )

    edge1 = temp_store.add_edge(CreateEdgeRequest(source_node_id=n1.id, target_node_id=n2.id))
    # Adding edge between same nodes again should update, not create duplicate
    edge2 = temp_store.add_edge(
        CreateEdgeRequest(source_node_id=n1.id, target_node_id=n2.id, transition_confidence=0.9)
    )
    assert edge1.id == edge2.id
    assert edge2.transition_confidence == 0.9

    edges = temp_store.get_edges_by_task("task_dup")
    assert len(edges) == 1

    deleted_count = temp_store.delete_edges_by_task("task_dup")
    assert deleted_count == 1
    assert len(temp_store.get_edges_by_task("task_dup")) == 0

