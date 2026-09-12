import React from 'react';
import { useAppStore } from '../store/appStore';

export const AlertsPanel: React.FC = () => {
  const { approvals, setPendingApproval } = useAppStore();

  return (
    <div className="alerts-panel">
      <div className="alerts-head">
        <span>Guardrail alerts</span>
        <span className="count">2</span>
      </div>
      <div
        className="alert-row"
        onClick={() => {
          const appr = approvals.find((a) => a.id === 'appr-001') || approvals[0];
          if (appr) setPendingApproval(appr);
        }}
        title="Click to inspect and review this guardrail alert"
      >
        <div>
          <div className="msg">Escalation threshold exceeded — Refund Agent</div>
          <div className="meta">2 minutes ago</div>
        </div>
      </div>
      <div
        className="alert-row"
        onClick={() => {
          const appr = approvals.find((a) => a.id === 'appr-002') || approvals[1];
          if (appr) setPendingApproval(appr);
        }}
        title="Click to inspect and review this latency notification"
      >
        <div>
          <div className="msg">Unusual latency detected on Shipping API</div>
          <div className="meta">5 minutes ago</div>
        </div>
      </div>
    </div>
  );
};
