"""
Pydantic Data Models & Types for AegisOS Memory Subsystem (BE 2)
Defines contracts for nodes, edges, drift calculations, healing audits, and telemetry events.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple
import math
from pydantic import BaseModel, Field


class NodeStatus(str, Enum):
    LEARNED = "LEARNED"    # Initial learned state from past successful run
    ACTIVE = "ACTIVE"      # Currently targeted or executing
    DRIFTED = "DRIFTED"    # Visual drift or displacement detected
    HEALED = "HEALED"      # Successfully re-anchored and updated in SQLite
    LOCKED = "LOCKED"      # Boundary-locked state (requires human override)


class ActionType(str, Enum):
    CLICK = "click"
    DOUBLE_CLICK = "double_click"
    TYPE = "type"
    HOTKEY = "hotkey"
    SCROLL = "scroll"
    DRAG = "drag"


class BoundingBox(BaseModel):
    x: float = Field(..., description="Top-left X in normalized [0, 1000] scale")
    y: float = Field(..., description="Top-left Y in normalized [0, 1000] scale")
    w: float = Field(..., description="Width in normalized scale")
    h: float = Field(..., description="Height in normalized scale")

    @property
    def center(self) -> Tuple[float, float]:
        return (self.x + self.w / 2.0, self.y + self.h / 2.0)

    @property
    def area(self) -> float:
        return max(0.0, self.w) * max(0.0, self.h)

    def center_distance(self, other: "BoundingBox") -> float:
        c1 = self.center
        c2 = other.center
        return math.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2)

    def calculate_iou(self, other: "BoundingBox") -> float:
        x1 = max(self.x, other.x)
        y1 = max(self.y, other.y)
        x2 = min(self.x + self.w, other.x + other.w)
        y2 = min(self.y + self.h, other.y + other.h)

        inter_w = max(0.0, x2 - x1)
        inter_h = max(0.0, y2 - y1)
        inter_area = inter_w * inter_h
        union_area = self.area + other.area - inter_area
        if union_area <= 0:
            return 0.0
        return inter_area / union_area


class StateNode(BaseModel):
    id: str
    task_id: str
    step_index: int
    name: str
    visual_hash: str
    landmarks: List[str] = Field(default_factory=list)
    bbox: BoundingBox
    target_element: str
    action_type: ActionType
    action_payload: Dict[str, Any] = Field(default_factory=dict)
    status: NodeStatus = NodeStatus.LEARNED
    heal_count: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CreateNodeRequest(BaseModel):
    id: Optional[str] = None
    task_id: str
    step_index: int
    name: str
    visual_hash: str
    landmarks: List[str] = Field(default_factory=list)
    bbox: BoundingBox
    target_element: str
    action_type: ActionType
    action_payload: Dict[str, Any] = Field(default_factory=dict)
    status: NodeStatus = NodeStatus.LEARNED


class StateEdge(BaseModel):
    id: str
    source_node_id: str
    target_node_id: str
    action_id: Optional[str] = None
    transition_confidence: float = 1.0
    execution_count: int = 0
    avg_latency_ms: float = 0.0
    created_at: Optional[str] = None


class CreateEdgeRequest(BaseModel):
    source_node_id: str
    target_node_id: str
    action_id: Optional[str] = None
    transition_confidence: float = 1.0


class DriftClassification(str, Enum):
    MATCH = "MATCH"         # Match within fast-path tolerance -> Instant Replay
    DRIFT = "DRIFT"         # UI Drift detected -> Needs Self-Healing
    ANOMALY = "ANOMALY"     # Severe anomaly or completely unfamiliar screen


class DriftCheckRequest(BaseModel):
    task_id: str
    step_index: Optional[int] = None
    observed_visual_hash: str
    observed_bbox: BoundingBox
    observed_landmarks: List[str] = Field(default_factory=list)
    target_element: Optional[str] = None


class DriftCheckResult(BaseModel):
    classification: DriftClassification
    drift_score: float
    matched_node_id: Optional[str] = None
    delta_x: float = 0.0
    delta_y: float = 0.0
    delta_w: float = 0.0
    delta_h: float = 0.0
    hash_distance: float = 0.0
    spatial_distance: float = 0.0
    message: str
    recommended_action: Optional[str] = None


class SelfHealRequest(BaseModel):
    node_id: str
    task_id: str
    observed_visual_hash: str
    new_bbox: BoundingBox
    detected_drift_score: float
    reason: str = "UI Drift detected during macro execution"


class SelfHealResult(BaseModel):
    success: bool
    node_id: str
    healing_log_id: str
    previous_bbox: BoundingBox
    new_bbox: BoundingBox
    delta_x: float
    delta_y: float
    updated_status: NodeStatus
    heal_count: int
    message: str


class HealingLogEntry(BaseModel):
    id: str
    node_id: str
    task_id: str
    detected_drift_score: float
    delta_x: float
    delta_y: float
    delta_w: float
    delta_h: float
    reason: str
    relocalized_at: str
    telemetry_event_id: Optional[str] = None


class EpisodeRecord(BaseModel):
    episode_id: str
    task_name: str
    start_time: str
    end_time: Optional[str] = None
    total_steps: int = 0
    drift_incidents: int = 0
    self_healed_count: int = 0
    status: str = "IN_PROGRESS"


# =========================================================================
# Telemetry Event Models for FE 1 (HUD) and FE 2 (Canvas Graph)
# =========================================================================

class TelemetryEventType(str, Enum):
    GRAPH_INITIALIZED = "GRAPH_INITIALIZED"
    FAST_PATH_HIT = "FAST_PATH_HIT"
    MEMORY_DRIFT_DETECTED = "MEMORY_DRIFT_DETECTED"
    SELF_HEALING_COMPLETED = "SELF_HEALING_COMPLETED"
    NODE_STATUS_CHANGED = "NODE_STATUS_CHANGED"
    ROLLBACK_TRIGGERED = "ROLLBACK_TRIGGERED"
    EPISODE_COMPLETED = "EPISODE_COMPLETED"


class MemoryTelemetryEvent(BaseModel):
    event_type: TelemetryEventType
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    task_id: str
    node_id: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    summary: str


class CanvasNode(BaseModel):
    id: str
    label: str
    step_index: int
    x: float
    y: float
    status: NodeStatus
    color: str
    heal_count: int
    action_type: str


class CanvasEdge(BaseModel):
    source: str
    target: str
    confidence: float
    executions: int


class CanvasGraphData(BaseModel):
    task_id: str
    nodes: List[CanvasNode]
    edges: List[CanvasEdge]
    total_nodes: int
    total_edges: int
    drift_count: int
    healed_count: int
