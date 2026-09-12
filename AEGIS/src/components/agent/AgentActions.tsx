import React from 'react';

interface AgentActionsProps {
  isExpanded: boolean;
  isPaused: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
  onInspect: (e: React.MouseEvent) => void;
  onTogglePause?: (e: React.MouseEvent) => void;
}

export const AgentActions: React.FC<AgentActionsProps> = ({
  isExpanded,
  isPaused,
  onToggleExpand,
  onInspect,
  onTogglePause,
}) => {
  return (
    <div className="agent-actions-row">
      <button className="agent-btn" onClick={onToggleExpand}>
        {isExpanded ? 'Minimize' : 'Expand'}
      </button>

      {onTogglePause && (
        <button className="agent-btn" onClick={onTogglePause}>
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      )}

      <button className="agent-btn inspect-btn" onClick={onInspect}>
        Inspect
      </button>
    </div>
  );
};
