import React from 'react';
import { useAppStore } from '../store/appStore';

export const TopBar: React.FC = () => {
  const {
    zoom,
    zoomIn,
    zoomOut,
    resetView,
    activeTool,
    setActiveTool,
    setNewAgentModalOpen,
    liveSimulationActive,
    toggleLiveSimulation,
    approvals,
    setPendingApproval,
  } = useAppStore();

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <header className="topbar">
      {/* Brand Identity */}
      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#05080b" />
            <path
              d="M2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#05080b"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="brand-text">
          <div className="name">AEGIS</div>
          <div className="sub">Autonomous Intelligence OS</div>
        </div>
      </div>

      {/* Primary Toolbar: Select, Pan, Zoom, Reset, Live Simulation */}
      <div className="toolbar" role="toolbar" aria-label="Canvas spatial controls">
        {/* Select Tool */}
        <button
          className={activeTool === 'select' ? 'active' : ''}
          onClick={() => setActiveTool('select')}
          title="Select tool (V)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 4l7 16 2-7 7-2z" />
          </svg>
        </button>

        {/* Pan Tool */}
        <button
          className={activeTool === 'pan' ? 'active' : ''}
          onClick={() => setActiveTool('pan')}
          title="Pan tool (H or Space+Drag)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 2v20M2 12h20" />
          </svg>
        </button>

        <div className="div" />

        {/* Zoom In Button */}
        <button onClick={zoomIn} title="Zoom in (+)" disabled={zoom >= 2.0}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="M11 8v6M8 11h6M21 21l-4-4" />
          </svg>
        </button>

        {/* Dynamic Zoom Percentage Indicator */}
        <div className="zoom-indicator" title="Current zoom level">
          {Math.round(zoom * 100)}%
        </div>

        {/* Zoom Out Button */}
        <button onClick={zoomOut} title="Zoom out (-)" disabled={zoom <= 0.5}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="M8 11h6M21 21l-4-4" />
          </svg>
        </button>

        {/* Reset View Button */}
        <button onClick={resetView} title="Reset view (100% zoom & center)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>

        <div className="div" />

        {/* Live Simulation Trigger Button */}
        <button
          className={`sim-btn ${liveSimulationActive ? 'active' : ''}`}
          onClick={toggleLiveSimulation}
          title="Run live hackathon demo flow"
          style={{ width: 'auto', padding: '0 10px' }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: liveSimulationActive ? 'var(--violet)' : 'var(--muted)',
              boxShadow: liveSimulationActive ? '0 0 6px var(--violet)' : 'none',
            }}
          />
          <span>{liveSimulationActive ? 'Simulating...' : 'Simulate'}</span>
        </button>
      </div>

      {/* Top-Right: Pending Approvals Pill, New Agent, Avatar */}
      <div className="top-right">
        {pendingCount > 0 && (
          <button
            onClick={() => {
              const firstPending = approvals.find((a) => a.status === 'pending');
              if (firstPending) setPendingApproval(firstPending);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(234, 179, 90, 0.15)',
              border: '1px solid rgba(234, 179, 90, 0.4)',
              color: 'var(--gold)',
              fontSize: 11.5,
              fontWeight: 600,
              padding: '5px 10px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <span>⚠️ Approvals</span>
            <span
              style={{
                background: 'var(--gold)',
                color: '#05080b',
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 10,
              }}
            >
              {pendingCount}
            </span>
          </button>
        )}

        {/* + New Agent Button */}
        <button
          className="new-agent-btn"
          onClick={() => setNewAgentModalOpen(true)}
          title="Spawn a new autonomous spatial agent window"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>New agent</span>
        </button>

        <div className="avatar" title="Maya Chen (Operator)">
          MC
        </div>
      </div>
    </header>
  );
};
