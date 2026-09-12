import React from 'react';
import { useAppStore } from '../store/appStore';

export const MetricStack: React.FC = () => {
  const { agents } = useAppStore();
  const activeCount = agents.filter(
    (a) => a.status === 'ACTIVE' || a.status === 'EXECUTING' || a.status === 'THINKING'
  ).length;

  return (
    <div className="metric-stack" id="metricStack">
      {/* Tasks Queued */}
      <div className="metric-card" data-node="m0">
        <div className="metric-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
            <circle cx="12" cy="12" r="3.2" />
          </svg>
        </div>
        <div>
          <div className="metric-num">18</div>
          <div className="metric-label">Tasks queued</div>
        </div>
      </div>

      {/* Active Agents (Dynamically driven) */}
      <div className="metric-card" data-node="m1">
        <div className="metric-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
          </svg>
        </div>
        <div>
          <div className="metric-num" style={{ color: 'var(--teal)' }}>
            {activeCount}
          </div>
          <div className="metric-label">Active agents</div>
        </div>
      </div>

      {/* Automated Today */}
      <div className="metric-card highlight" data-node="m2">
        <div className="metric-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <div className="metric-num">24</div>
          <div className="metric-label">Automated today</div>
        </div>
      </div>

      {/* Guardrail Checks */}
      <div className="metric-card" data-node="m3">
        <div className="metric-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l7 3v6c0 5-3.4 8.4-7 10-3.6-1.6-7-5-7-10V5l7-3z" />
          </svg>
        </div>
        <div>
          <div className="metric-num">32</div>
          <div className="metric-label">Guardrail checks</div>
        </div>
      </div>

      {/* Escalations */}
      <div className="metric-card" data-node="m4">
        <div className="metric-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v4M12 17h.01M10.3 3.9L2.7 17a1.8 1.8 0 001.5 2.7h15.6a1.8 1.8 0 001.5-2.7L13.7 3.9a1.8 1.8 0 00-3.4 0z" />
          </svg>
        </div>
        <div>
          <div className="metric-num" style={{ color: 'var(--gold)' }}>
            12
          </div>
          <div className="metric-label">Escalations</div>
        </div>
      </div>
    </div>
  );
};
