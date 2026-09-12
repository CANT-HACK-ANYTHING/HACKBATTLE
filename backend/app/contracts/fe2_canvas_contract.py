"""
Contract with FE 2 (Canvas Graph & Simulator Lead)
Serializes the SQLite episodic state graph into the exact format consumed by FE 2's HTML5 Canvas.
"""
from typing import Dict
from backend.app.memory.graph_store import GraphStore
from backend.app.memory.models import (
    CanvasEdge,
    CanvasGraphData,
    CanvasNode,
    NodeStatus,
)

# Visual color mapping for Canvas rendering nodes
STATUS_COLOR_MAP: Dict[NodeStatus, str] = {
    NodeStatus.LEARNED: "#3b82f6",   # Cyberpunk Electric Blue: Baseline learned node
    NodeStatus.ACTIVE: "#06b6d4",    # Cyan: Currently focused/active
    NodeStatus.DRIFTED: "#f59e0b",   # Amber / Orange: Visual drift detected
    NodeStatus.HEALED: "#10b981",    # Emerald Green: Successfully re-anchored muscle memory
    NodeStatus.LOCKED: "#ef4444",    # Crimson Red: Boundary-halted / Policy violation
}


def build_canvas_graph_payload(task_id: str, store: GraphStore) -> CanvasGraphData:
    """
    Transforms relational SQLite nodes and edges into FE 2 Canvas Graph representation.
    """
    nodes = store.get_nodes_by_task(task_id)
    edges = store.get_edges_by_task(task_id)

    canvas_nodes = []
    drift_count = 0
    healed_count = 0

    for n in nodes:
        if n.status == NodeStatus.DRIFTED:
            drift_count += 1
        elif n.status == NodeStatus.HEALED:
            healed_count += 1

        color = STATUS_COLOR_MAP.get(n.status, "#64748b")
        canvas_nodes.append(
            CanvasNode(
                id=n.id,
                label=f"{n.step_index}. {n.name}",
                step_index=n.step_index,
                x=n.bbox.x,
                y=n.bbox.y,
                status=n.status,
                color=color,
                heal_count=n.heal_count,
                action_type=n.action_type.value,
            )
        )

    canvas_edges = [
        CanvasEdge(
            source=e.source_node_id,
            target=e.target_node_id,
            confidence=e.transition_confidence,
            executions=e.execution_count,
        )
        for e in edges
    ]

    return CanvasGraphData(
        task_id=task_id,
        nodes=canvas_nodes,
        edges=canvas_edges,
        total_nodes=len(canvas_nodes),
        total_edges=len(canvas_edges),
        drift_count=drift_count,
        healed_count=healed_count,
    )
