// ============================================================================
// AEGIS OS — Central Application State Store (Zustand)
// Manages spatial canvas, generic agent nodes, minimized/expanded states, and approvals.
// ============================================================================

import { create } from 'zustand';
import {
  agentApi,
  INITIAL_AGENTS,
  approvalApi,
  getRecentApiLogs,
  subscribeToApiLogs,
  logApiOperation,
} from '../api';
import type {
  Agent,
  AgentStatus,
  ApprovalRequest,
  ActivityEvent,
  ApiOperationLog,
  PermissionLevel,
  AutomationLevel,
  AgentInput,
  AgentOutput,
} from '../api/types';

export type InspectorTab = 'overview' | 'task' | 'io' | 'memory' | 'guardrails' | 'api' | 'activity';

interface AppStoreState {
  // Spatial Canvas Viewport
  zoom: number;
  pan: { x: number; y: number };
  activeTool: 'select' | 'pan';
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setActiveTool: (tool: 'select' | 'pan') => void;

  // Agents & Window State
  agents: Agent[];
  selectedAgentId: string | null;
  expandedAgentId: string | null; // Track which single agent is expanded (null = all compact)
  draggingAgentId: string | null;
  loadAgents: () => Promise<void>;
  setSelectedAgent: (id: string | null) => void;
  toggleExpandAgent: (id: string) => void;
  setExpandedAgent: (id: string | null) => void;
  setDraggingAgent: (id: string | null) => void;
  updateAgentPosition: (id: string, pos: { x: number; y: number }) => void;
  updateAgentSize: (id: string, size: { w: number; h: number }) => void;
  pauseAgent: (id: string) => Promise<void>;
  resumeAgent: (id: string) => Promise<void>;
  stopAgent: (id: string) => Promise<void>;
  removeAgent: (id: string) => Promise<void>;
  createAgent: (params: {
    name: string;
    type: string;
    task?: string;
    goal?: string;
    permissionLevel?: PermissionLevel;
    automationLevel?: AutomationLevel;
    tools?: string[];
    availableTools?: string[];
    inputs?: AgentInput[];
    outputs?: AgentOutput[];
  }) => Promise<Agent>;

  // Inspector Panel
  inspectorOpen: boolean;
  inspectorTab: InspectorTab;
  setInspectorOpen: (open: boolean) => void;
  setInspectorTab: (tab: InspectorTab) => void;

  // New Agent Modal
  newAgentModalOpen: boolean;
  setNewAgentModalOpen: (open: boolean) => void;

  // Approvals & Guardrails
  approvals: ApprovalRequest[];
  pendingApproval: ApprovalRequest | null;
  loadApprovals: () => Promise<void>;
  setPendingApproval: (appr: ApprovalRequest | null) => void;
  approveAction: (approvalId: string, notes?: string) => Promise<void>;
  rejectAction: (approvalId: string, notes?: string) => Promise<void>;

  // Activity & API Logs
  activityEvents: ActivityEvent[];
  apiLogs: ApiOperationLog[];
  addActivity: (ev: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;

  // System Runtime
  runtimeSeconds: number;
  isClockRunning: boolean;
  toggleClock: () => void;
  resetClock: () => void;
  tickClock: () => void;

  // Live Simulation
  liveSimulationActive: boolean;
  toggleLiveSimulation: () => void;
  runSimulationCycle: () => void;
}

const STORAGE_KEY_VIEWPORT = 'aegis_viewport_state_v2';

function loadStoredViewport() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VIEWPORT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.zoom === 'number') {
        return {
          zoom: Math.min(2.0, Math.max(0.5, parsed.zoom)),
          pan: parsed.pan || { x: 0, y: 0 },
        };
      }
    }
  } catch {
    // ignore
  }
  return { zoom: 1.0, pan: { x: 0, y: 0 } };
}

