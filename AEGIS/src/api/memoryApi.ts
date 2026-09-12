// ============================================================================
// Memory API — /api/memory & agent-specific memory endpoints
// ============================================================================

import { request } from './apiClient';
import type { MemoryItem } from './types';

let mockMemories: MemoryItem[] = [
  {
    id: 'mem-001',
    agentId: 'agent-shop-01',
    title: 'User Headphone & Audio Hardware Preferences',
    content: 'User prefers over-ear active noise-cancelling models (Bose / Sony) with multipoint Bluetooth, under ₹10,000 threshold. Dislikes in-ear silicone tips.',
    importance: 92,
    confidence: 98,
    source: 'Previous order history & explicit prompt constraints',
    tags: ['preferences', 'hardware', 'audio', 'budget'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'mem-002',
    agentId: 'agent-email-02',
    title: 'Known Phishing Indicators & Impersonated Domains',
    content: 'Detected typosquatted variations of corp domain: "n3xuslabs.ai", "nexus-security-auth.com". Flag immediately upon envelope arrival.',
    importance: 96,
    confidence: 100,
    source: 'Threat intelligence feed & sandbox logs',
    tags: ['security', 'threat-intel', 'phishing', 'domain-reputation'],
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-003',
    agentId: 'agent-learn-03',
    title: 'Vendor API Rate Limits & Backoff Headers',
    content: 'Stripe API enforces 100 req/sec rolling burst; Amazon SP-API requires exponential jittered backoff on 429 Retry-After.',
    importance: 84,
    confidence: 94,
    source: 'Autonomous documentation ingestion',
    tags: ['api-specs', 'rate-limits', 'architecture'],
    createdAt: new Date(Date.now() - 12000000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'mem-004',
    agentId: 'agent-sec-04',
    title: 'Organizational Spending Delegation Threshold',
    content: 'Hard boundary: Any autonomous purchase transaction > ₹5,000 mandates explicit human biometric or cryptographic sign-off.',
    importance: 99,
    confidence: 100,
    source: 'Kernel Guardrail Policy config #G-04',
    tags: ['guardrail', 'compliance', 'spending-limit'],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const memoryApi = {
  /** GET /api/memory */
  async getMemory(): Promise<MemoryItem[]> {
    return request<MemoryItem[]>('GET', '/api/memory', {
      mockData: [...mockMemories],
      delayMs: 60,
    });
  },

  /** POST /api/memory */
  async createMemory(data: Partial<MemoryItem>): Promise<MemoryItem> {
    const newItem: MemoryItem = {
      id: `mem-${Math.random().toString(36).substring(2, 6)}`,
      agentId: data.agentId || 'global',
      title: data.title || 'New Memory Entity',
      content: data.content || '',
      importance: data.importance ?? 75,
      confidence: data.confidence ?? 90,
      source: data.source || 'Human or Agent inference',
      tags: data.tags || ['general'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockMemories.unshift(newItem);
    return request<MemoryItem>('POST', '/api/memory', {
      agentId: data.agentId,
      payload: data as Record<string, unknown>,
      mockData: newItem,
      delayMs: 90,
    });
  },

  /** GET /api/memory/:memoryId */
  async getMemoryItem(memoryId: string): Promise<MemoryItem | null> {
    const item = mockMemories.find((m) => m.id === memoryId) || null;
    return request<MemoryItem | null>('GET', `/api/memory/${memoryId}`, {
      mockData: item,
      delayMs: 40,
    });
  },

  /** PATCH /api/memory/:memoryId */
  async updateMemory(memoryId: string, data: Partial<MemoryItem>): Promise<MemoryItem> {
    const idx = mockMemories.findIndex((m) => m.id === memoryId);
    if (idx === -1) throw new Error(`Memory item ${memoryId} not found`);
    mockMemories[idx] = { ...mockMemories[idx], ...data, updatedAt: new Date().toISOString() };
    return request<MemoryItem>('PATCH', `/api/memory/${memoryId}`, {
      payload: data as Record<string, unknown>,
      mockData: mockMemories[idx],
      delayMs: 50,
    });
  },

  /** DELETE /api/memory/:memoryId */
  async deleteMemory(memoryId: string): Promise<{ success: boolean }> {
    mockMemories = mockMemories.filter((m) => m.id !== memoryId);
    return request<{ success: boolean }>('DELETE', `/api/memory/${memoryId}`, {
      mockData: { success: true },
      delayMs: 40,
    });
  },

  /** GET /api/agents/:agentId/memory */
  async getAgentMemory(agentId: string): Promise<MemoryItem[]> {
    const memories = mockMemories.filter((m) => m.agentId === agentId || m.agentId === 'global');
    return request<MemoryItem[]>('GET', `/api/agents/${agentId}/memory`, {
      agentId,
      mockData: memories,
      delayMs: 60,
    });
  },

  /** POST /api/agents/:agentId/memory/search */
  async searchMemory(agentId: string, query: string): Promise<MemoryItem[]> {
    const lower = query.toLowerCase();
    const matches = mockMemories.filter(
      (m) =>
        (m.agentId === agentId || m.agentId === 'global') &&
        (m.title.toLowerCase().includes(lower) ||
          m.content.toLowerCase().includes(lower) ||
          m.tags.some((t) => t.toLowerCase().includes(lower)))
    );

    return request<MemoryItem[]>('POST', `/api/agents/${agentId}/memory/search`, {
      agentId,
      payload: { query },
      mockData: matches.length > 0 ? matches : mockMemories.slice(0, 2),
      delayMs: 110,
    });
  },
};
