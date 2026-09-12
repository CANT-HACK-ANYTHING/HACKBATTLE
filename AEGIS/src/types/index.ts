// ============================================================
// Types — replace mock functions with real API calls later
// ============================================================

export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'learning'
  | 'executing'
  | 'waiting_approval'
  | 'completed'
  | 'error';

export type NodeType =
  | 'agent'
  | 'memory'
  | 'entity'
  | 'action'
  | 'document'
  | 'event'
  | 'person';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'executing' | 'completed';

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  avatar?: string;
  createdAt: string;
  lastActiveAt: string;
  permissions: string[];
  memoryCount: number;
  actionCount: number;
}

export interface Memory {
  id: string;
  title: string;
  content: string;
  importance: number; // 0-100
  confidence: number; // 0-100
  createdAt: string;
  updatedAt: string;
  source: string;
  tags: string[];
  agentId: string;
}

export interface Entity {
  id: string;
  name: string;
  type: NodeType;
  description: string;
  importance: number;
  confidence: number;
  createdAt: string;
  updatedAt: string;
  source: string;
  tags: string[];
  metadata?: Record<string, unknown>;
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  strength: number; // 0-100
  type: 'relates_to' | 'contains' | 'triggers' | 'requires' | 'produces' | 'depends_on';
  createdAt: string;
}

export interface Action {
  id: string;
  agentId: string;
  title: string;
  description: string;
  reasoning: string;
  expectedImpact: string;
  riskLevel: RiskLevel;
  status: ActionStatus;
  requiresApproval: boolean;
  createdAt: string;
  completedAt?: string;
  entityIds: string[];
  parameters?: Record<string, unknown>;
}

export interface Approval {
  id: string;
  actionId: string;
  agentId: string;
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  decision?: 'approved' | 'rejected';
  notes?: string;
}

export interface ActivityEvent {
  id: string;
  agentId: string;
  type: 'learned' | 'remembered' | 'connected' | 'triggered' | 'updated' | 'approved' | 'rejected' | 'executed';
  title: string;
  description: string;
  entityId?: string;
  timestamp: string;
  importance: 'low' | 'medium' | 'high';
}

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  importance: number;
  confidence: number;
  x?: number;
  y?: number;
  expanded?: boolean;
  metadata?: Record<string, unknown>;
  tags?: string[];
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrustConfig {
  allowedActions: string[];
  blockedActions: string[];
  maxRiskLevel: RiskLevel;
  requireApprovalFor: string[];
  autonomyLevel: number; // 0-100
}

// API-ready interface shapes (teammates replace these with real calls)
export interface APIResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: string;
}
