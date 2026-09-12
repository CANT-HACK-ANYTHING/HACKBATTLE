// ============================================================================
// AEGIS OS — Core TypeScript Interfaces & Data Models
// Generic, API-ready contract for autonomous multi-agent operating system.
// ============================================================================

export type AgentStatus =
  | 'IDLE'
  | 'ACTIVE'
  | 'THINKING'
  | 'LEARNING'
  | 'EXECUTING'
  | 'WAITING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ERROR';

export type AgentType =
  | 'shopping'
  | 'email'
  | 'research'
  | 'learning'
  | 'travel'
  | 'subscription'
  | 'security'
  | 'calendar'
  | 'finance'
  | 'document'
  | 'communication'
  | 'assistant'
  | 'planning'
  | 'memory'
  | 'automation'
  | string;

export type PermissionLevel = 'autonomous' | 'approval_required' | 'restricted' | 'read_only';
export type AutomationLevel = 'full_auto' | 'supervised' | 'manual_verification';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type GuardrailDecision = 'allowed' | 'approval_required' | 'blocked';

export interface AgentPosition {
  x: number;
  y: number;
}

export interface AgentSize {
  w: number;
  h: number;
}

// Generic, Optional Input & Output Contracts (No hardcoded fake inputs)
export interface AgentInput {
  id: string;
  label: string;
  type?: string;
  source?: string;
  value?: unknown;
}

export interface AgentOutput {
  id: string;
  label: string;
  type?: string;
  target?: string;
  destination?: string;
  value?: unknown;
}

export interface MemoryState {
  status: 'CONNECTED' | 'SYNCING' | 'OFFLINE';
  contextSize?: string;
  vectorsCount?: number;
  lastSynced?: string;
  shortTerm?: string;
  longTerm?: string;
  vectorTokens?: number;
  activeContexts?: number;
}

export interface GuardrailState {
  status: 'ACTIVE' | 'RESTRICTED' | 'DISABLED';
  riskThreshold?: 'LOW' | 'MEDIUM' | 'HIGH' | 'STRICT';
  activeRulesCount?: number;
  boundaryAlerts?: number;
  active?: boolean;
  rules?: string[];
  blockedActions?: string[];
}

export interface AgentActivityItem {
  id: string;
  title?: string;
  message?: string;
  description?: string;
  timestamp: string;
  type?: 'processing' | 'memory' | 'guardrail' | 'action' | 'success' | 'warning' | 'error' | 'info';
}

/**
 * Generic Agent Model
 * Driven entirely by data — all telemetry, inputs, outputs, memory, and guardrails
 * are strictly optional and rendered conditionally based on what backend provides.
 */
export interface Agent {
  id: string;
  name: string;
  type: string;
  status: AgentStatus;
  task?: string;
  goal?: string; // Backwards compatible alias
  currentAction?: string;
  progress?: number; // 0-100, optional
  isExpanded?: boolean; // UI expand/minimize state
  position: AgentPosition;
  size?: AgentSize;
  icon?: string;

  // Optional capabilities
  memory?: MemoryState;
  guardrails?: GuardrailState;
  inputs?: AgentInput[];
  outputs?: AgentOutput[];
  activity?: AgentActivityItem[];
  relationships?: string[]; // IDs of connected agents or 'aegis-core'

  permissionLevel?: PermissionLevel;
  automationLevel?: AutomationLevel;
  tools?: string[];
  availableTools?: string[]; // Backwards compatible alias
  metrics?: {
    confidenceScore?: number;
    tokensProcessed?: number;
    uptime?: string;
    queriesHandled?: number;
  };
  metadata?: Record<string, unknown>;
  createdAt?: string;
  lastActiveAt?: string;
}

export interface Task {
  id: string;
  agentId: string;
  title: string;
  description: string;
  status: 'queued' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  progress: number;
  createdAt: string;
  completedAt?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  agentIds: string[];
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  steps: {
    id: string;
    name: string;
    agentType: string;
    status: 'pending' | 'active' | 'done';
  }[];
}

export interface MemoryItem {
  id: string;
  agentId: string;
  title: string;
  content: string;
  importance: number; // 0-100
  confidence: number; // 0-100
  source: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GuardrailRule {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  actionPattern: string;
  decision: GuardrailDecision;
  active: boolean;
  timesTriggered: number;
}

export interface ApprovalRequest {
  id: string;
  agentId: string;
  agentName: string;
  actionTitle: string;
  reason: string;
  expectedImpact: string;
  riskLevel: RiskLevel;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
  payload?: Record<string, unknown>;
}

export interface ActivityEvent {
  id: string;
  agentId: string;
  agentName: string;
  type: 'learned' | 'remembered' | 'connected' | 'triggered' | 'updated' | 'approved' | 'rejected' | 'executed' | 'blocked';
  title: string;
  description: string;
  timestamp: string;
  importance: 'low' | 'medium' | 'high';
  codeSnippet?: string;
}

export interface ApiOperationLog {
  id: string;
  agentId: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  endpoint: string;
  status: '200 OK' | '201 Created' | '202 Queued' | '403 Forbidden' | 'APPROVAL_REQUIRED' | '500 Error';
  responseCode: number;
  payload?: Record<string, unknown>;
  responseSnippet?: string;
  timestamp: string;
  decision?: GuardrailDecision;
}

export interface LearningKnowledge {
  id: string;
  researchId: string;
  topic: string;
  findings: string;
  confidence: number;
  sources: string[];
  learnedAt: string;
}

export interface APIResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: string;
}
