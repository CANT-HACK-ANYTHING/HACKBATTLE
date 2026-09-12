// ============================================================================
// Workflow API — /api/workflows contracts & mock implementation
// ============================================================================

import { request } from './apiClient';
import type { Workflow } from './types';

let mockWorkflows: Workflow[] = [
  {
    id: 'wf-order-fulfillment',
    name: 'Autonomous Order Fulfillment & Reconciliation',
    description: 'Coordinates Shopping, Security, and Calendar agents to procure hardware, log invoices, and reconcile ledger.',
    agentIds: ['agent-shop-01', 'agent-sec-04'],
    status: 'running',
    steps: [
      { id: 'step-1', name: 'Price Discovery & SKU Match', agentType: 'shopping', status: 'done' },
      { id: 'step-2', name: 'Vendor Security & OAuth Validation', agentType: 'security', status: 'active' },
      { id: 'step-3', name: 'Purchase Approval Dispatch', agentType: 'shopping', status: 'pending' },
      { id: 'step-4', name: 'Delivery Tracking & ERP Sync', agentType: 'calendar', status: 'pending' },
    ],
  },
  {
    id: 'wf-phishing-defense',
    name: 'Executive Inbox Active Defense',
    description: 'Scans incoming communications, sandboxes attachments, and quarantines credential harvesting vectors.',
    agentIds: ['agent-email-02', 'agent-sec-04'],
    status: 'running',
    steps: [
      { id: 'step-p1', name: 'DKIM / DMARC Header Verification', agentType: 'email', status: 'done' },
      { id: 'step-p2', name: 'Payload Deep-Scan & Link Detonation', agentType: 'security', status: 'active' },
      { id: 'step-p3', name: 'Threat Knowledge Ingestion', agentType: 'learning', status: 'pending' },
    ],
  },
];

export const workflowApi = {
  /** GET /api/workflows */
  async getWorkflows(): Promise<Workflow[]> {
    return request<Workflow[]>('GET', '/api/workflows', {
      mockData: [...mockWorkflows],
      delayMs: 70,
    });
  },

  /** POST /api/workflows */
  async createWorkflow(data: Partial<Workflow>): Promise<Workflow> {
    const newWorkflow: Workflow = {
      id: `wf-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name || 'Custom Workflow',
      description: data.description || 'Autonomous multi-agent orchestration sequence',
      agentIds: data.agentIds || [],
      status: 'idle',
      steps: data.steps || [],
    };
    mockWorkflows.unshift(newWorkflow);
    return request<Workflow>('POST', '/api/workflows', {
      payload: data as Record<string, unknown>,
      mockData: newWorkflow,
      delayMs: 110,
    });
  },

  /** GET /api/workflows/:workflowId */
  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    const wf = mockWorkflows.find((w) => w.id === workflowId) || null;
    return request<Workflow | null>('GET', `/api/workflows/${workflowId}`, {
      mockData: wf,
      delayMs: 40,
    });
  },

  /** PATCH /api/workflows/:workflowId */
  async updateWorkflow(workflowId: string, data: Partial<Workflow>): Promise<Workflow> {
    const idx = mockWorkflows.findIndex((w) => w.id === workflowId);
    if (idx === -1) throw new Error(`Workflow ${workflowId} not found`);
    mockWorkflows[idx] = { ...mockWorkflows[idx], ...data };
    return request<Workflow>('PATCH', `/api/workflows/${workflowId}`, {
      payload: data as Record<string, unknown>,
      mockData: mockWorkflows[idx],
      delayMs: 60,
    });
  },

  /** DELETE /api/workflows/:workflowId */
  async deleteWorkflow(workflowId: string): Promise<{ success: boolean }> {
    mockWorkflows = mockWorkflows.filter((w) => w.id !== workflowId);
    return request<{ success: boolean }>('DELETE', `/api/workflows/${workflowId}`, {
      mockData: { success: true },
      delayMs: 40,
    });
  },

  /** POST /api/workflows/:workflowId/run */
  async runWorkflow(workflowId: string): Promise<Workflow> {
    return this.updateWorkflow(workflowId, { status: 'running' });
  },

  /** POST /api/workflows/:workflowId/pause */
  async pauseWorkflow(workflowId: string): Promise<Workflow> {
    return this.updateWorkflow(workflowId, { status: 'paused' });
  },

  /** POST /api/workflows/:workflowId/resume */
  async resumeWorkflow(workflowId: string): Promise<Workflow> {
    return this.updateWorkflow(workflowId, { status: 'running' });
  },
};
