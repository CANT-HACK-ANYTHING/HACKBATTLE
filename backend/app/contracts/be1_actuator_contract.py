"""
Contract with BE 1 (OS Actuator Layer & Multimodal Vision Hooks)
Provides fast-path lookup for instant mouse gliding and receives perceptual observations.
"""
import time
from typing import Any, Dict, Optional, Tuple
from pydantic import BaseModel, Field
from backend.app.memory.drift_detector import DriftDetector
from backend.app.memory.graph_store import GraphStore
from backend.app.memory.models import (
    ActionType,
    BoundingBox,
    DriftCheckRequest,
    DriftClassification,
)


class PerceptualStateObservation(BaseModel):
    task_id: str
    step_index: int
    visual_hash: str
    bbox: BoundingBox
    landmarks: list[str] = Field(default_factory=list)
    target_element: Optional[str] = None


class FastPathActionResponse(BaseModel):
    can_execute_fast_path: bool
    target_node_id: Optional[str] = None
    target_x: Optional[float] = None
    target_y: Optional[float] = None
    action_type: Optional[ActionType] = None
    action_payload: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 0.0
    lookup_latency_ms: float = 0.0
    message: str


class ActuatorMemoryBridge:
    def __init__(self, store: GraphStore, detector: DriftDetector):
        self.store = store
        self.detector = detector

    def resolve_fast_path_action(self, obs: PerceptualStateObservation) -> FastPathActionResponse:
        """
        Microsecond lookup for BE 1: determines if the current visual observation matches
        an existing state node in episodic memory.
        If matched, returns exact (target_x, target_y) for instant mouse gliding.
        """
        start_time = time.perf_counter()

        req = DriftCheckRequest(
            task_id=obs.task_id,
            step_index=obs.step_index,
            observed_visual_hash=obs.visual_hash,
            observed_bbox=obs.bbox,
            observed_landmarks=obs.landmarks,
            target_element=obs.target_element,
        )

        drift_result = self.detector.evaluate_observation(req)
        lookup_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        if drift_result.classification == DriftClassification.MATCH and drift_result.matched_node_id:
            node = self.store.get_node(drift_result.matched_node_id)
            if node:
                center_x, center_y = node.bbox.center
                return FastPathActionResponse(
                    can_execute_fast_path=True,
                    target_node_id=node.id,
                    target_x=round(center_x, 1),
                    target_y=round(center_y, 1),
                    action_type=node.action_type,
                    action_payload=node.action_payload,
                    confidence=round(1.0 - drift_result.drift_score, 4),
                    lookup_latency_ms=lookup_ms,
                    message=f"Fast-path hit! Node '{node.name}' dispatched in {lookup_ms}ms.",
                )

        return FastPathActionResponse(
            can_execute_fast_path=False,
            target_node_id=drift_result.matched_node_id,
            lookup_latency_ms=lookup_ms,
            message=drift_result.message,
        )
