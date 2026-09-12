-- =========================================================================
-- AegisOS Episodic Memory & State Graph Schema (BE 2)
-- High-concurrency, WAL-enabled relational storage for visual-spatial macro replay
-- =========================================================================

PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;

-- 1. State Nodes: Visual landmarks, spatial bounding boxes, and action contracts
CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    step_index INTEGER NOT NULL,
    name TEXT NOT NULL,
    visual_hash TEXT NOT NULL,
    landmarks_json TEXT DEFAULT '[]',
    bbox_x REAL NOT NULL,
    bbox_y REAL NOT NULL,
    bbox_w REAL NOT NULL,
    bbox_h REAL NOT NULL,
    target_element TEXT NOT NULL,
    action_type TEXT NOT NULL,
    action_payload TEXT DEFAULT '{}',
    status TEXT NOT NULL CHECK(status IN ('LEARNED', 'ACTIVE', 'DRIFTED', 'HEALED', 'LOCKED')),
    heal_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. State Edges: Transitions between states upon action dispatch
CREATE TABLE IF NOT EXISTS edges (
    id TEXT PRIMARY KEY,
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    action_id TEXT,
    transition_confidence REAL NOT NULL DEFAULT 1.0,
    execution_count INTEGER NOT NULL DEFAULT 0,
    avg_latency_ms REAL NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(source_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
    FOREIGN KEY(target_node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

-- 3. Healing Logs: Audit trail of relocalization and spatial drift corrections
CREATE TABLE IF NOT EXISTS healing_logs (
    id TEXT PRIMARY KEY,
    node_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    detected_drift_score REAL NOT NULL,
    delta_x REAL NOT NULL,
    delta_y REAL NOT NULL,
    delta_w REAL NOT NULL DEFAULT 0.0,
    delta_h REAL NOT NULL DEFAULT 0.0,
    reason TEXT NOT NULL,
    relocalized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    telemetry_event_id TEXT,
    FOREIGN KEY(node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

-- 4. Episodes: Operational sessions and execution batches
CREATE TABLE IF NOT EXISTS episodes (
    episode_id TEXT PRIMARY KEY,
    task_name TEXT NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    total_steps INTEGER NOT NULL DEFAULT 0,
    drift_incidents INTEGER NOT NULL DEFAULT 0,
    self_healed_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED', 'ROLLED_BACK'))
);

-- Indices for microsecond query response
CREATE INDEX IF NOT EXISTS idx_nodes_task ON nodes(task_id, step_index);
CREATE INDEX IF NOT EXISTS idx_nodes_hash ON nodes(visual_hash);
CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_node_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_edges_source_target ON edges(source_node_id, target_node_id);
CREATE INDEX IF NOT EXISTS idx_healing_node ON healing_logs(node_id);
CREATE INDEX IF NOT EXISTS idx_episodes_status ON episodes(status);
