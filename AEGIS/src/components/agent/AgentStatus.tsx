import React from 'react';
import type { AgentStatus as AgentStatusType } from '../../api/types';

interface AgentStatusProps {
  status: AgentStatusType;
  showText?: boolean;
}

export const AgentStatus: React.FC<AgentStatusProps> = ({ status, showText = true }) => {
  return (
    <div className={`agent-status-badge badge-${status}`}>
      <span className="status-dot" />
      {showText && <span>{status.replace('_', ' ')}</span>}
    </div>
  );
};
