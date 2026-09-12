"""
Graph Store: Relational CRUD & Graph Query Engine for AegisOS
High-throughput queries for fast-path state retrieval, atomic updates, and episode tracking.
"""
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from backend.app.memory.db import db_session, get_db_connection
from backend.app.memory.models import (
    ActionType,
    BoundingBox,
    CreateEdgeRequest,
    CreateNodeRequest,
    EpisodeRecord,
    HealingLogEntry,
    NodeStatus,
    StateEdge,
    StateNode,
)


class GraphStore:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path

    # =========================================================================
    # Node Operations
    # =========================================================================

    def add_node(self, req: CreateNodeRequest) -> StateNode:
        node_id = req.id or f"node_{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc).isoformat()
        landmarks_json = json.dumps(req.landmarks)
        payload_json = json.dumps(req.action_payload)

        sql = """
        INSERT INTO nodes (
            id, task_id, step_index, name, visual_hash, landmarks_json,
            bbox_x, bbox_y, bbox_w, bbox_h, target_element,
            action_type, action_payload, status, heal_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            task_id = excluded.task_id,
            step_index = excluded.step_index,
            name = excluded.name,
            visual_hash = excluded.visual_hash,
            landmarks_json = excluded.landmarks_json,
            bbox_x = excluded.bbox_x,
            bbox_y = excluded.bbox_y,
            bbox_w = excluded.bbox_w,
            bbox_h = excluded.bbox_h,
            target_element = excluded.target_element,
            action_type = excluded.action_type,
            action_payload = excluded.action_payload,
            status = excluded.status,
            heal_count = excluded.heal_count,
            updated_at = excluded.updated_at
        """

        with db_session(self.db_path) as conn:
            conn.execute(
                sql,
                (
                    node_id,
                    req.task_id,
                    req.step_index,
                    req.name,
                    req.visual_hash,
                    landmarks_json,
                    req.bbox.x,
                    req.bbox.y,
                    req.bbox.w,
                    req.bbox.h,
                    req.target_element,
                    req.action_type.value,
                    payload_json,
                    req.status.value,
                    now,
                    now,
                ),
            )

        return self.get_node(node_id)  # type: ignore

    def get_node(self, node_id: str) -> Optional[StateNode]:
        sql = "SELECT * FROM nodes WHERE id = ?"
        with db_session(self.db_path) as conn:
            row = conn.execute(sql, (node_id,)).fetchone()
            if not row:
                return None
            return self._row_to_node(row)

    def get_nodes_by_task(self, task_id: str) -> List[StateNode]:
        sql = "SELECT * FROM nodes WHERE task_id = ? ORDER BY step_index ASC"
        with db_session(self.db_path) as conn:
            rows = conn.execute(sql, (task_id,)).fetchall()
            return [self._row_to_node(r) for r in rows]

    def find_candidate_nodes(
        self,
        task_id: str,
        step_index: Optional[int] = None,
        target_element: Optional[str] = None,
    ) -> List[StateNode]:
        params: list = [task_id]
        clauses = ["task_id = ?"]

        if step_index is not None:
            clauses.append("step_index = ?")
            params.append(step_index)

        if target_element is not None:
            clauses.append("target_element = ?")
            params.append(target_element)

        sql = f"SELECT * FROM nodes WHERE {' AND '.join(clauses)} ORDER BY step_index ASC"
        with db_session(self.db_path) as conn:
            rows = conn.execute(sql, tuple(params)).fetchall()
            return [self._row_to_node(r) for r in rows]

    def update_node_status(self, node_id: str, status: NodeStatus) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        sql = "UPDATE nodes SET status = ?, updated_at = ? WHERE id = ?"
        with db_session(self.db_path) as conn:
            cur = conn.execute(sql, (status.value, now, node_id))
            return cur.rowcount > 0

    def update_node_geometry(
        self,
        node_id: str,
        new_bbox: BoundingBox,
        visual_hash: Optional[str] = None,
        increment_heal: bool = True,
        new_status: NodeStatus = NodeStatus.HEALED,
    ) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        if visual_hash:
            sql = """
            UPDATE nodes 
            SET bbox_x = ?, bbox_y = ?, bbox_w = ?, bbox_h = ?,
                visual_hash = ?,
                heal_count = heal_count + ?,
                status = ?,
                updated_at = ?
            WHERE id = ?
            """
            params = (
                new_bbox.x,
                new_bbox.y,
                new_bbox.w,
                new_bbox.h,
                visual_hash,
                1 if increment_heal else 0,
                new_status.value,
                now,
                node_id,
            )
        else:
            sql = """
            UPDATE nodes 
            SET bbox_x = ?, bbox_y = ?, bbox_w = ?, bbox_h = ?,
                heal_count = heal_count + ?,
                status = ?,
                updated_at = ?
            WHERE id = ?
            """
            params = (
                new_bbox.x,
                new_bbox.y,
                new_bbox.w,
                new_bbox.h,
                1 if increment_heal else 0,
                new_status.value,
                now,
                node_id,
            )

        with db_session(self.db_path) as conn:
            cur = conn.execute(sql, params)
            return cur.rowcount > 0

    # =========================================================================
    # Edge Operations
    # =========================================================================

    def add_edge(self, req: CreateEdgeRequest) -> StateEdge:
        action_id = req.action_id or f"act_{uuid.uuid4().hex[:6]}"
        now = datetime.now(timezone.utc).isoformat()

        with db_session(self.db_path) as conn:
            existing = conn.execute(
                "SELECT id FROM edges WHERE source_node_id = ? AND target_node_id = ?",
                (req.source_node_id, req.target_node_id),
            ).fetchone()

            if existing:
                edge_id = existing["id"]
                conn.execute(
                    """
                    UPDATE edges SET
                        action_id = ?,
                        transition_confidence = ?
                    WHERE id = ?
                    """,
                    (action_id, req.transition_confidence, edge_id),
                )
            else:
                edge_id = getattr(req, "id", None) or f"edge_{uuid.uuid4().hex[:8]}"
                conn.execute(
                    """
                    INSERT INTO edges (
                        id, source_node_id, target_node_id, action_id,
                        transition_confidence, execution_count, avg_latency_ms, created_at
                    ) VALUES (?, ?, ?, ?, ?, 0, 0.0, ?)
                    """,
                    (
                        edge_id,
                        req.source_node_id,
                        req.target_node_id,
                        action_id,
                        req.transition_confidence,
                        now,
                    ),
                )

        return self.get_edge(edge_id)  # type: ignore

    def get_edge(self, edge_id: str) -> Optional[StateEdge]:
        sql = "SELECT * FROM edges WHERE id = ?"
        with db_session(self.db_path) as conn:
            row = conn.execute(sql, (edge_id,)).fetchone()
            if not row:
                return None
            return self._row_to_edge(row)

    def get_edges_by_task(self, task_id: str) -> List[StateEdge]:
        sql = """
        SELECT e.* FROM edges e
        JOIN nodes n ON e.source_node_id = n.id
        WHERE n.task_id = ?
        """
        with db_session(self.db_path) as conn:
            rows = conn.execute(sql, (task_id,)).fetchall()
            return [self._row_to_edge(r) for r in rows]

    def delete_edges_by_task(self, task_id: str) -> int:
        sql = """
        DELETE FROM edges 
        WHERE source_node_id IN (SELECT id FROM nodes WHERE task_id = ?)
           OR target_node_id IN (SELECT id FROM nodes WHERE task_id = ?)
        """
        with db_session(self.db_path) as conn:
            cur = conn.execute(sql, (task_id, task_id))
            return cur.rowcount

    def increment_edge_execution(
        self, source_node_id: str, target_node_id: str, latency_ms: float
    ) -> bool:
        sql = """
        UPDATE edges
        SET execution_count = execution_count + 1,
            avg_latency_ms = ((avg_latency_ms * execution_count) + ?) / (execution_count + 1)
        WHERE source_node_id = ? AND target_node_id = ?
        """
        with db_session(self.db_path) as conn:
            cur = conn.execute(sql, (latency_ms, source_node_id, target_node_id))
            return cur.rowcount > 0

    # =========================================================================
    # Healing Logs Operations
    # =========================================================================

    def log_healing_event(self, entry: HealingLogEntry) -> bool:
        sql = """
        INSERT INTO healing_logs (
            id, node_id, task_id, detected_drift_score,
            delta_x, delta_y, delta_w, delta_h, reason,
            relocalized_at, telemetry_event_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        with db_session(self.db_path) as conn:
            cur = conn.execute(
                sql,
                (
                    entry.id,
                    entry.node_id,
                    entry.task_id,
                    entry.detected_drift_score,
                    entry.delta_x,
                    entry.delta_y,
                    entry.delta_w,
                    entry.delta_h,
                    entry.reason,
                    entry.relocalized_at,
                    entry.telemetry_event_id,
                ),
            )
            return cur.rowcount > 0

    def get_healing_logs_by_task(self, task_id: str) -> List[HealingLogEntry]:
        sql = "SELECT * FROM healing_logs WHERE task_id = ? ORDER BY relocalized_at DESC"
        with db_session(self.db_path) as conn:
            rows = conn.execute(sql, (task_id,)).fetchall()
            return [
                HealingLogEntry(
                    id=r["id"],
                    node_id=r["node_id"],
                    task_id=r["task_id"],
                    detected_drift_score=r["detected_drift_score"],
                    delta_x=r["delta_x"],
                    delta_y=r["delta_y"],
                    delta_w=r["delta_w"],
                    delta_h=r["delta_h"],
                    reason=r["reason"],
                    relocalized_at=r["relocalized_at"],
                    telemetry_event_id=r["telemetry_event_id"],
                )
                for r in rows
            ]

    # =========================================================================
    # Episode Operations
    # =========================================================================

    def create_episode(self, episode_id: str, task_name: str) -> EpisodeRecord:
        now = datetime.now(timezone.utc).isoformat()
        sql = """
        INSERT INTO episodes (
            episode_id, task_name, start_time, total_steps,
            drift_incidents, self_healed_count, status
        ) VALUES (?, ?, ?, 0, 0, 0, 'IN_PROGRESS')
        ON CONFLICT(episode_id) DO NOTHING
        """
        with db_session(self.db_path) as conn:
            conn.execute(sql, (episode_id, task_name, now))
        return self.get_episode(episode_id)  # type: ignore

    def get_episode(self, episode_id: str) -> Optional[EpisodeRecord]:
        sql = "SELECT * FROM episodes WHERE episode_id = ?"
        with db_session(self.db_path) as conn:
            row = conn.execute(sql, (episode_id,)).fetchone()
            if not row:
                return None
            return EpisodeRecord(
                episode_id=row["episode_id"],
                task_name=row["task_name"],
                start_time=row["start_time"],
                end_time=row["end_time"],
                total_steps=row["total_steps"],
                drift_incidents=row["drift_incidents"],
                self_healed_count=row["self_healed_count"],
                status=row["status"],
            )

    def record_episode_drift(self, episode_id: str) -> None:
        sql = "UPDATE episodes SET drift_incidents = drift_incidents + 1 WHERE episode_id = ?"
        with db_session(self.db_path) as conn:
            conn.execute(sql, (episode_id,))

    def record_episode_healing(self, episode_id: str) -> None:
        sql = "UPDATE episodes SET self_healed_count = self_healed_count + 1 WHERE episode_id = ?"
        with db_session(self.db_path) as conn:
            conn.execute(sql, (episode_id,))

    def complete_episode(self, episode_id: str, status: str = "COMPLETED") -> None:
        now = datetime.now(timezone.utc).isoformat()
        sql = "UPDATE episodes SET end_time = ?, status = ? WHERE episode_id = ?"
        with db_session(self.db_path) as conn:
            conn.execute(sql, (now, status, episode_id))

    def list_episodes(self, limit: int = 50) -> List[EpisodeRecord]:
        sql = "SELECT * FROM episodes ORDER BY start_time DESC LIMIT ?"
        with db_session(self.db_path) as conn:
            rows = conn.execute(sql, (limit,)).fetchall()
            return [
                EpisodeRecord(
                    episode_id=r["episode_id"],
                    task_name=r["task_name"],
                    start_time=r["start_time"],
                    end_time=r["end_time"],
                    total_steps=r["total_steps"],
                    drift_incidents=r["drift_incidents"],
                    self_healed_count=r["self_healed_count"],
                    status=r["status"],
                )
                for r in rows
            ]

    # =========================================================================
    # Helpers
    # =========================================================================

    def _row_to_node(self, row) -> StateNode:
        landmarks = json.loads(row["landmarks_json"] or "[]")
        action_payload = json.loads(row["action_payload"] or "{}")
        bbox = BoundingBox(
            x=row["bbox_x"],
            y=row["bbox_y"],
            w=row["bbox_w"],
            h=row["bbox_h"],
        )
        return StateNode(
            id=row["id"],
            task_id=row["task_id"],
            step_index=row["step_index"],
            name=row["name"],
            visual_hash=row["visual_hash"],
            landmarks=landmarks,
            bbox=bbox,
            target_element=row["target_element"],
            action_type=ActionType(row["action_type"]),
            action_payload=action_payload,
            status=NodeStatus(row["status"]),
            heal_count=row["heal_count"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    def _row_to_edge(self, row) -> StateEdge:
        return StateEdge(
            id=row["id"],
            source_node_id=row["source_node_id"],
            target_node_id=row["target_node_id"],
            action_id=row["action_id"],
            transition_confidence=row["transition_confidence"],
            execution_count=row["execution_count"],
            avg_latency_ms=row["avg_latency_ms"],
            created_at=row["created_at"],
        )
