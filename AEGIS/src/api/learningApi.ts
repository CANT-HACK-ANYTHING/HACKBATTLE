// ============================================================================
// Learning API — /api/learning self-directed research & knowledge acquisition
// ============================================================================

import { request } from './apiClient';
import type { LearningKnowledge } from './types';

let mockKnowledge: LearningKnowledge[] = [
  {
    id: 'kn-01',
    researchId: 'res-991',
    topic: 'Stripe Idempotency & Webhook Signature Verification',
    findings: 'Stripe-Signature header uses HMAC-SHA256 with timestamp tolerance window of 300 seconds to prevent replay attacks.',
    confidence: 99,
    sources: ['https://stripe.com/docs/webhooks/signatures', 'internal-gateway-code'],
    learnedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'kn-02',
    researchId: 'res-992',
    topic: 'OAuth2 Proof Key for Code Exchange (PKCE) Best Practices',
    findings: 'Client-side SPA must issue SHA-256 code_challenge and securely retain code_verifier in ephemeral memory.',
    confidence: 97,
    sources: ['RFC 7636 OAuth PKCE', 'Security Knowledge Base'],
    learnedAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

export const learningApi = {
  /** POST /api/learning/research */
  async startResearch(topic: string, agentId = 'agent-learn-03'): Promise<{ researchId: string; status: string }> {
    const researchId = `res-${Math.random().toString(36).substring(2, 6)}`;
    return request('POST', '/api/learning/research', {
      agentId,
      payload: { topic },
      mockData: { researchId, status: 'researching' },
      delayMs: 140,
    });
  },

  /** GET /api/learning/:learningId/status */
  async getLearningStatus(learningId: string): Promise<{ id: string; status: string; progress: number }> {
    return request('GET', `/api/learning/${learningId}/status`, {
      mockData: { id: learningId, status: 'synthesizing', progress: 82 },
      delayMs: 60,
    });
  },

  /** GET /api/learning/:learningId/knowledge */
  async getAcquiredKnowledge(learningId?: string): Promise<LearningKnowledge[]> {
    const data = learningId ? mockKnowledge.filter((k) => k.researchId === learningId) : mockKnowledge;
    return request<LearningKnowledge[]>('GET', `/api/learning/${learningId || 'all'}/knowledge`, {
      mockData: data,
      delayMs: 70,
    });
  },
};
