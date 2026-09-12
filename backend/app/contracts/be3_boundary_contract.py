"""
Contract with BE 3 (Security Policy Engine & Invariant Hypervisor)
Ensures memory state changes never violate deterministic security boundaries.
Provides hooks for policy verification and atomic state rollback.
"""
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from backend.app.memory.graph_store import GraphStore
from backend.app.memory.models import BoundingBox, NodeStatus


class BoundaryVerificationRequest(BaseModel):
    task_id: str
    node_id: Optional[str] = None
    target_element: str
    proposed_action: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    invariant_context: Dict[str, Any] = Field(default_factory=dict)


class BoundaryVerificationResult(BaseModel):
    is_permitted: bool
    violation_code: Optional[str] = None
    reason: Optional[str] = None
    sha256_proof: Optional[str] = None


class StateRollbackSnapshot(BaseModel):
    snapshot_id: str
    task_id: str
    node_id: str
    previous_bbox: BoundingBox
    previous_hash: str
    previous_status: NodeStatus = NodeStatus.LEARNED
    created_at: str


class BoundaryMemoryBridge:
    def __init__(self, store: GraphStore):
        self.store = store

    def lock_node_on_breach(self, node_id: str, breach_reason: str) -> bool:
        """
        Invoked by BE 3 when a boundary contract is breached.
        Locks the node state and prevents any automated actuation.
        """
        return self.store.update_node_status(node_id, NodeStatus.LOCKED)

    def apply_atomic_rollback(self, snapshot: StateRollbackSnapshot) -> bool:
        """
        Invoked by BE 3 when a post-action invariant fails.
        Restores node coordinates, visual hash, and status back to the verified snapshot.
        """
        return self.store.update_node_geometry(
            node_id=snapshot.node_id,
            new_bbox=snapshot.previous_bbox,
            visual_hash=snapshot.previous_hash,
            increment_heal=False,
            new_status=snapshot.previous_status,
        )
