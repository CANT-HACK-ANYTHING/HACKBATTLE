"""
Self-Healing & Visual Relocalization Engine for AegisOS (BE 2)
Re-anchors drifted state nodes, updates SQLite graph, logs audit trails, and restores muscle memory.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from backend.app.memory.graph_store import GraphStore
from backend.app.memory.models import (
    BoundingBox,
    HealingLogEntry,
    NodeStatus,
    SelfHealRequest,
    SelfHealResult,
)


class SelfHealer:
    def __init__(self, store: GraphStore):
        self.store = store

    def reanchor_node(self, req: SelfHealRequest) -> SelfHealResult:
        """
        Performs atomic re-anchoring of a drifted node:
        1. Calculates spatial delta (Δx, Δy, Δw, Δh).
        2. Updates geometry, visual hash, and status to 'HEALED' in SQLite.
        3. Appends an immutable record to healing_logs.
        4. Increments heal_count so subsequent passes replay instantly.
        """
        node = self.store.get_node(req.node_id)
        if not node:
            raise ValueError(f"State node '{req.node_id}' not found in episodic memory.")

        prev_bbox = node.bbox
        new_bbox = req.new_bbox

        delta_x = round(new_bbox.x - prev_bbox.x, 2)
        delta_y = round(new_bbox.y - prev_bbox.y, 2)
        delta_w = round(new_bbox.w - prev_bbox.w, 2)
        delta_h = round(new_bbox.h - prev_bbox.h, 2)

        # 1. Update node in SQLite
        success = self.store.update_node_geometry(
            node_id=node.id,
            new_bbox=new_bbox,
            visual_hash=req.observed_visual_hash,
            increment_heal=True,
            new_status=NodeStatus.HEALED,
        )

        if not success:
            raise RuntimeError(f"Failed to commit geometry update for node '{node.id}'.")

        # 2. Create healing audit log entry
        log_id = f"heal_{uuid.uuid4().hex[:8]}"
        telemetry_event_id = f"evt_{uuid.uuid4().hex[:6]}"
        now = datetime.now(timezone.utc).isoformat()

        healing_entry = HealingLogEntry(
            id=log_id,
            node_id=node.id,
            task_id=req.task_id,
            detected_drift_score=req.detected_drift_score,
            delta_x=delta_x,
            delta_y=delta_y,
            delta_w=delta_w,
            delta_h=delta_h,
            reason=req.reason,
            relocalized_at=now,
            telemetry_event_id=telemetry_event_id,
        )
        self.store.log_healing_event(healing_entry)

        # 3. Retrieve updated node state
        updated_node = self.store.get_node(node.id)
        heal_count = updated_node.heal_count if updated_node else node.heal_count + 1

        sign_x = "+" if delta_x >= 0 else ""
        sign_y = "+" if delta_y >= 0 else ""

        message = (
            f"[SELF-HEALING: Visual relocalization successful. "
            f"Node '{node.name}' ({node.id}) re-anchored (Δx={sign_x}{delta_x}px, Δy={sign_y}{delta_y}px). "
            f"Updated Episode and restored fast-path muscle memory.]"
        )

        return SelfHealResult(
            success=True,
            node_id=node.id,
            healing_log_id=log_id,
            previous_bbox=prev_bbox,
            new_bbox=new_bbox,
            delta_x=delta_x,
            delta_y=delta_y,
            updated_status=NodeStatus.HEALED,
            heal_count=heal_count,
            message=message,
        )
