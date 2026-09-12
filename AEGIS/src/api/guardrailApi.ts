// ============================================================================
// Guardrail API — /api/guardrails & evaluate-action contract
// Enforces AI boundaries, human safety, and trust architecture
// ============================================================================

import { request } from './apiClient';
import type { GuardrailDecision, GuardrailRule, RiskLevel } from './types';

let mockGuardrails: GuardrailRule[] = [
  {
    id: 'gr-01',
    name: 'Autonomous Spending Ceiling',
    description: 'Mandates human approval for single transactions exceeding ₹5,000 INR ($60 USD).',
    riskLevel: 'high',
    actionPattern: 'purchase|checkout|pay|transfer',
    decision: 'approval_required',
    active: true,
    timesTriggered: 18,
  },
  {
    id: 'gr-02',
    name: 'Zero-Egress Data Loss Prevention',
    description: 'Immediately blocks any attempt to exfiltrate database records or credentials to non-allowlisted IP ranges.',
    riskLevel: 'critical',
    actionPattern: 'export_db|dump_keys|external_upload',
    decision: 'blocked',
    active: true,
    timesTriggered: 4,
  },
  {
    id: 'gr-03',
    name: 'Privileged Credential Revocation',
    description: 'Requires human confirmation before terminating or revoking company-wide API secrets or tokens.',
    riskLevel: 'medium',
    actionPattern: 'revoke_token|delete_iam_role|rotate_master_key',
    decision: 'approval_required',
    active: true,
    timesTriggered: 12,
  },
  {
    id: 'gr-04',
    name: 'Read-Only Document Analysis Safe Mode',
    description: 'Allows unrestricted semantic extraction and vector indexing of authorized public documentation.',
    riskLevel: 'low',
    actionPattern: 'fetch_doc|vectorize|read_rss|search_catalog',
    decision: 'allowed',
    active: true,
    timesTriggered: 1420,
  },
];

export const guardrailApi = {
  /** GET /api/guardrails */
  async getGuardrails(): Promise<GuardrailRule[]> {
    return request<GuardrailRule[]>('GET', '/api/guardrails', {
      mockData: [...mockGuardrails],
      delayMs: 60,
    });
  },

  /** POST /api/guardrails */
  async createGuardrail(data: Partial<GuardrailRule>): Promise<GuardrailRule> {
    const newRule: GuardrailRule = {
      id: `gr-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name || 'Custom Safety Guardrail',
      description: data.description || 'Behavioral safety limit',
      riskLevel: data.riskLevel || 'medium',
      actionPattern: data.actionPattern || '*',
      decision: data.decision || 'approval_required',
      active: true,
      timesTriggered: 0,
    };
    mockGuardrails.unshift(newRule);
    return request<GuardrailRule>('POST', '/api/guardrails', {
      payload: data as Record<string, unknown>,
      mockData: newRule,
      delayMs: 100,
    });
  },

  /** PATCH /api/guardrails/:guardrailId */
  async updateGuardrail(guardrailId: string, data: Partial<GuardrailRule>): Promise<GuardrailRule> {
    const idx = mockGuardrails.findIndex((g) => g.id === guardrailId);
    if (idx === -1) throw new Error(`Guardrail ${guardrailId} not found`);
    mockGuardrails[idx] = { ...mockGuardrails[idx], ...data };
    return request<GuardrailRule>('PATCH', `/api/guardrails/${guardrailId}`, {
      payload: data as Record<string, unknown>,
      mockData: mockGuardrails[idx],
      delayMs: 50,
    });
  },

  /** DELETE /api/guardrails/:guardrailId */
  async deleteGuardrail(guardrailId: string): Promise<{ success: boolean }> {
    mockGuardrails = mockGuardrails.filter((g) => g.id !== guardrailId);
    return request<{ success: boolean }>('DELETE', `/api/guardrails/${guardrailId}`, {
      mockData: { success: true },
      delayMs: 40,
    });
  },

  /**
   * POST /api/agents/:agentId/evaluate-action
   * Evaluates proposed agent action against all registered safety boundaries.
   */
  async evaluateAction(
    agentId: string,
    action: string,
    params?: Record<string, unknown>
  ): Promise<{
    decision: GuardrailDecision;
    risk: RiskLevel;
    reason: string;
    matchedRuleId?: string;
  }> {
    const lower = action.toLowerCase();

    // 1. Critical block rules
    if (lower.includes('dump') || lower.includes('delete_all') || lower.includes('exfiltrate')) {
      return request('POST', `/api/agents/${agentId}/evaluate-action`, {
        agentId,
        payload: { action, params },
        statusText: '403 Forbidden',
        responseCode: 403,
        mockData: {
          decision: 'blocked' as GuardrailDecision,
          risk: 'critical' as RiskLevel,
          reason: 'Hard boundary triggered: Zero-egress DLP blocked forbidden operation.',
          matchedRuleId: 'gr-02',
        },
        delayMs: 140,
      });
    }

    // 2. High risk / approval rules
    if (
      lower.includes('purchase') ||
      lower.includes('checkout') ||
      lower.includes('pay') ||
      lower.includes('revoke') ||
      lower.includes('transfer')
    ) {
      return request('POST', `/api/agents/${agentId}/evaluate-action`, {
        agentId,
        payload: { action, params },
        statusText: 'APPROVAL_REQUIRED',
        responseCode: 202,
        mockData: {
          decision: 'approval_required' as GuardrailDecision,
          risk: 'high' as RiskLevel,
          reason: 'Financial transaction & credential mutation exceeds autonomous delegation threshold.',
          matchedRuleId: 'gr-01',
        },
        delayMs: 140,
      });
    }

    // 3. Normal / Allowed
    return request('POST', `/api/agents/${agentId}/evaluate-action`, {
      agentId,
      payload: { action, params },
      statusText: '200 OK',
      responseCode: 200,
      mockData: {
        decision: 'allowed' as GuardrailDecision,
        risk: 'low' as RiskLevel,
        reason: 'Action complies with all autonomous operating policies.',
        matchedRuleId: 'gr-04',
      },
      delayMs: 90,
    });
  },
};
