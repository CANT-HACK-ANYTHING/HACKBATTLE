import React from 'react';
import type { Agent } from '../../api/types';
import { AgentStatus } from './AgentStatus';

interface AgentHeaderProps {
  agent: Agent;
  isExpanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export const AgentHeader: React.FC<AgentHeaderProps> = ({
  agent,
  isExpanded,
  onToggleExpand,
  onPointerDown,
}) => {
  return (
    <div className="agent-header" onPointerDown={onPointerDown}>
      <div className="agent-title">
        <span style={{ fontSize: 14 }}>{agent.icon || '🤖'}</span>
        <span style={{ fontWeight: 600 }}>{agent.name}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <AgentStatus status={agent.status} />
        <button
          className="agent-expand-toggle"
          onClick={onToggleExpand}
          title={isExpanded ? 'Minimize agent card' : 'Expand full agent view'}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--panel-border)',
            borderRadius: 4,
            color: 'var(--muted)',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {isExpanded ? (
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 14h6m0 0v6m0-6L3 21M20 10h-6m0 0V4m0 6l7-7" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};
