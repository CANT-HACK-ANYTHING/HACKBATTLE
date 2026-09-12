import React from 'react';
import type { GuardrailState } from '../../api/types';

interface AgentGuardrailsProps {
  guardrails?: GuardrailState;
}

export const AgentGuardrails: React.FC<AgentGuardrailsProps> = ({ guardrails }) => {
  if (!guardrails) return null;

  return (
    <div className="agent-meta-item">
      <span className="agent-meta-label">Guardrails</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span
          className="agent-meta-val"
          style={{
            color:
              guardrails.status === 'ACTIVE'
                ? 'var(--teal)'
                : guardrails.status === 'RESTRICTED'
                ? 'var(--gold)'
                : 'var(--danger)',
          }}
        >
          {guardrails.status}
        </span>
        {guardrails.riskThreshold && (
          <span style={{ fontSize: 9, color: 'var(--muted)' }}>[{guardrails.riskThreshold}]</span>
        )}
      </div>
    </div>
  );
};
