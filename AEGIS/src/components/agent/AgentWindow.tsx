import React, { useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import type { Agent } from '../../api/types';
import { AgentHeader } from './AgentHeader';
import { AgentInputs } from './AgentInputs';
import { AgentOutputs } from './AgentOutputs';
import { AgentMemory } from './AgentMemory';
import { AgentGuardrails } from './AgentGuardrails';
import { AgentActivity } from './AgentActivity';
import { AgentActions } from './AgentActions';

interface AgentWindowProps {
  agent: Agent;
}

export const AgentWindow: React.FC<AgentWindowProps> = ({ agent }) => {
  const {
    selectedAgentId,
    expandedAgentId,
    setSelectedAgent,
    toggleExpandAgent,
    updateAgentPosition,
    updateAgentSize,
    pauseAgent,
    resumeAgent,
    zoom,
  } = useAppStore();

  const isExpanded = expandedAgentId === agent.id;
  const isSelected = selectedAgentId === agent.id;
  const cardRef = useRef<HTMLDivElement>(null);

  // Dragging logic
  const handleHeaderPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setSelectedAgent(agent.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialPos = { ...agent.position };

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;

      const newX = Math.round(initialPos.x + dx);
      const newY = Math.round(initialPos.y + dy);

      updateAgentPosition(agent.id, { x: newX, y: newY });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Resizing logic (only in expanded mode)
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialW = agent.size?.w || 360;
    const initialH = agent.size?.h || 320;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dw = (moveEvent.clientX - startX) / zoom;
      const dh = (moveEvent.clientY - startY) / zoom;

      const newW = Math.max(260, Math.min(600, Math.round(initialW + dw)));
      const newH = Math.max(200, Math.min(500, Math.round(initialH + dh)));

      updateAgentSize(agent.id, { w: newW, h: newH });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAgent(agent.id);
    if (!isExpanded) {
      toggleExpandAgent(agent.id);
    }
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpandAgent(agent.id);
  };

  const handleInspect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAgent(agent.id);
  };

  const isPaused = agent.status === 'PAUSED' || agent.status === 'WAITING';

  const handleTogglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPaused) {
      resumeAgent(agent.id);
    } else {
      pauseAgent(agent.id);
    }
  };

  const cardWidth = isExpanded ? (agent.size?.w || 360) : 240;

  return (
    <div
      ref={cardRef}
      id={`agent-window-${agent.id}`}
      className={`agent-window state-${agent.status} ${isSelected ? 'selected' : ''} ${
        isExpanded ? 'agent-expanded' : 'agent-compact'
      }`}
      style={{
        transform: `translate(${agent.position.x}px, ${agent.position.y}px)`,
        width: `${cardWidth}px`,
        cursor: isExpanded ? 'default' : 'pointer',
      }}
      onClick={handleCardClick}
    >
      {/* Header */}
      <AgentHeader
        agent={agent}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
        onPointerDown={handleHeaderPointerDown}
      />

      {/* COMPACT / MINIMIZED STATE (Initial load default) */}
      {!isExpanded ? (
        <div className="agent-compact-body">
          {agent.task && <div className="agent-compact-task">{agent.task}</div>}
          {typeof agent.progress === 'number' && (
            <div className="agent-progress-row" style={{ marginTop: 4 }}>
              <div className="agent-progress-bar" style={{ height: 3 }}>
                <div className="agent-progress-fill" style={{ width: `${agent.progress}%` }} />
              </div>
              <span style={{ fontSize: 9.5, color: 'var(--teal)', fontWeight: 600 }}>
                {agent.progress}%
              </span>
            </div>
          )}
        </div>
      ) : (
        /* EXPANDED STATE (Appears only upon clicking) */
        <div className="agent-body">
          {/* Current Task */}
          {agent.task && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="agent-meta-label">Current Task</span>
              <div className="agent-task">{agent.task}</div>
            </div>
          )}

          {/* Progress (if present) */}
          {typeof agent.progress === 'number' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="agent-meta-label">Execution Progress</span>
                <span className="agent-progress-text">{agent.progress}%</span>
              </div>
              <div className="agent-progress-bar">
                <div
                  className="agent-progress-fill"
                  style={{
                    width: `${agent.progress}%`,
                    background:
                      agent.status === 'ERROR'
                        ? 'var(--danger)'
                        : agent.status === 'WAITING'
                        ? 'var(--gold)'
                        : undefined,
                  }}
                />
              </div>
            </div>
          )}

          {/* Memory & Guardrails (rendered conditionally based on data) */}
          {(agent.memory || agent.guardrails) && (
            <div className="agent-meta-grid">
              <AgentMemory memory={agent.memory} />
              <AgentGuardrails guardrails={agent.guardrails} />
            </div>
          )}

          {/* Dynamic Inputs (rendered conditionally) */}
          <AgentInputs inputs={agent.inputs} />

          {/* Dynamic Outputs (rendered conditionally) */}
          <AgentOutputs outputs={agent.outputs} />

          {/* Dynamic Activity (rendered conditionally) */}
          <AgentActivity activity={agent.activity} />

          {/* Action controls */}
          <AgentActions
            isExpanded={isExpanded}
            isPaused={isPaused}
            onToggleExpand={handleToggleExpand}
            onInspect={handleInspect}
            onTogglePause={handleTogglePause}
          />
        </div>
      )}

      {/* Resize handle in expanded mode */}
      {isExpanded && (
        <div
          className="resize-handle"
          onPointerDown={handleResizePointerDown}
          title="Drag to resize agent window"
        />
      )}
    </div>
  );
};
