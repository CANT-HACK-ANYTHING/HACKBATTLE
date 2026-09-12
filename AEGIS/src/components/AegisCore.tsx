import React from 'react';
import { useAppStore } from '../store/appStore';

export const AegisCore: React.FC = () => {
  const { agents, resetView } = useAppStore();
  const activeCount = agents.filter(
    (a) => a.status === 'ACTIVE' || a.status === 'EXECUTING' || a.status === 'THINKING'
  ).length;

  return (
    <div className="core-wrap" id="coreWrap">
      {/* Central Glowing AI Intelligence Orb */}
      <div
        className="core-orb"
        onClick={resetView}
        title="AEGIS Central Intelligence Core — Click to center canvas"
      />

      {/* Core Kernel Metadata */}
      <div className="core-label">
        <div className="t1">Autonomous Kernel</div>
        <div className="t2">AEGIS Intelligence Mesh</div>
      </div>

      {/* Anomaly & Active Agents Status Pill */}
      <div className="anomaly-pill" title={`${activeCount} autonomous agent processes coordinated`}>
        <span>Agents:</span>
        <span className="n">{activeCount}</span>
        <span style={{ opacity: 0.5 }}>|</span>
        <span>Guardrails</span>
        <span className="n" style={{ color: 'var(--teal)' }}>
          SECURE
        </span>
      </div>
    </div>
  );
};
