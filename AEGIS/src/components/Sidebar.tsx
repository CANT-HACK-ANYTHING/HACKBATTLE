import React, { useEffect } from 'react';
import { useAppStore } from '../store/appStore';

export const Sidebar: React.FC = () => {
  const {
    runtimeSeconds,
    isClockRunning,
    toggleClock,
    resetClock,
    tickClock,
    approvals,
    setPendingApproval,
    setNewAgentModalOpen,
  } = useAppStore();

  useEffect(() => {
    const interval = setInterval(() => {
      tickClock();
    }, 1000);
    return () => clearInterval(interval);
  }, [tickClock]);

  const formatRuntime = (totalSec: number) => {
    const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <aside className="sidebar">
      {/* Operator Profile */}
      <div className="profile">
        <div className="avatar">MC</div>
        <div className="who">
          <div className="name">Maya Chen</div>
          <div className="email">maya@aegis-os.ai</div>
        </div>
      </div>

      {/* Quick Action Button */}
      <button
        className="ghost-btn"
        onClick={() => setNewAgentModalOpen(true)}
        title="Deploy task or agent into spatial runtime"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
        </svg>
        Deploy task payload
      </button>

      {/* Human Escalation Section */}
      <div className="side-section">
        <div className="side-head">
          <span>Pending review</span>
        </div>
        <div
          className="pending-row"
          onClick={() => {
            const firstPending = approvals.find((a) => a.status === 'pending');
            if (firstPending) setPendingApproval(firstPending);
          }}
          title="Click to view and resolve human authorization requests"
        >
          <span>Escalated tasks</span>
          <span className="count">{pendingCount > 0 ? pendingCount : 2}</span>
        </div>
      </div>

      {/* Workflow Strategy Navigation — Note: "Connect APIs" is REMOVED per requirement 16 */}
      <div className="side-section">
        <div className="side-head">
          <span>Build workflow</span>
          <span
            className="plus"
            onClick={() => setNewAgentModalOpen(true)}
            title="Add autonomous node"
          >
            +
          </span>
        </div>
        <div className="nav-list">
          <div className="nav-item active">
            <span className="dot" style={{ background: 'var(--teal)' }} />
            Define agent goals
          </div>
          <div className="nav-item">
            <span className="dot" style={{ background: 'var(--gold)' }} />
            Set guardrails
          </div>
          <div className="nav-item">
            <span className="dot" style={{ background: 'var(--teal)' }} />
            Train on feedback
          </div>
          <div className="nav-item">
            <span className="dot" style={{ background: 'var(--muted-2)' }} />
            Deploy &amp; monitor
          </div>
        </div>
      </div>

      <div className="sidebar-spacer" />

      {/* Real-time Agent Runtime Card */}
      <div className="runtime-card">
        <div className="label">Agent runtime</div>
        <div className="runtime-row">
          <div className="runtime-time" id="runtimeClock">
            {formatRuntime(runtimeSeconds)}
          </div>
          <div className="runtime-controls">
            <button
              className="pause"
              onClick={toggleClock}
              title={isClockRunning ? 'Pause runtime clock' : 'Resume runtime clock'}
            >
              {isClockRunning ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" />
                  <rect x="14" y="5" width="4" height="14" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6,4 20,12 6,20" />
                </svg>
              )}
            </button>
            <button
              className="stop"
              onClick={resetClock}
              title="Reset runtime clock"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="5" width="14" height="14" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