function saveViewport(zoom: number, pan: { x: number; y: number }) {
  try {
    localStorage.setItem(STORAGE_KEY_VIEWPORT, JSON.stringify({ zoom, pan }));
  } catch {
    // ignore
  }
}

const initialViewport = loadStoredViewport();

export const useAppStore = create<AppStoreState>((set, get) => {
  subscribeToApiLogs((log) => {
    set((state) => ({
      apiLogs: [log, ...state.apiLogs.slice(0, 39)],
    }));
  });

  return {
    // Viewport
    zoom: initialViewport.zoom,
    pan: initialViewport.pan,
    activeTool: 'select',

    setZoom: (zoomOrFn) => {
      set((state) => {
        const nextZoom = typeof zoomOrFn === 'function' ? zoomOrFn(state.zoom) : zoomOrFn;
        const clamped = Math.min(2.0, Math.max(0.5, Math.round(nextZoom * 100) / 100));
        saveViewport(clamped, state.pan);
        return { zoom: clamped };
      });
    },

    zoomIn: () => {
      get().setZoom((z) => Math.min(2.0, z + 0.1));
    },

    zoomOut: () => {
      get().setZoom((z) => Math.max(0.5, z - 0.1));
    },

    resetView: () => {
      set({ zoom: 1.0, pan: { x: 0, y: 0 } });
      saveViewport(1.0, { x: 0, y: 0 });
    },

    setPan: (panOrFn) => {
      set((state) => {
        const nextPan = typeof panOrFn === 'function' ? panOrFn(state.pan) : panOrFn;
        saveViewport(state.zoom, nextPan);
        return { pan: nextPan };
      });
    },

    setActiveTool: (activeTool) => set({ activeTool }),

    // Agents
    agents: INITIAL_AGENTS,
    selectedAgentId: null,
    expandedAgentId: null, // Initial load: ALL agents are compact / minimized
    draggingAgentId: null,

    loadAgents: async () => {
      const agents = await agentApi.getAgents();
      // Ensure all agents start minimized
      set({ agents, expandedAgentId: null });
    },

    setSelectedAgent: (id) => {
      set({ selectedAgentId: id, inspectorOpen: id !== null });
    },

    toggleExpandAgent: (id) => {
      set((state) => ({
        // Toggle expansion: if clicking currently expanded agent, collapse it; otherwise expand only this one
        expandedAgentId: state.expandedAgentId === id ? null : id,
        selectedAgentId: id,
      }));
    },

    setExpandedAgent: (id) => {
      set({ expandedAgentId: id });
    },

    setDraggingAgent: (id) => set({ draggingAgentId: id }),

    updateAgentPosition: (id, pos) => {
      set((state) => ({
        agents: state.agents.map((a) => (a.id === id ? { ...a, position: pos } : a)),
      }));
    },

    updateAgentSize: (id, size) => {
      set((state) => ({
        agents: state.agents.map((a) => (a.id === id ? { ...a, size } : a)),
      }));
    },

    pauseAgent: async (id) => {
      const updated = await agentApi.pauseAgent(id);
      set((state) => ({
        agents: state.agents.map((a) => (a.id === id ? updated : a)),
      }));
      get().addActivity({
        agentId: id,
        agentName: updated.name,
        type: 'updated',
        title: `Paused Agent: ${updated.name}`,
        description: 'Agent paused by operator.',
        importance: 'low',
      });
    },

    resumeAgent: async (id) => {
      const updated = await agentApi.resumeAgent(id);
      set((state) => ({
        agents: state.agents.map((a) => (a.id === id ? updated : a)),
      }));
      get().addActivity({
        agentId: id,
        agentName: updated.name,
        type: 'executed',
        title: `Resumed Agent: ${updated.name}`,
        description: 'Agent resumed autonomous task execution.',
        importance: 'medium',
      });
    },

    stopAgent: async (id) => {
      const updated = await agentApi.stopAgent(id);
      set((state) => ({
        agents: state.agents.map((a) => (a.id === id ? updated : a)),
      }));
      get().addActivity({
        agentId: id,
        agentName: updated.name,
        type: 'updated',
        title: `Stopped Agent: ${updated.name}`,
        description: 'Agent execution finished or halted.',
        importance: 'medium',
      });
    },

    removeAgent: async (id) => {
      await agentApi.deleteAgent(id);
      set((state) => ({
        agents: state.agents.filter((a) => a.id !== id),
        selectedAgentId: state.selectedAgentId === id ? null : state.selectedAgentId,
        expandedAgentId: state.expandedAgentId === id ? null : state.expandedAgentId,
        inspectorOpen: state.selectedAgentId === id ? false : state.inspectorOpen,
      }));
    },

    createAgent: async (params) => {
      const newAgent = await agentApi.createAgent({
        name: params.name,
        type: params.type,
        task: params.task || params.goal,
        permissionLevel: params.permissionLevel,
        automationLevel: params.automationLevel,
        tools: params.tools || params.availableTools,
        inputs: params.inputs,
        outputs: params.outputs,
      });

      set((state) => ({
        agents: [newAgent, ...state.agents],
        selectedAgentId: newAgent.id,
        expandedAgentId: newAgent.id, // Expand the newly created agent
        inspectorOpen: true,
        newAgentModalOpen: false,
      }));

      get().addActivity({
        agentId: newAgent.id,
        agentName: newAgent.name,
        type: 'connected',
        title: `Deployed Agent: ${newAgent.name}`,
        description: `Connected to AEGIS Intelligence Core with dynamic boundaries.`,
        importance: 'high',
      });

      return newAgent;
    },

    // Inspector
    inspectorOpen: false,
    inspectorTab: 'overview',
    setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
    setInspectorTab: (inspectorTab) => set({ inspectorTab }),

    // New Agent Modal
    newAgentModalOpen: false,
    setNewAgentModalOpen: (newAgentModalOpen) => set({ newAgentModalOpen }),

    // Approvals
    approvals: [],
    pendingApproval: null,

    loadApprovals: async () => {
      const approvals = await approvalApi.getApprovals();
      const pending = approvals.find((a) => a.status === 'pending') || null;
      set({ approvals, pendingApproval: pending });
    },

    setPendingApproval: (pendingApproval) => set({ pendingApproval }),

    approveAction: async (approvalId, notes) => {
      const updated = await approvalApi.approveAction(approvalId, notes);
      set((state) => ({
        approvals: state.approvals.map((a) => (a.id === approvalId ? updated : a)),
        pendingApproval: null,
      }));

      const agent = get().agents.find((a) => a.id === updated.agentId);
      if (agent) {
        const next = await agentApi.updateAgent(agent.id, {
          status: 'EXECUTING',
          task: `Approved action executing: ${updated.actionTitle}`,
        });
        set((state) => ({
          agents: state.agents.map((a) => (a.id === next.id ? next : a)),
        }));
      }

      get().addActivity({
        agentId: updated.agentId,
        agentName: updated.agentName,
        type: 'approved',
        title: `Operator Approved: ${updated.actionTitle}`,
        description: `Safety boundary cleared by operator. Proceeding with execution.`,
        importance: 'high',
      });
    },

    rejectAction: async (approvalId, notes) => {
      const updated = await approvalApi.rejectAction(approvalId, notes);
      set((state) => ({
        approvals: state.approvals.map((a) => (a.id === approvalId ? updated : a)),
        pendingApproval: null,
      }));

      const agent = get().agents.find((a) => a.id === updated.agentId);
      if (agent) {
        const next = await agentApi.updateAgent(agent.id, {
          status: 'WAITING',
          task: `Action rejected by operator: ${updated.actionTitle}`,
        });
        set((state) => ({
          agents: state.agents.map((a) => (a.id === next.id ? next : a)),
        }));
      }

      get().addActivity({
        agentId: updated.agentId,
        agentName: updated.agentName,
        type: 'rejected',
        title: `Operator Rejected: ${updated.actionTitle}`,
        description: `Action rejected. Guardrail prevented state change.`,
        importance: 'high',
      });
    },

    // Activity & API Logs
    activityEvents: [
      {
        id: 'act-01',
        agentId: 'agent-sec-02',
        agentName: 'Security Agent',
        type: 'triggered',
        title: 'Privileged Token Revocation Guardrail Triggered',
        description: 'Detected suspicious OAuth client egress. Approval request dispatched.',
        timestamp: 'Just now',
        importance: 'high',
      },
      {
        id: 'act-02',
        agentId: 'agent-learn-01',
        agentName: 'Learning Agent',
        type: 'learned',
        title: 'Synthesized 18 Semantic Knowledge Clusters',
        description: 'Updated working memory context and ontology relationships.',
        timestamp: '2m ago',
        importance: 'medium',
      },
      {
        id: 'act-03',
        agentId: 'agent-mem-04',
        agentName: 'Memory Agent',
        type: 'connected',
        title: 'HNSW Vector Space Re-Indexed',
        description: 'Episodic memory synchronized across active agent nodes.',
        timestamp: '5m ago',
        importance: 'low',
      },
    ],

    apiLogs: getRecentApiLogs(),

    addActivity: (event) => {
      const newEv: ActivityEvent = {
        ...event,
        id: `act-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: 'Just now',
      };
      set((state) => ({
        activityEvents: [newEv, ...state.activityEvents.slice(0, 49)],
      }));
    },

    // System Runtime Clock
    runtimeSeconds: 1 * 3600 + 24 * 60 + 8,
    isClockRunning: true,

    toggleClock: () => set((s) => ({ isClockRunning: !s.isClockRunning })),
    resetClock: () => set({ runtimeSeconds: 0 }),
    tickClock: () => {
      if (get().isClockRunning) {
        set((s) => ({ runtimeSeconds: s.runtimeSeconds + 1 }));
      }
    },

    // Live Simulation
    liveSimulationActive: false,

    toggleLiveSimulation: () => {
      const active = !get().liveSimulationActive;
      set({ liveSimulationActive: active });
      if (active) {
        get().runSimulationCycle();
      }
    },

    runSimulationCycle: () => {
      const learningAgent = get().agents.find((a) => a.type === 'learning');
      if (!learningAgent) return;

      // Expand learning agent during live simulation
      set({ expandedAgentId: learningAgent.id, selectedAgentId: learningAgent.id });

      const steps: { status: AgentStatus; task: string; progress: number }[] = [
        { status: 'THINKING', task: 'Synthesizing available knowledge & schema mappings...', progress: 40 },
        { status: 'LEARNING', task: 'Ingesting multi-agent observation vectors into memory...', progress: 65 },
        { status: 'EXECUTING', task: 'Updating ontology mappings and broadcasting to peers...', progress: 85 },
        { status: 'COMPLETED', task: 'Knowledge synthesis completed successfully.', progress: 100 },
      ];

      let currentStep = 0;
      const interval = setInterval(async () => {
        if (!get().liveSimulationActive) {
          clearInterval(interval);
          return;
        }

        if (currentStep < steps.length) {
          const step = steps[currentStep];
          await agentApi.updateAgent(learningAgent.id, {
            status: step.status,
            task: step.task,
            progress: step.progress,
          });

          set((state) => ({
            agents: state.agents.map((a) =>
              a.id === learningAgent.id
                ? {
                    ...a,
                    status: step.status,
                    task: step.task,
                    progress: step.progress,
                  }
                : a
            ),
          }));

          logApiOperation({
            agentId: learningAgent.id,
            method: 'POST',
            endpoint: `/api/agents/${learningAgent.id}/learning`,
            status: '200 OK',
            responseCode: 200,
          });

          currentStep++;
        } else {
          clearInterval(interval);
        }
      }, 1800);
    },
  };
});
