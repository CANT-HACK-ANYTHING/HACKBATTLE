import React from 'react';
import { useAppStore } from '../store/appStore';

export const ApprovalModal: React.FC = () => {
  const { pendingApproval, setPendingApproval, approveAction, rejectAction } = useAppStore();

  if (!pendingApproval) return null;

  const riskColor =
    pendingApproval.riskLevel === 'critical'
      ? 'var(--danger)'
      : pendingApproval.riskLevel === 'high'
      ? 'var(--danger)'
      : pendingApproval.riskLevel === 'medium'
      ? 'var(--gold)'
      : 'var(--teal)';

  return (
    <div className="modal-overlay" onClick={() => setPendingApproval(null)}>
      <div
        className="modal-card"
        style={{ maxWidth: 520, border: '1px solid rgba(234, 179, 90, 0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ background: 'rgba(234, 179, 90, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🛡️</span>
            <div>
              <div className="modal-title" style={{ color: 'var(--gold)' }}>
                Human Approval Mandated
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Agent: {pendingApproval.agentName} ({pendingApproval.agentId})
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              background: 'rgba(234, 179, 90, 0.18)',
              color: riskColor,
              border: `1px solid ${riskColor}`,
            }}
          >
            {pendingApproval.riskLevel} Risk
          </div>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ gap: 14 }}>
          {/* Action Title */}
          <div>
            <div className="form-label">Proposed Action</div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text)',
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              {pendingApproval.actionTitle}
            </div>
          </div>

          {/* Reasoning */}
          <div>
            <div className="form-label">Rationale / Why AI Wants To Do It</div>
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--muted)',
                lineHeight: 1.4,
                marginTop: 2,
                background: 'rgba(255,255,255,0.02)',
                padding: '8px 10px',
                borderRadius: 6,
              }}
            >
              {pendingApproval.reason}
            </div>
          </div>

          {/* Expected Impact */}
          <div>
            <div className="form-label">Anticipated Impact &amp; Consequence</div>
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--muted)',
                lineHeight: 1.4,
                marginTop: 2,
                background: 'rgba(255,255,255,0.02)',
                padding: '8px 10px',
                borderRadius: 6,
              }}
            >
              {pendingApproval.expectedImpact}
            </div>
          </div>

          {/* Trust Statement */}
          <div
            style={{
              fontSize: 10.5,
              color: 'var(--muted)',
              fontStyle: 'italic',
              borderLeft: '2px solid var(--gold)',
              paddingLeft: 8,
            }}
          >
            AEGIS Kernel Policy: Autonomous authority is bounded. High-impact operations pause until verified by human operator.
          </div>
        </div>

        {/* Footer actions */}
        <div className="modal-footer">
          <button
            type="button"
            className="agent-btn"
            style={{ color: 'var(--danger)', borderColor: 'rgba(239, 106, 106, 0.3)' }}
            onClick={() => rejectAction(pendingApproval.id)}
          >
            Reject Action
          </button>
          <button
            type="button"
            className="new-agent-btn"
            style={{
              background: 'linear-gradient(180deg, rgba(234, 179, 90, 0.25), rgba(234, 179, 90, 0.1))',
              borderColor: 'var(--gold)',
              color: 'var(--gold)',
            }}
            onClick={() => approveAction(pendingApproval.id)}
          >
            Authorize Action
          </button>
        </div>
      </div>
    </div>
  );
};
