import React from 'react';
import type { AgentInput } from '../../api/types';

interface AgentInputsProps {
  inputs?: AgentInput[];
}

export const AgentInputs: React.FC<AgentInputsProps> = ({ inputs }) => {
  // If no inputs are provided by the agent data/API, do NOT invent or render any
  if (!inputs || inputs.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 9.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Active Inputs ({inputs.length})
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {inputs.map((inp) => (
          <div
            key={inp.id}
            title={inp.source ? `Source: ${inp.source}` : undefined}
            style={{
              background: 'rgba(139, 147, 255, 0.08)',
              border: '1px solid rgba(139, 147, 255, 0.25)',
              borderRadius: 5,
              padding: '2px 6px',
              fontSize: 10,
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ color: 'var(--violet)' }}>&bull;</span>
            <span>{inp.label}</span>
            {inp.type && (
              <span style={{ fontSize: 8.5, color: 'var(--muted-2)' }}>({inp.type})</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
