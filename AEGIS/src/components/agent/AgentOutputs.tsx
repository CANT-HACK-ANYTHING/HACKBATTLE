import React from 'react';
import type { AgentOutput } from '../../api/types';

interface AgentOutputsProps {
  outputs?: AgentOutput[];
}

export const AgentOutputs: React.FC<AgentOutputsProps> = ({ outputs }) => {
  // If no outputs are provided by the agent data/API, do NOT invent or render any
  if (!outputs || outputs.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 9.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Dispatched Outputs ({outputs.length})
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {outputs.map((out) => (
          <div
            key={out.id}
            title={out.target ? `Target: ${out.target}` : undefined}
            style={{
              background: 'rgba(55, 232, 196, 0.08)',
              border: '1px solid rgba(55, 232, 196, 0.25)',
              borderRadius: 5,
              padding: '2px 6px',
              fontSize: 10,
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ color: 'var(--teal)' }}>&rarr;</span>
            <span>{out.label}</span>
            {out.target && (
              <span style={{ fontSize: 8.5, color: 'var(--teal)' }}>[{out.target}]</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
