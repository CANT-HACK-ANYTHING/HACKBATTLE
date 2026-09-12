// ============================================================================
// Activity API — /api/activity & agent-specific audit trails
// ============================================================================

import { request } from './apiClient';
import type { ActivityEvent } from './types';

let mockActivities: ActivityEvent[] = [
  {
    id: 'act-01',
    agentId: 'agent-sec-04',
    agentName: 'Security Agent',
    type: 'triggered',
    title: 'Privileged Token Exfiltration Guardrail Triggered',
    description: 'Intercepted unauthorized access attempt from suspicious IP range. Approval request dispatched.',
    timestamp: 'Just now',
    importance: 'high',
    codeSnippet: 'POST /api/agents/agent-sec-04/evaluate-action -> APPROVAL_REQUIRED',
  },
  {
    id: 'act-02',
    agentId: 'agent-shop-01',
    agentName: 'Shopping Agent',
    type: 'executed',
    title: 'Discovered Discount on Bose QC Ultra (₹9,499)',
    description: 'Found 18% flash deal on Tata Cliq with instant bank discount. Price meets user target.',
    timestamp: '2m ago',
    importance: 'medium',
    codeSnippet: 'GET /api/shopping/price-check?sku=BOSE-QCU-01 -> 200 OK',
  },
  {
    id: 'act-03',
    agentId: 'agent-email-02',
    agentName: 'Email Security Agent',
    type: 'blocked',
    title: 'Quarantined Weaponized Attachment',
    description: 'Identified malicious macro payload in "Invoice_Sept2026.docm". File isolated into sandbox.',
    timestamp: '5m ago',
    importance: 'high',
    codeSnippet: 'POST /api/email/classify?id=msg-9941 -> phishing (100% confidence)',
  },
  {
    id: 'act-04',
    agentId: 'agent-learn-03',
    agentName: 'Learning Agent',
    type: 'learned',
    title: 'Indexed 42 Microservice Endpoints',
    description: 'Parsed internal OpenAPI specs and generated low-latency tool calling definitions.',
    timestamp: '12m ago',
    importance: 'low',
    codeSnippet: 'POST /api/learning/research -> 200 OK',
  },
  {
    id: 'act-05',
    agentId: 'agent-sub-05',
    agentName: 'Subscription Agent',
    type: 'updated',
    title: 'Identified 3 Dormant Figma Enterprise Seats',
    description: 'Flagged ₹7,200/mo unused license overhead. Recommended license reallocation.',
    timestamp: '18m ago',
    importance: 'medium',
    codeSnippet: 'GET /api/subscriptions/analyze -> 3 underutilized seats',
  },
];

export const activityApi = {
  /** GET /api/activity */
  async getActivity(limit = 20): Promise<ActivityEvent[]> {
    return request<ActivityEvent[]>('GET', '/api/activity', {
      mockData: mockActivities.slice(0, limit),
      delayMs: 50,
    });
  },

  /** GET /api/agents/:agentId/activity */
  async getAgentActivity(agentId: string): Promise<ActivityEvent[]> {
    const filtered = mockActivities.filter((a) => a.agentId === agentId);
    return request<ActivityEvent[]>('GET', `/api/agents/${agentId}/activity`, {
      agentId,
      mockData: filtered,
      delayMs: 50,
    });
  },

  /** Record a live activity event */
  recordActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): ActivityEvent {
    const newEvent: ActivityEvent = {
      ...event,
      id: `act-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: 'Just now',
    };
    mockActivities.unshift(newEvent);
    if (mockActivities.length > 50) mockActivities.pop();
    return newEvent;
  },
};
