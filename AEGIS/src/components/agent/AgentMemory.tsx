import React from 'react';
import type { MemoryState } from '../../api/types';

interface AgentMemoryProps {
  memory?: MemoryState;
}

export const AgentMemory: React.FC<AgentMemoryProps> = ({ memory }) => {
  if (!memory) return null;

  return (
    <div className="agent-meta-item">
      <span className="agent-meta-label">Memory</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span
          className="agent-meta-val"
          style={{
            color: memory.status === 'CONNECTED' ? 'var(--teal)' : 'var(--gold)',
          }}
        >
          {memory.status}
        </span>
        {memory.contextSize && (
          <span style={{ fontSize: 9, color: 'var(--muted)' }}>({memory.contextSize})</span>
        )}
      </div>
    </div>
  );
};
