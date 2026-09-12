// ============================================================================
// Human Approval API — /api/approvals contracts & actions
// Keeps humans in the loop for high-risk operations
// ============================================================================

import { request } from './apiClient';
import type { ApprovalRequest } from './types';

let mockApprovals: ApprovalRequest[] = [
  {
    id: 'appr-001',
    agentId: 'agent-sec-04',
    agentName: 'Security Agent',
    actionTitle: 'Revoke Rogue Third-Party OAuth Secret #9921',
    reason: 'Token accessed customer PII database from non-allowlisted IP range (185.220.101.5).',
    expectedImpact: 'Immediate session termination for integrated reporting dashboard.',
    riskLevel: 'high',
    status: 'pending',
    requestedAt: new Date(Date.now() - 420000).toISOString(),
  },
  {
    id: 'appr-002',
    agentId: 'agent-shop-01',
    agentName: 'Shopping Agent',
    actionTitle: 'Simulate Checkout: Bose QuietComfort Ultra (₹9,499)',
    reason: 'Price dropped below user budget threshold (₹10,000). Payment authorization required.',
    expectedImpact: 'Simulated debit authorization on corporate procurement account.',
    riskLevel: 'medium',
    status: 'pending',
    requestedAt: new Date(Date.now() - 180000).toISOString(),
  },
];

export const approvalApi = {
  /** GET /api/approvals */
  async getApprovals(): Promise<ApprovalRequest[]> {
    return request<ApprovalRequest[]>('GET', '/api/approvals', {
      mockData: [...mockApprovals],
      delayMs: 60,
    });
  },

  /** POST /api/approvals/:approvalId/approve */
  async approveAction(approvalId: string, notes?: string): Promise<ApprovalRequest> {
    const idx = mockApprovals.findIndex((a) => a.id === approvalId);
    if (idx === -1) throw new Error(`Approval request ${approvalId} not found`);

    mockApprovals[idx] = {
      ...mockApprovals[idx],
      status: 'approved',
      resolvedAt: new Date().toISOString(),
      resolvedBy: 'Maya Chen (Operator)',
      notes: notes || 'Approved by human operator via AEGIS console',
    };

    return request<ApprovalRequest>('POST', `/api/approvals/${approvalId}/approve`, {
      agentId: mockApprovals[idx].agentId,
      payload: { notes },
      mockData: mockApprovals[idx],
      delayMs: 140,
    });
  },

  /** POST /api/approvals/:approvalId/reject */
  async rejectAction(approvalId: string, notes?: string): Promise<ApprovalRequest> {
    const idx = mockApprovals.findIndex((a) => a.id === approvalId);
    if (idx === -1) throw new Error(`Approval request ${approvalId} not found`);

    mockApprovals[idx] = {
      ...mockApprovals[idx],
      status: 'rejected',
      resolvedAt: new Date().toISOString(),
      resolvedBy: 'Maya Chen (Operator)',
      notes: notes || 'Rejected by human operator: Safeguard review required',
    };

    return request<ApprovalRequest>('POST', `/api/approvals/${approvalId}/reject`, {
      agentId: mockApprovals[idx].agentId,
      payload: { notes },
      mockData: mockApprovals[idx],
      delayMs: 120,
    });
  },
};
