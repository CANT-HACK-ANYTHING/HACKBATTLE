"""
FastAPI Router for AegisOS Memory Subsystem (BE 2)
Provides endpoints for graph topologies, drift inspection, self-healing triggers, and telemetry.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.app.api.websocket_bus import telemetry_bus
from backend.app.contracts.fe2_canvas_contract import build_canvas_graph_payload
from backend.app.memory.drift_detector import DriftDetector
from backend.app.memory.graph_store import GraphStore
from backend.app.memory.models import (
    ActionType,
    BoundingBox,
    CanvasGraphData,
    CreateEdgeRequest,
    CreateNodeRequest,
    DriftCheckRequest,
    DriftCheckResult,
    DriftClassification,
    EpisodeRecord,
    HealingLogEntry,
    MemoryTelemetryEvent,
    NodeStatus,
    SelfHealRequest,
    SelfHealResult,
    StateEdge,
    StateNode,
    TelemetryEventType,
)
from backend.app.memory.self_healer import SelfHealer

router = APIRouter(prefix="/api/memory", tags=["Episodic Memory & State Graph"])

# Dependency injection for Store, Detector, Healer
_store = GraphStore()
_detector = DriftDetector(_store)
_healer = SelfHealer(_store)


def get_store() -> GraphStore:
    return _store


def get_detector() -> DriftDetector:
    return _detector


def get_healer() -> SelfHealer:
    return _healer


@router.get("/health")
def health_check():
    return {
        "status": "online",
        "subsystem": "BE 2 (Episodic Memory & State Graph)",
        "active_telemetry_clients": telemetry_bus.client_count,
    }


# =========================================================================
# Graph & Node Endpoints (for FE 2 Canvas Graph)
# =========================================================================

@router.get("/graph", response_model=CanvasGraphData)
def get_canvas_graph(
    task_id: str = Query("vendor_payout_task", description="Task identifier to render"),
    store: GraphStore = Depends(get_store),
):
    """
    Returns graph topology formatted specifically for FE 2 HTML5 Canvas.
    """
    return build_canvas_graph_payload(task_id, store)


@router.get("/nodes", response_model=List[StateNode])
def get_task_nodes(
    task_id: str = Query(..., description="Task identifier"),
    store: GraphStore = Depends(get_store),
):
    return store.get_nodes_by_task(task_id)


@router.post("/nodes", response_model=StateNode)
async def create_node(
    req: CreateNodeRequest,
    store: GraphStore = Depends(get_store),
):
    node = store.add_node(req)
    await telemetry_bus.broadcast(
        MemoryTelemetryEvent(
            event_type=TelemetryEventType.GRAPH_INITIALIZED,
            task_id=req.task_id,
            node_id=node.id,
            payload={"name": node.name, "step_index": node.step_index},
            summary=f"New state node '{node.name}' ingested into SQLite graph.",
        )
    )
    return node


@router.post("/edges", response_model=StateEdge)
def create_edge(
    req: CreateEdgeRequest,
    store: GraphStore = Depends(get_store),
):
    return store.add_edge(req)


# =========================================================================
# Drift Detection & Self-Healing Endpoints
# =========================================================================

@router.post("/drift-check", response_model=DriftCheckResult)
async def check_drift(
    req: DriftCheckRequest,
    detector: DriftDetector = Depends(get_detector),
):
    """
    Evaluates an observed screen element against episodic memory nodes.
    Detects if the element is matched (fast-path) or drifted (needs self-healing).
    """
    result = detector.evaluate_observation(req)

    # Emit telemetry event if drift or match detected
    if result.classification == DriftClassification.DRIFT:
        await telemetry_bus.broadcast(
            MemoryTelemetryEvent(
                event_type=TelemetryEventType.MEMORY_DRIFT_DETECTED,
                task_id=req.task_id,
                node_id=result.matched_node_id,
                payload={
                    "drift_score": result.drift_score,
                    "delta_x": result.delta_x,
                    "delta_y": result.delta_y,
                },
                summary=result.message,
            )
        )
    elif result.classification == DriftClassification.MATCH:
        await telemetry_bus.broadcast(
            MemoryTelemetryEvent(
                event_type=TelemetryEventType.FAST_PATH_HIT,
                task_id=req.task_id,
                node_id=result.matched_node_id,
                payload={"drift_score": result.drift_score},
                summary=result.message,
            )
        )

    return result


@router.post("/self-heal", response_model=SelfHealResult)
async def self_heal_node(
    req: SelfHealRequest,
    healer: SelfHealer = Depends(get_healer),
):
    """
    Re-anchors a drifted state node in SQLite, updates bounding box geometry,
    appends to healing_logs, and broadcasts updated status to HUD/Canvas.
    """
    try:
        result = healer.reanchor_node(req)
        await telemetry_bus.broadcast(
            MemoryTelemetryEvent(
                event_type=TelemetryEventType.SELF_HEALING_COMPLETED,
                task_id=req.task_id,
                node_id=req.node_id,
                payload={
                    "delta_x": result.delta_x,
                    "delta_y": result.delta_y,
                    "heal_count": result.heal_count,
                    "status": result.updated_status.value,
                },
                summary=result.message,
            )
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/healing-logs", response_model=List[HealingLogEntry])
def get_healing_logs(
    task_id: str = Query(..., description="Task identifier"),
    store: GraphStore = Depends(get_store),
):
    return store.get_healing_logs_by_task(task_id)


@router.get("/episodes", response_model=List[EpisodeRecord])
def get_episodes(
    limit: int = Query(20, description="Max episodes to return"),
    store: GraphStore = Depends(get_store),
):
    return store.list_episodes(limit=limit)


# =========================================================================
# Demo Seeding & Chaos Simulation
# =========================================================================

@router.post("/seed-demo")
async def seed_demo_workflow(store: GraphStore = Depends(get_store)):
    """
    Pre-populates the 5-step vendor payout task described in the Hackathon Demo script.
    """
    task_id = "vendor_payout_task"

    # Reset existing edges for this task to ensure clean idempotent seeding
    store.delete_edges_by_task(task_id)

    # Step 1: Open Vendor Excel File
    n1 = store.add_node(
        CreateNodeRequest(
            id="node_step1_open_excel",
            task_id=task_id,
            step_index=1,
            name="Open Vendor Payouts Excel",
            visual_hash="a1f0c3d4e5b60789",
            landmarks=["desktop_icon", "excel_green_logo"],
            bbox=BoundingBox(x=120, y=80, w=64, h=64),
            target_element="excel_icon",
            action_type=ActionType.DOUBLE_CLICK,
            status=NodeStatus.LEARNED,
        )
    )

    # Step 2: Read Vendor Row Data
    n2 = store.add_node(
        CreateNodeRequest(
            id="node_step2_copy_row",
            task_id=task_id,
            step_index=2,
            name="Extract Vendor Row #401",
            visual_hash="b2e1f4c5d6a71890",
            landmarks=["grid_row_401", "col_amount"],
            bbox=BoundingBox(x=240, y=320, w=520, h=30),
            target_element="vendor_row_401",
            action_type=ActionType.CLICK,
            action_payload={"copy_clipboard": True},
            status=NodeStatus.LEARNED,
        )
    )

    # Step 3: Switch to Legacy Desktop Billing ERP
    n3 = store.add_node(
        CreateNodeRequest(
            id="node_step3_focus_erp",
            task_id=task_id,
            step_index=3,
            name="Focus Legacy ERP App",
            visual_hash="c3d2e1f6a5b82901",
            landmarks=["erp_window_title", "menu_bar"],
            bbox=BoundingBox(x=600, y=100, w=400, h=40),
            target_element="erp_titlebar",
            action_type=ActionType.CLICK,
            status=NodeStatus.LEARNED,
        )
    )

    # Step 4: Enter Vendor Payment Data
    n4 = store.add_node(
        CreateNodeRequest(
            id="node_step4_input_amount",
            task_id=task_id,
            step_index=4,
            name="Input Payment Amount $4,250",
            visual_hash="d4c3b2a1f8e93012",
            landmarks=["lbl_amount", "txt_amount_field"],
            bbox=BoundingBox(x=680, y=280, w=180, h=32),
            target_element="input_payout_amount",
            action_type=ActionType.TYPE,
            action_payload={"value": "4250.00"},
            status=NodeStatus.LEARNED,
        )
    )

    # Step 5: Click Submit Payment (Target of Act II Chaos Sabotage)
    n5 = store.add_node(
        CreateNodeRequest(
            id="node_step5_submit_payment",
            task_id=task_id,
            step_index=5,
            name="Submit Vendor Payout",
            visual_hash="e5b4a3f2d1c04123",
            landmarks=["btn_submit_blue", "status_bar_ready"],
            bbox=BoundingBox(x=720, y=450, w=140, h=42),
            target_element="btn_submit",
            action_type=ActionType.CLICK,
            status=NodeStatus.LEARNED,
        )
    )

    # Connect nodes with sequential transition edges
    store.add_edge(CreateEdgeRequest(source_node_id=n1.id, target_node_id=n2.id))
    store.add_edge(CreateEdgeRequest(source_node_id=n2.id, target_node_id=n3.id))
    store.add_edge(CreateEdgeRequest(source_node_id=n3.id, target_node_id=n4.id))
    store.add_edge(CreateEdgeRequest(source_node_id=n4.id, target_node_id=n5.id))

    # Initialize episode
    store.create_episode("episode_demo_101", "Vendor Payouts Reconciliation")

    return {
        "success": True,
        "message": "Demo workflow seeded with 5 nodes and 4 edges.",
        "task_id": task_id,
    }


@router.post("/simulate-chaos")
async def simulate_act2_chaos(
    delta_x: float = Query(120.0, description="Spatial button shift in px (default +120px)"),
    detector: DriftDetector = Depends(get_detector),
    healer: SelfHealer = Depends(get_healer),
    store: GraphStore = Depends(get_store),
):
    """
    Executes Act II (The Chaos Test) from the Hackathon Demo script:
    1. Reads Step 5 button ('Submit Vendor Payout', original x=720).
    2. Simulates UI sabotage: Button shifts by +120px to x=840.
    3. Drift detector identifies the displacement and marks node as DRIFTED.
    4. Self-healer automatically re-anchors the node, updates SQLite, and logs the healing episode.
    5. Emits real-time telemetry to HUD & Canvas graph.
    """
    task_id = "vendor_payout_task"
    target_node_id = "node_step5_submit_payment"
    node = store.get_node(target_node_id)
    if not node:
        raise HTTPException(
            status_code=404,
            detail="Step 5 node not found. Call POST /api/memory/seed-demo first.",
        )

    original_bbox = node.bbox
    # Sabotaged coordinates (displaced by delta_x)
    drifted_bbox = BoundingBox(
        x=original_bbox.x + delta_x,
        y=original_bbox.y,
        w=original_bbox.w,
        h=original_bbox.h,
    )

    # 1. Evaluate observation with drift detector
    drift_req = DriftCheckRequest(
        task_id=task_id,
        step_index=5,
        observed_visual_hash=node.visual_hash,  # same button appearance
        observed_bbox=drifted_bbox,             # displaced position
        target_element="btn_submit",
    )
    drift_result = detector.evaluate_observation(drift_req)

    # Broadcast DRIFT event
    await telemetry_bus.broadcast(
        MemoryTelemetryEvent(
            event_type=TelemetryEventType.MEMORY_DRIFT_DETECTED,
            task_id=task_id,
            node_id=target_node_id,
            payload={
                "drift_score": drift_result.drift_score,
                "delta_x": delta_x,
                "delta_y": 0.0,
            },
            summary=f"[MEMORY DRIFT DETECTED: Button 'Submit' relocated (Δx=+{delta_x}px)]",
        )
    )

    # 2. Trigger Self-Healing Routine
    heal_req = SelfHealRequest(
        node_id=target_node_id,
        task_id=task_id,
        observed_visual_hash=node.visual_hash,
        new_bbox=drifted_bbox,
        detected_drift_score=drift_result.drift_score,
        reason=f"Sabotage Chaos Test: Button shifted by {delta_x}px",
    )
    heal_result = healer.reanchor_node(heal_req)

    # Broadcast HEALED event
    await telemetry_bus.broadcast(
        MemoryTelemetryEvent(
            event_type=TelemetryEventType.SELF_HEALING_COMPLETED,
            task_id=task_id,
            node_id=target_node_id,
            payload={
                "delta_x": heal_result.delta_x,
                "heal_count": heal_result.heal_count,
                "status": heal_result.updated_status.value,
            },
            summary=f"[SELF-HEALING: Visual relocalization successful. Updated Episode #104. Node turns green.]",
        )
    )

    return {
        "drift_detected": drift_result,
        "self_healing": heal_result,
        "demo_act": "Act II: Memory & Self-Learning (The Chaos Test)",
    }
