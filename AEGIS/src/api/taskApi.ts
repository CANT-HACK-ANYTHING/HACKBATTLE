// ============================================================================
// Task API — /api/tasks contracts & mock implementation
// ============================================================================

import { request } from './apiClient';
import type { Task } from './types';

let mockTasks: Task[] = [
  {
    id: 'task-101',
    agentId: 'agent-shop-01',
    title: 'Compare headphone deals across retailers',
    description: 'Fetch real-time pricing for Bose QuietComfort Ultra from Amazon, Tata Cliq, and Croma.',
    status: 'in_progress',
    progress: 72,
    createdAt: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    id: 'task-102',
    agentId: 'agent-email-02',
    title: 'Scan executive inboxes for spear-phishing',
    description: 'Validate SPF/DKIM records, sanitize URLs, and sandbox attachments for 14 incoming messages.',
    status: 'in_progress',
    progress: 88,
    createdAt: new Date(Date.now() - 3400000).toISOString(),
  },
  {
    id: 'task-103',
    agentId: 'agent-sec-04',
    title: 'Revoke compromised third-party OAuth token',
    description: 'De-provision rogue API key detected with unauthorized read access to internal payroll.',
    status: 'in_progress',
    progress: 60,
    createdAt: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 'task-104',
    agentId: 'agent-learn-03',
    title: 'Vectorize updated GraphQL schema docs',
    description: 'Embed 42 endpoints into Pinecone memory namespace for query optimization.',
    status: 'in_progress',
    progress: 45,
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
];

export const taskApi = {
  /** GET /api/tasks */
  async getTasks(): Promise<Task[]> {
    return request<Task[]>('GET', '/api/tasks', {
      mockData: [...mockTasks],
      delayMs: 60,
    });
  },

  /** POST /api/tasks */
  async createTask(data: { agentId: string; title: string; description: string }): Promise<Task> {
    const newTask: Task = {
      id: `task-${Math.random().toString(36).substring(2, 6)}`,
      agentId: data.agentId,
      title: data.title,
      description: data.description,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString(),
    };
    mockTasks.unshift(newTask);
    return request<Task>('POST', '/api/tasks', {
      agentId: data.agentId,
      payload: data as Record<string, unknown>,
      mockData: newTask,
      delayMs: 120,
    });
  },

  /** GET /api/tasks/:taskId */
  async getTask(taskId: string): Promise<Task | null> {
    const task = mockTasks.find((t) => t.id === taskId) || null;
    return request<Task | null>('GET', `/api/tasks/${taskId}`, {
      mockData: task,
      delayMs: 40,
    });
  },

  /** PATCH /api/tasks/:taskId */
  async updateTask(taskId: string, data: Partial<Task>): Promise<Task> {
    const idx = mockTasks.findIndex((t) => t.id === taskId);
    if (idx === -1) throw new Error(`Task ${taskId} not found`);
    mockTasks[idx] = { ...mockTasks[idx], ...data };
    return request<Task>('PATCH', `/api/tasks/${taskId}`, {
      payload: data as Record<string, unknown>,
      mockData: mockTasks[idx],
      delayMs: 50,
    });
  },

  /** DELETE /api/tasks/:taskId */
  async deleteTask(taskId: string): Promise<{ success: boolean }> {
    mockTasks = mockTasks.filter((t) => t.id !== taskId);
    return request<{ success: boolean }>('DELETE', `/api/tasks/${taskId}`, {
      mockData: { success: true },
      delayMs: 40,
    });
  },

  /** POST /api/tasks/:taskId/start */
  async startTask(taskId: string): Promise<Task> {
    return this.updateTask(taskId, { status: 'in_progress' });
  },

  /** POST /api/tasks/:taskId/cancel */
  async cancelTask(taskId: string): Promise<Task> {
    return this.updateTask(taskId, { status: 'cancelled' });
  },

  /** GET /api/tasks/:taskId/status */
  async getTaskStatus(taskId: string): Promise<{ status: string; progress: number }> {
    const task = await this.getTask(taskId);
    return {
      status: task?.status || 'unknown',
      progress: task?.progress || 0,
    };
  },
};
