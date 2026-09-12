"""
AegisOS Memory Subsystem (BE 2)
"""
from backend.app.memory.db import db_session, get_db_connection, init_db
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
from backend.app.memory.perceptual_hash import (
    compute_ahash,
    compute_dhash,
    generate_synthetic_element,
    hamming_distance,
    hash_from_bytes,
    normalized_hash_distance,
)
from backend.app.memory.self_healer import SelfHealer

__all__ = [
    "db_session",
    "get_db_connection",
    "init_db",
    "GraphStore",
    "DriftDetector",
    "SelfHealer",
    "NodeStatus",
    "ActionType",
    "BoundingBox",
    "StateNode",
    "CreateNodeRequest",
    "StateEdge",
    "CreateEdgeRequest",
    "DriftClassification",
    "DriftCheckRequest",
    "DriftCheckResult",
    "SelfHealRequest",
    "SelfHealResult",
    "HealingLogEntry",
    "EpisodeRecord",
    "MemoryTelemetryEvent",
    "TelemetryEventType",
    "CanvasGraphData",
    "compute_dhash",
    "compute_ahash",
    "hamming_distance",
    "normalized_hash_distance",
    "hash_from_bytes",
    "generate_synthetic_element",
]
