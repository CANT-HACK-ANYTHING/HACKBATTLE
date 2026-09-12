"""
Multi-Tier Visual Drift Detection Engine for AegisOS (BE 2)
Evaluates visual hashes, spatial coordinates, and bounding box geometry to detect UI drift.
"""
from typing import List, Optional, Tuple
from backend.app.config import settings_memory
from backend.app.memory.graph_store import GraphStore
from backend.app.memory.models import (
    BoundingBox,
    DriftCheckRequest,
    DriftCheckResult,
    DriftClassification,
    NodeStatus,
    StateNode,
)
from backend.app.memory.perceptual_hash import normalized_hash_distance


class DriftDetector:
    def __init__(self, store: GraphStore):
        self.store = store
        self.tau_fast = settings_memory.tau_fast
        self.tau_drift = settings_memory.tau_drift
        self.w_hash = settings_memory.weight_hash
        self.w_spatial = settings_memory.weight_spatial
        self.w_area = settings_memory.weight_area
        self.max_dist = settings_memory.max_drift_distance_px

    def compute_drift_score(
        self,
        obs_hash: str,
        obs_bbox: BoundingBox,
        ref_node: StateNode,
    ) -> Tuple[float, float, float]:
        """
        Computes the composite drift score D in [0.0, 1.0].
        Returns (composite_score, hash_distance, spatial_distance).
        """
        # 1. Perceptual hash distance in [0, 1]
        h_dist = normalized_hash_distance(obs_hash, ref_node.visual_hash)

        # 2. Spatial Euclidean displacement of centers normalized
        s_dist_raw = obs_bbox.center_distance(ref_node.bbox)
        s_dist = min(1.0, s_dist_raw / self.max_dist)

        # 3. Area / Aspect ratio scale variance in [0, 1]
        ref_area = ref_node.bbox.area
        obs_area = obs_bbox.area
        max_area = max(ref_area, obs_area, 1e-6)
        area_variance = abs(obs_area - ref_area) / max_area

        # Composite weighted drift metric
        composite = (
            self.w_hash * h_dist
            + self.w_spatial * s_dist
            + self.w_area * area_variance
        )
        return min(1.0, max(0.0, composite)), h_dist, s_dist

    def evaluate_observation(self, req: DriftCheckRequest) -> DriftCheckResult:
        """
        Evaluates an observed screen element against candidate nodes in episodic memory.
        """
        # 1. Query candidate nodes for this task/step/target
        candidates = self.store.find_candidate_nodes(
            task_id=req.task_id,
            step_index=req.step_index,
            target_element=req.target_element,
        )

        if not candidates:
            # Fallback to all nodes for the task if step_index was unmatched
            candidates = self.store.get_nodes_by_task(req.task_id)

        if not candidates:
            return DriftCheckResult(
                classification=DriftClassification.ANOMALY,
                drift_score=1.0,
                message=f"No existing episodic memory nodes found for task '{req.task_id}'.",
                recommended_action="FALLBACK_PERCEPTION_DISCOVERY",
            )

        # 2. Find best candidate node with minimum drift score
        best_candidate: Optional[StateNode] = None
        min_score = float("inf")
        best_h_dist = 1.0
        best_s_dist = 1.0

        for node in candidates:
            score, h_dist, s_dist = self.compute_drift_score(
                obs_hash=req.observed_visual_hash,
                obs_bbox=req.observed_bbox,
                ref_node=node,
            )
            if score < min_score:
                min_score = score
                best_candidate = node
                best_h_dist = h_dist
                best_s_dist = s_dist

        if not best_candidate:
            return DriftCheckResult(
                classification=DriftClassification.ANOMALY,
                drift_score=1.0,
                message="Evaluation failed to score candidate nodes.",
                recommended_action="EXPLORE",
            )

        # Compute spatial deltas relative to the stored reference
        delta_x = req.observed_bbox.x - best_candidate.bbox.x
        delta_y = req.observed_bbox.y - best_candidate.bbox.y
        delta_w = req.observed_bbox.w - best_candidate.bbox.w
        delta_h = req.observed_bbox.h - best_candidate.bbox.h

        # 3. Classify based on thresholds
        if min_score <= self.tau_fast:
            # Instant visual macro replay
            return DriftCheckResult(
                classification=DriftClassification.MATCH,
                drift_score=round(min_score, 4),
                matched_node_id=best_candidate.id,
                delta_x=round(delta_x, 2),
                delta_y=round(delta_y, 2),
                delta_w=round(delta_w, 2),
                delta_h=round(delta_h, 2),
                hash_distance=round(best_h_dist, 4),
                spatial_distance=round(best_s_dist, 4),
                message=f"Visual state matched node '{best_candidate.id}' within fast-path tolerance.",
                recommended_action="EXECUTE_FAST_PATH_MACRO",
            )
        elif min_score <= self.tau_drift:
            # UI Drift detected -> Self-Healing required
            # Mark node in store as DRIFTED
            self.store.update_node_status(best_candidate.id, NodeStatus.DRIFTED)
            return DriftCheckResult(
                classification=DriftClassification.DRIFT,
                drift_score=round(min_score, 4),
                matched_node_id=best_candidate.id,
                delta_x=round(delta_x, 2),
                delta_y=round(delta_y, 2),
                delta_w=round(delta_w, 2),
                delta_h=round(delta_h, 2),
                hash_distance=round(best_h_dist, 4),
                spatial_distance=round(best_s_dist, 4),
                message=f"UI Drift detected on '{best_candidate.name}' (Δx={round(delta_x, 1)}px, Δy={round(delta_y, 1)}px).",
                recommended_action="TRIGGER_SELF_HEALING_REANCHOR",
            )
        else:
            # Anomaly / Unfamiliar State
            return DriftCheckResult(
                classification=DriftClassification.ANOMALY,
                drift_score=round(min_score, 4),
                matched_node_id=best_candidate.id,
                delta_x=round(delta_x, 2),
                delta_y=round(delta_y, 2),
                delta_w=round(delta_w, 2),
                delta_h=round(delta_h, 2),
                hash_distance=round(best_h_dist, 4),
                spatial_distance=round(best_s_dist, 4),
                message="Visual observation exceeds drift envelope. Unrecognized modal or severe UI reorganization.",
                recommended_action="HALT_OR_RELOCALIZE_VIA_MULTIMODAL_CORE",
            )
