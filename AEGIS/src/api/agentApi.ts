// ============================================================================
// Agent API Service Layer — /api/agents
// Generic, API-ready contracts with isolated development mock data.
// ============================================================================

import { request } from './apiClient';
import type {
  Agent,
  AgentStatus,
  AgentInput,
  AgentOutput,
  AgentActivityItem,
  MemoryState,
} from './types';

const STORAGE_KEY = 'aegis_generic_agents_v3';

/**
 * Clean development mock agents.
 * Notice: All inputs, outputs, memory, guardrails, and progress are generic & optional.
 * NO fake external service integrations (no Stripe, no shipping API, no inventory DB).
 */
export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agent-learn-01',
    name: 'Learning Agent',
    type: 'learning',
    icon: '🧠',
    status: 'THINKING',
    task: 'Synthesizing available knowledge & schema mappings',
    progress: 72,
    position: { x: 500, y: 80 },
    size: { w: 260, h: 84 },
    isExpanded: false,
    relationships: ['aegis-core', 'agent-memory-04'],
    memory: {
      status: 'CONNECTED',
      contextSize: '128k tokens',
      vectorsCount: 1420,
      lastSynced: '2m ago',
    },
    guardrails: {
      status: 'ACTIVE',
      riskThreshold: 'MEDIUM',
      activeRulesCount: 4,
      boundaryAlerts: 0,
    },
    inputs: [
      { id: 'in-1', label: 'Raw Observations', type: 'stream', source: 'Environment Stream' },
      { id: 'in-2', label: 'Heuristic Feedback', type: 'event', source: 'Operator Review' },
    ],
    outputs: [
      { id: 'out-1', label: 'Refined Ontology', type: 'schema', target: 'Episodic Memory' },
    ],
    activity: [
      { id: 'act-1', title: 'Synthesized 18 semantic clusters', timestamp: '1m ago', type: 'processing' },
      { id: 'act-2', title: 'Updated working memory context', timestamp: '4m ago', type: 'memory' },
    ],
    permissionLevel: 'autonomous',
    automationLevel: 'full_auto',
    tools: ['Semantic Reasoner', 'Vector Indexer'],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'agent-sec-02',
    name: 'Security Agent',
    type: 'security',
    icon: '🔐',
    status: 'EXECUTING',
    task: 'Enforcing zero-trust perimeter & token boundaries',
    progress: 88,
    position: { x: 260, y: 160 },
    size: { w: 260, h: 84 },
    isExpanded: false,
    relationships: ['aegis-core'],
    guardrails: {
      status: 'ACTIVE',
      riskThreshold: 'STRICT',
      activeRulesCount: 8,
      boundaryAlerts: 1,
    },
    inputs: [
      { id: 'in-sec-1', label: 'Egress Network Telemetry', type: 'stream', source: 'Kernel Boundary' },
    ],
    outputs: [
      { id: 'out-sec-1', label: 'Authorization Sign-Off', type: 'verdict', target: 'AEGIS Kernel' },
      { id: 'out-sec-2', label: 'Audit Log Entry', type: 'log', target: 'Security Ledger' },
    ],
    activity: [
      { id: 'act-sec-1', title: 'Verified credential token scopes', timestamp: 'Just now', type: 'guardrail' },
      { id: 'act-sec-2', title: 'Egress filter check passed', timestamp: '2m ago', type: 'guardrail' },
    ],
    permissionLevel: 'approval_required',
    automationLevel: 'supervised',
    tools: ['Token Validator', 'DLP Filter'],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'agent-res-03',
    name: 'Research Agent',
    type: 'research',
    icon: '🔬',
    status: 'LEARNING',
    task: 'Deep research on multi-agent collaboration topologies',
    progress: 54,
    position: { x: 740, y: 160 },
    size: { w: 260, h: 84 },
    isExpanded: false,
    relationships: ['aegis-core', 'agent-learn-01'],
    memory: {
      status: 'CONNECTED',
      contextSize: '64k tokens',
      vectorsCount: 890,
      lastSynced: '8m ago',
    },
    inputs: [
      { id: 'in-res-1', label: 'Query Goal', type: 'text', source: 'AEGIS Task Queue' },
      { id: 'in-res-2', label: 'Domain Sources', type: 'url_list', source: 'Curated Index' },
      { id: 'in-res-3', label: 'Prior Synthesis', type: 'document', source: 'Research Store' },
    ],
    outputs: [
      { id: 'out-res-1', label: 'Research Digest', type: 'summary', target: 'Learning Agent' },
    ],
    activity: [
      { id: 'act-res-1', title: 'Extracted 14 structural insights', timestamp: '3m ago', type: 'action' },
    ],
    permissionLevel: 'autonomous',
    automationLevel: 'full_auto',
    tools: ['Web Parser', 'Literature Search'],
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'agent-mem-04',
    name: 'Memory Agent',
    type: 'memory',
    icon: '💾',
    status: 'ACTIVE',
    task: 'Indexing episodic memory & vector embeddings',
    progress: 95,
    position: { x: 300, y: 390 },
    size: { w: 260, h: 84 },
    isExpanded: false,
    relationships: ['aegis-core'],
    memory: {
      status: 'CONNECTED',
      contextSize: '512k tokens',
      vectorsCount: 28400,
      lastSynced: 'Just now',
    },
    // Intentionally no inputs — driven from internal bus
    outputs: [
      { id: 'out-mem-1', label: 'Context Injection Vector', type: 'embedding', target: 'Active Agents' },
    ],
    activity: [
      { id: 'act-mem-1', title: 'Vector index re-clustered (HNSW)', timestamp: '5m ago', type: 'memory' },
    ],
    permissionLevel: 'autonomous',
    automationLevel: 'full_auto',
    tools: ['HNSW Index', 'Embedding Store'],
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'agent-plan-05',
    name: 'Planning Agent',
    type: 'planning',
    icon: '🗺️',
    status: 'IDLE',
    task: 'Awaiting next autonomous goal decomposition',
    position: { x: 700, y: 390 },
    size: { w: 260, h: 84 },
    isExpanded: false,
    relationships: ['aegis-core'],
    guardrails: {
      status: 'ACTIVE',
      riskThreshold: 'MEDIUM',
      activeRulesCount: 5,
    },
    // Intentionally no inputs or outputs when idle
    activity: [
      { id: 'act-plan-1', title: 'Sub-goal DAG verified', timestamp: '12m ago', type: 'action' },
    ],
    permissionLevel: 'autonomous',
    automationLevel: 'supervised',
    tools: ['Hierarchical Planner'],
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    lastActiveAt: new Date().toISOString(),
  },
];

