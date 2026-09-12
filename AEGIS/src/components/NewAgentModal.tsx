import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import type { AgentType, AutomationLevel, PermissionLevel } from '../api/types';

const AGENT_TYPES: { type: AgentType; label: string; icon: string; defaultGoal: string }[] = [
  { type: 'shopping', label: 'Shopping Agent', icon: '🛒', defaultGoal: 'Find best deals under specified budget' },
  { type: 'email', label: 'Email Security Agent', icon: '📧', defaultGoal: 'Scan incoming emails and mitigate spear-phishing' },
  { type: 'research', label: 'Research Agent', icon: '🔬', defaultGoal: 'Synthesize research papers and technical whitepapers' },
  { type: 'learning', label: 'Learning Agent', icon: '📚', defaultGoal: 'Ingest APIs, extract schemas, and update vector memory' },
  { type: 'travel', label: 'Travel Agent', icon: '✈️', defaultGoal: 'Monitor flight prices, itineraries, and layover buffers' },
  { type: 'subscription', label: 'Subscription Agent', icon: '🎬', defaultGoal: 'Audit SaaS license usage and detect dormant accounts' },
  { type: 'security', label: 'Security Agent', icon: '🔐', defaultGoal: 'Evaluate token access patterns and enforce guardrails' },
  { type: 'calendar', label: 'Calendar Agent', icon: '📅', defaultGoal: 'Resolve meeting conflicts and coordinate scheduling' },
  { type: 'finance', label: 'Finance Agent', icon: '💳', defaultGoal: 'Reconcile invoices and track procurement budgets' },
  { type: 'document', label: 'Document Agent', icon: '📄', defaultGoal: 'Extract clauses, signatures, and deliverables from contracts' },
  { type: 'communication', label: 'Communication Agent', icon: '💬', defaultGoal: 'Summarize Slack channels and draft team responses' },
  { type: 'assistant', label: 'Personal Assistant', icon: '🤖', defaultGoal: 'Autonomous task queue coordination & triage' },
];

const AVAILABLE_TOOLS = [
  'Web Scraper',
  'Price Comparator',
  'Cart Checkout (Mock)',
  'IMAP / Graph API',
  'Sandbox Scanner',
  'Vector DB (Pinecone)',
  'Doc Parser',
  'IAM Validator',
  'Calendar Sync',
  'Semantic Reasoner',
];

export const NewAgentModal: React.FC = () => {
  const { newAgentModalOpen, setNewAgentModalOpen, createAgent } = useAppStore();

  const [name, setName] = useState('Travel Coordinator Agent');
  const [type, setType] = useState<AgentType>('travel');
  const [goal, setGoal] = useState('Find non-stop flights from BLR to SFO with flexible rebooking policy under ₹80,000');
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>('approval_required');
  const [automationLevel, setAutomationLevel] = useState<AutomationLevel>('supervised');
  const [selectedTools, setSelectedTools] = useState<string[]>(['Web Scraper', 'Semantic Reasoner']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!newAgentModalOpen) return null;

  const handleTypeChange = (newType: AgentType) => {
    setType(newType);
    const meta = AGENT_TYPES.find((t) => t.type === newType);
    if (meta) {
      setName(meta.label);
      setGoal(meta.defaultGoal);
    }
  };

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createAgent({
        name,
        type,
        goal,
        permissionLevel,
        automationLevel,
        availableTools: selectedTools,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setNewAgentModalOpen(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">Create New Agent</div>
          <button
            onClick={() => setNewAgentModalOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Agent Type */}
          <div className="form-group">
            <label className="form-label">Agent Category / Archetype</label>
            <select
              className="form-select"
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as AgentType)}
            >
              {AGENT_TYPES.map((t) => (
                <option key={t.type} value={t.type} style={{ background: '#0d1620' }}>
                  {t.icon} {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Agent Name */}
          <div className="form-group">
            <label className="form-label">Agent Display Name</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Travel Agent"
              required
            />
          </div>

          {/* Task / Goal */}
          <div className="form-group">
            <label className="form-label">Mission Task / Objective</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Define exact task for this autonomous agent..."
              required
            />
          </div>

          {/* Permission & Automation Levels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Permission Tier</label>
              <select
                className="form-select"
                value={permissionLevel}
                onChange={(e) => setPermissionLevel(e.target.value as PermissionLevel)}
              >
                <option value="autonomous" style={{ background: '#0d1620' }}>
                  Autonomous
                </option>
                <option value="approval_required" style={{ background: '#0d1620' }}>
                  Approval Required
                </option>
                <option value="restricted" style={{ background: '#0d1620' }}>
                  Restricted
                </option>
                <option value="read_only" style={{ background: '#0d1620' }}>
                  Read Only
                </option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Automation Level</label>
              <select
                className="form-select"
                value={automationLevel}
                onChange={(e) => setAutomationLevel(e.target.value as AutomationLevel)}
              >
                <option value="full_auto" style={{ background: '#0d1620' }}>
                  Full Auto
                </option>
                <option value="supervised" style={{ background: '#0d1620' }}>
                  Supervised
                </option>
                <option value="manual_verification" style={{ background: '#0d1620' }}>
                  Manual Verification
                </option>
              </select>
            </div>
          </div>

          {/* Available Tools */}
          <div className="form-group">
            <label className="form-label">Granted Tool Capabilities</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 100, overflowY: 'auto' }}>
              {AVAILABLE_TOOLS.map((tool) => {
                const isChecked = selectedTools.includes(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      border: '1px solid',
                      borderColor: isChecked ? 'var(--teal)' : 'var(--panel-border)',
                      background: isChecked ? 'rgba(55,232,196,0.15)' : 'rgba(255,255,255,0.03)',
                      color: isChecked ? 'var(--teal)' : 'var(--muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {tool}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer actions */}
          <div className="modal-footer" style={{ margin: '0 -20px -20px -20px' }}>
            <button
              type="button"
              className="agent-btn"
              onClick={() => setNewAgentModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="new-agent-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deploying...' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