function loadStoredAgents(): Agent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return INITIAL_AGENTS;
}

function saveStoredAgents(agents: Agent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
  } catch {
    // fallback
  }
}

let inMemoryAgents = loadStoredAgents();

export const agentApi = {
  /** GET /api/agents - Return all active agents */
  async getAgents(): Promise<Agent[]> {
    return request<Agent[]>('GET', '/api/agents', {
      mockData: [...inMemoryAgents],
      delayMs: 60,
    });
  },

  /** GET /api/agents/:agentId - Return one agent */
  async getAgent(agentId: string): Promise<Agent | null> {
    const agent = inMemoryAgents.find((a) => a.id === agentId) || null;
    return request<Agent | null>('GET', `/api/agents/${agentId}`, {
      agentId,
      mockData: agent ? { ...agent } : null,
      delayMs: 40,
    });
  },

  /** GET /api/agents/:agentId/status */
  async getAgentStatus(agentId: string): Promise<AgentStatus> {
    const agent = inMemoryAgents.find((a) => a.id === agentId);
    return agent?.status || 'IDLE';
  },

  /** GET /api/agents/:agentId/activity */
  async getAgentActivity(agentId: string): Promise<AgentActivityItem[]> {
    const agent = inMemoryAgents.find((a) => a.id === agentId);
    return agent?.activity || [];
  },

  /** GET /api/agents/:agentId/memory */
  async getAgentMemory(agentId: string): Promise<MemoryState | null> {
    const agent = inMemoryAgents.find((a) => a.id === agentId);
    return agent?.memory || null;
  },

  /** GET /api/agents/:agentId/inputs */
  async getAgentInputs(agentId: string): Promise<AgentInput[]> {
    const agent = inMemoryAgents.find((a) => a.id === agentId);
    return agent?.inputs || [];
  },

  /** GET /api/agents/:agentId/outputs */
  async getAgentOutputs(agentId: string): Promise<AgentOutput[]> {
    const agent = inMemoryAgents.find((a) => a.id === agentId);
    return agent?.outputs || [];
  },

  /** POST /api/agents/:agentId/action - Send an action to an agent */
  async sendAgentAction(agentId: string, action: string, payload?: unknown): Promise<Agent> {
    const idx = inMemoryAgents.findIndex((a) => a.id === agentId);
    if (idx === -1) throw new Error(`Agent ${agentId} not found`);

    if (action === 'pause') {
      inMemoryAgents[idx].status = 'PAUSED';
    } else if (action === 'resume') {
      inMemoryAgents[idx].status = 'EXECUTING';
    } else if (action === 'stop') {
      inMemoryAgents[idx].status = 'COMPLETED';
    }

    saveStoredAgents(inMemoryAgents);

    return request<Agent>('POST', `/api/agents/${agentId}/action`, {
      agentId,
      payload: { action, payload } as Record<string, unknown>,
      mockData: inMemoryAgents[idx],
      delayMs: 70,
    });
  },

  /** POST /api/agents - Dynamically add a new agent */
  async createAgent(data: Partial<Agent>): Promise<Agent> {
    const count = inMemoryAgents.length;
    const angle = (count * (2 * Math.PI)) / 6;
    const radius = 260;
    const centerX = 500;
    const centerY = 240;

    const newAgent: Agent = {
      id: data.id || `agent-${data.type || 'custom'}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name || 'Custom Agent',
      type: data.type || 'learning',
      status: data.status || 'THINKING',
      task: data.task || 'Autonomous workflow execution',
      progress: data.progress ?? 15,
      position: data.position || {
        x: Math.round(centerX + radius * Math.cos(angle)),
        y: Math.round(centerY + radius * Math.sin(angle)),
      },
      size: { w: 260, h: 84 },
      isExpanded: false,
      relationships: ['aegis-core'],
      icon: data.icon || (data.type === 'learning' ? '🧠' : data.type === 'security' ? '🔐' : '🤖'),
      memory: data.memory,
      guardrails: data.guardrails || { status: 'ACTIVE', riskThreshold: 'MEDIUM' },
      inputs: data.inputs,
      outputs: data.outputs,
      activity: data.activity || [
        { id: `act-${Date.now()}`, title: 'Initialized agent runtime', timestamp: 'Just now', type: 'processing' },
      ],
      permissionLevel: data.permissionLevel || 'approval_required',
      automationLevel: data.automationLevel || 'supervised',
      tools: data.tools || ['Reasoner'],
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    inMemoryAgents = [newAgent, ...inMemoryAgents];
    saveStoredAgents(inMemoryAgents);

    return request<Agent>('POST', '/api/agents', {
      agentId: newAgent.id,
      payload: data as Record<string, unknown>,
      mockData: newAgent,
      delayMs: 120,
    });
  },

  /** PATCH /api/agents/:agentId */
  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<Agent> {
    const idx = inMemoryAgents.findIndex((a) => a.id === agentId);
    if (idx === -1) throw new Error(`Agent ${agentId} not found`);

    inMemoryAgents[idx] = {
      ...inMemoryAgents[idx],
      ...updates,
      lastActiveAt: new Date().toISOString(),
    };
    saveStoredAgents(inMemoryAgents);

    return request<Agent>('PATCH', `/api/agents/${agentId}`, {
      agentId,
      payload: updates as Record<string, unknown>,
      mockData: inMemoryAgents[idx],
      delayMs: 50,
    });
  },

  /** DELETE /api/agents/:agentId */
  async deleteAgent(agentId: string): Promise<{ success: boolean }> {
    inMemoryAgents = inMemoryAgents.filter((a) => a.id !== agentId);
    saveStoredAgents(inMemoryAgents);

    return request<{ success: boolean }>('DELETE', `/api/agents/${agentId}`, {
      agentId,
      mockData: { success: true },
      delayMs: 40,
    });
  },

  /** POST /api/agents/:agentId/pause */
  async pauseAgent(agentId: string): Promise<Agent> {
    return this.sendAgentAction(agentId, 'pause');
  },

  /** POST /api/agents/:agentId/resume */
  async resumeAgent(agentId: string): Promise<Agent> {
    return this.sendAgentAction(agentId, 'resume');
  },

  /** POST /api/agents/:agentId/stop */
  async stopAgent(agentId: string): Promise<Agent> {
    return this.sendAgentAction(agentId, 'stop');
  },

  /** Reset stored agents to clean initial list */
  resetAgents(): Agent[] {
    inMemoryAgents = [...INITIAL_AGENTS];
    saveStoredAgents(inMemoryAgents);
    return inMemoryAgents;
  },
};
