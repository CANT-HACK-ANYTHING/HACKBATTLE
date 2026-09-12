import React, { useState } from 'react';
import { useAppStore, type InspectorTab } from '../store/appStore';
import { guardrailApi, memoryApi } from '../api';
import type { MemoryItem } from '../api/types';

export const InspectorPanel: React.FC = () => {
  const {
    selectedAgentId,
    agents,
    inspectorOpen,
    setInspectorOpen,
    inspectorTab,
    setInspectorTab,
    pauseAgent,
    resumeAgent,
    stopAgent,
    removeAgent,
    apiLogs,
    activityEvents,
    setPendingApproval,
  } = useAppStore();

  const [searchMemQuery, setSearchMemQuery] = useState('');
  const [searchedMemories, setSearchedMemories] = useState<MemoryItem[] | null>(null);
  const [isSearchingMem, setIsSearchingMem] = useState(false);

  const agent = agents.find((a) => a.id === selectedAgentId);
  if (!inspectorOpen || !agent) return null;

  const handleMemorySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchMemQuery.trim()) {
      setSearchedMemories(null);
      return;
    }
    setIsSearchingMem(true);
    try {
      const results = await memoryApi.searchMemory(agent.id, searchMemQuery);
      setSearchedMemories(results);
    } finally {
      setIsSearchingMem(false);
    }
  };

  const handleSimulateGuardrailEvaluation = async () => {
    const res = await guardrailApi.evaluateAction(agent.id, 'simulated_purchase_checkout', {
      amount: 9499,
      item: 'Bose QC Ultra',
    });

    if (res.decision === 'approval_required') {
      setPendingApproval({
        id: `appr-${Date.now()}`,
        agentId: agent.id,
        agentName: agent.name,
        actionTitle: 'Authorize Simulated Transaction (₹9,499)',
        reason: res.reason,
        expectedImpact: 'Simulated debit on corporate procurement budget.',
        riskLevel: res.risk,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      });
    }
  };

  const agentLogs = apiLogs.filter((l) => l.agentId === agent.id || l.agentId === 'aegis-core');
  const agentActivities = activityEvents.filter((ev) => ev.agentId === agent.id);

  return (
    <aside className="inspector" role="complementary" aria-label="Agent Inspector">
      {/* Header */}
      <div className="inspector-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{agent.icon || '🤖'}</span>
          <div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 14 }}>
              {agent.name}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>
              ID: {agent.id} &bull; {agent.type.toUpperCase()}
            </div>
          </div>
        </div>

        <button
          onClick={() => setInspectorOpen(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
          title="Close inspector (Esc)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="inspector-tabs">
        {(['overview', 'task', 'io', 'memory', 'guardrails', 'api', 'activity'] as InspectorTab[]).map(
          (tab) => (
            <div
              key={tab}
              className={`inspector-tab ${inspectorTab === tab ? 'active' : ''}`}
              onClick={() => setInspectorTab(tab)}
            >
              {tab === 'api'
                ? 'API'
                : tab === 'io'
                ? 'I/O'
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </div>
          )
        )}
      </div>

      {/* Body Content */}
      <div className="inspector-body">
        {/* TAB 1: OVERVIEW */}
        {inspectorTab === 'overview' && (
          <>
            {/* Status & Action */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--panel-border)',
                borderRadius: 10,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Execution State
                </span>
                <span className={`agent-status-badge badge-${agent.status}`}>
                  <span className="status-dot" />
                  {agent.status}
                </span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--text)' }}>
                {agent.currentAction || 'Waiting in idle queue.'}
              </div>
            </div>

            {/* Goal / Task */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="form-label">Objective / Primary Task</span>
              <div
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid var(--panel-border)',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  lineHeight: 1.4,
                }}
              >
                {agent.task || agent.goal || 'Autonomous system execution active.'}
              </div>
            </div>

            {/* Telemetry Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: 8,
                  padding: '8px 10px',
                }}
              >
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>PERMISSION TIER</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal)', marginTop: 2 }}>
                  {(agent.permissionLevel || 'autonomous').replace('_', ' ').toUpperCase()}
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: 8,
                  padding: '8px 10px',
                }}
              >
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>AUTOMATION</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', marginTop: 2 }}>
                  {(agent.automationLevel || 'supervised').replace('_', ' ').toUpperCase()}
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: 8,
                  padding: '8px 10px',
                }}
              >
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>CONFIDENCE SCORE</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal)', marginTop: 2 }}>
                  {agent.metrics?.confidenceScore || 96}%
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: 8,
                  padding: '8px 10px',
                }}
              >
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>TOKENS PROCESSED</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--violet)', marginTop: 2 }}>
                  {(agent.metrics?.tokensProcessed || 42000).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Available Tool Integrations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="form-label">Assigned Capability Tools</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(agent.tools || agent.availableTools || []).map((t: string) => (
                  <span
                    key={t}
                    style={{
                      background: 'rgba(55, 232, 196, 0.08)',
                      border: '1px solid rgba(55, 232, 196, 0.25)',
                      color: 'var(--teal)',
                      fontSize: 10.5,
                      padding: '3px 8px',
                      borderRadius: 6,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {agent.status === 'WAITING' ? (
                <button
                  className="agent-btn"
                  style={{ background: 'rgba(55,232,196,0.15)', color: 'var(--teal)' }}
                  onClick={() => resumeAgent(agent.id)}
                >
                  Resume Agent
                </button>
              ) : (
                <button className="agent-btn" onClick={() => pauseAgent(agent.id)}>
                  Pause Agent
                </button>
              )}
              <button
                className="agent-btn"
                style={{ color: 'var(--gold)' }}
                onClick={() => stopAgent(agent.id)}
              >
                Stop / Complete
              </button>
              <button
                className="agent-btn"
                style={{ color: 'var(--danger)' }}
                onClick={() => removeAgent(agent.id)}
              >
                Terminate
              </button>
            </div>
          </>
        )}

        {/* TAB 2: TASK */}
        {inspectorTab === 'task' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--panel-border)',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase' }}>
                CURRENT EXECUTION TASK
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                {agent.task || agent.goal || 'No task assigned.'}
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span>Progress</span>
                  <span style={{ color: 'var(--teal)' }}>{agent.progress}%</span>
                </div>
                <div className="agent-progress-bar">
                  <div className="agent-progress-fill" style={{ width: `${agent.progress}%` }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="form-label">Step Execution Trace</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: 'rgba(55,232,196,0.06)',
                    borderLeft: '3px solid var(--teal)',
                    fontSize: 11.5,
                  }}
                >
                  <span style={{ color: 'var(--teal)', fontWeight: 600 }}>[DONE] </span>
                  Parsed intent parameters and query constraints
                </div>
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: 'rgba(55,232,196,0.06)',
                    borderLeft: '3px solid var(--teal)',
                    fontSize: 11.5,
                  }}
                >
                  <span style={{ color: 'var(--teal)', fontWeight: 600 }}>[DONE] </span>
                  Dispatched parallel telemetry crawler
                </div>
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: 'rgba(139,147,255,0.08)',
                    borderLeft: '3px solid var(--violet)',
                    fontSize: 11.5,
                  }}
                >
                  <span style={{ color: 'var(--violet)', fontWeight: 600 }}>[ACTIVE] </span>
                  {agent.currentAction || 'Processing context stream...'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DYNAMIC INPUTS & OUTPUTS */}
        {inspectorTab === 'io' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Inputs Section */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--teal)',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                  letterSpacing: '0.04em',
                }}
              >
                Active Input Streams ({agent.inputs?.length || 0})
              </div>
              {!agent.inputs || agent.inputs.length === 0 ? (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--muted)',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 6,
                  }}
                >
                  No input channels currently bound to this agent.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {agent.inputs.map((inp) => (
                    <div
                      key={inp.id}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--panel-border)',
                        borderRadius: 6,
                        padding: '8px 10px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 2,
                        }}
                      >
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)' }}>
                          {inp.label}
                        </span>
                        <span
                          style={{
                            fontSize: 9.5,
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: 'rgba(55,232,196,0.1)',
                            color: 'var(--teal)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {inp.type}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text)',
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                        }}
                      >
                        {typeof inp.value === 'object' ? JSON.stringify(inp.value) : String(inp.value)}
                      </div>
                      {inp.source && (
                        <div style={{ fontSize: 9.5, color: 'var(--muted)', marginTop: 4 }}>
                          Source: {inp.source}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outputs Section */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--violet)',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                  letterSpacing: '0.04em',
                }}
              >
                Generated Output Streams ({agent.outputs?.length || 0})
              </div>
              {!agent.outputs || agent.outputs.length === 0 ? (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--muted)',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 6,
                  }}
                >
                  No outputs generated yet by this agent.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {agent.outputs.map((out) => (
                    <div
                      key={out.id}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--panel-border)',
                        borderRadius: 6,
                        padding: '8px 10px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 2,
                        }}
                      >
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)' }}>
                          {out.label}
                        </span>
                        <span
                          style={{
                            fontSize: 9.5,
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: 'rgba(139,147,255,0.12)',
                            color: 'var(--violet)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {out.type}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text)',
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                        }}
                      >
                        {typeof out.value === 'object' ? JSON.stringify(out.value) : String(out.value)}
                      </div>
                      {out.destination && (
                        <div style={{ fontSize: 9.5, color: 'var(--muted)', marginTop: 4 }}>
                          Destination: {out.destination}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MEMORY */}
        {inspectorTab === 'memory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {agent.memory && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: 6,
                    padding: '8px 10px',
                  }}
                >
                  <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>SHORT-TERM MEMORY</div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--teal)', marginTop: 2 }}>
                    {agent.memory.shortTerm}
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: 6,
                    padding: '8px 10px',
                  }}
                >
                  <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>LONG-TERM MEMORY</div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--violet)', marginTop: 2 }}>
                    {agent.memory.longTerm}
                  </div>
                </div>
                {agent.memory.vectorTokens !== undefined && (
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: 6,
                      padding: '8px 10px',
                    }}
                  >
                    <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>VECTOR TOKENS</div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--gold)', marginTop: 2 }}>
                      {agent.memory.vectorTokens.toLocaleString()}
                    </div>
                  </div>
                )}
                {agent.memory.activeContexts !== undefined && (
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: 6,
                      padding: '8px 10px',
                    }}
                  >
                    <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>ACTIVE CONTEXTS</div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>
                      {agent.memory.activeContexts}
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleMemorySearch} style={{ display: 'flex', gap: 6 }}>
              <input
                className="form-input"
                style={{ flex: 1, fontSize: 11.5 }}
                placeholder="Search semantic memory..."
                value={searchMemQuery}
                onChange={(e) => setSearchMemQuery(e.target.value)}
              />
              <button className="agent-btn inspect-btn" style={{ flex: 'none' }} type="submit">
                {isSearchingMem ? 'Searching...' : 'Search'}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(searchedMemories || [
                {
                  id: 'mem-001',
                  title: 'Task Knowledge & Runtime Context',
                  content: agent.task || agent.goal || 'Execution parameters, tool states, and learned boundaries.',
                  confidence: 98,
                  source: 'Agent active memory state',
                  tags: ['runtime', 'context', 'aegis'],
                },
              ]).map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal)' }}>
                    {m.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 4, lineHeight: 1.35 }}>
                    {m.content}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    {m.tags?.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 9.5,
                          background: 'rgba(255,255,255,0.05)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          color: 'var(--muted)',
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: GUARDRAILS */}
        {inspectorTab === 'guardrails' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                background: 'rgba(234,179,90,0.08)',
                border: '1px solid rgba(234,179,90,0.3)',
                borderRadius: 8,
                padding: 10,
                fontSize: 11.5,
                lineHeight: 1.4,
              }}
            >
              <div style={{ color: 'var(--gold)', fontWeight: 700, marginBottom: 2 }}>
                SAFETY BOUNDARY AUDIT
              </div>
              Autonomous actions that involve financial transactions, database egress, or token mutations
              strictly require human operator sign-off.
            </div>

            {agent.guardrails && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)' }}>ENFORCED RULES</span>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: agent.guardrails.active ? 'rgba(55,232,196,0.1)' : 'rgba(255,107,107,0.1)',
                      color: agent.guardrails.active ? 'var(--teal)' : 'var(--danger)',
                    }}
                  >
                    {agent.guardrails.active ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {agent.guardrails.rules?.map((rule: string, idx: number) => (
                    <div key={idx} style={{ fontSize: 11, color: 'var(--text)', display: 'flex', gap: 6 }}>
                      <span style={{ color: 'var(--teal)' }}>&#10003;</span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
                {agent.guardrails.blockedActions && agent.guardrails.blockedActions.length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--panel-border)' }}>
                    <div style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 600, marginBottom: 4 }}>
                      BLOCKED AUTONOMOUS ACTIONS
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {agent.guardrails.blockedActions.map((b: string, i: number) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 9.5,
                            background: 'rgba(255,107,107,0.1)',
                            border: '1px solid rgba(255,107,107,0.25)',
                            color: 'var(--danger)',
                            padding: '1px 6px',
                            borderRadius: 4,
                          }}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              className="agent-btn inspect-btn"
              style={{ padding: '8px 12px' }}
              onClick={handleSimulateGuardrailEvaluation}
            >
              Simulate Guardrail Evaluation Trigger
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 600 }}>
                  <span>Autonomous Spending Limit</span>
                  <span style={{ color: 'var(--teal)' }}>ENFORCED</span>
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>
                  Hard cap: INR 5,000 without 2FA
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 600 }}>
                  <span>Zero Data-Loss Egress Filter</span>
                  <span style={{ color: 'var(--teal)' }}>ACTIVE</span>
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>
                  PII &amp; API keys cannot leave runtime environment
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: API OPERATIONS VISUALIZATION */}
        {inspectorTab === 'api' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.3 }}>
              Live telemetry of simulated HTTP microservice interactions:
            </div>

            {agentLogs.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--muted-2)', padding: 12, textAlign: 'center' }}>
                No API calls recorded yet. Trigger an action or simulation to view traffic.
              </div>
            ) : (
              agentLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: 6,
                    padding: '6px 8px',
                    fontFamily: 'monospace',
                    fontSize: 11,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--violet)', fontWeight: 700 }}>{log.method}</span>
                    <span
                      style={{
                        color:
                          log.status === '200 OK' || log.status === '201 Created'
                            ? 'var(--teal)'
                            : log.status === 'APPROVAL_REQUIRED'
                            ? 'var(--gold)'
                            : 'var(--danger)',
                        fontWeight: 600,
                      }}
                    >
                      {log.status}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text)', wordBreak: 'break-all' }}>{log.endpoint}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>{log.timestamp}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 7: ACTIVITY AUDIT */}
        {inspectorTab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {agent.activity && agent.activity.length > 0 ? (
              agent.activity.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderLeft: `2px solid ${
                      item.type === 'action'
                        ? 'var(--teal)'
                        : item.type === 'guardrail'
                        ? 'var(--gold)'
                        : item.type === 'memory'
                        ? 'var(--violet)'
                        : 'var(--teal)'
                    }`,
                    padding: '8px 10px',
                    borderRadius: '0 6px 6px 0',
                    fontSize: 11.5,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{item.title || item.message || item.description}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--muted)', marginTop: 2 }}>
                    {item.timestamp}
                  </div>
                </div>
              ))
            ) : agentActivities.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', padding: 16 }}>
                No logged activity yet for this agent node.
              </div>
            ) : (
              agentActivities.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderLeft: `2px solid ${
                      ev.type === 'approved' || ev.type === 'executed'
                        ? 'var(--teal)'
                        : ev.type === 'triggered'
                        ? 'var(--gold)'
                        : 'var(--violet)'
                    }`,
                    padding: '8px 10px',
                    borderRadius: '0 6px 6px 0',
                    fontSize: 11.5,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{ev.title}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>
                    {ev.description}
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--muted-2)', marginTop: 4 }}>
                    {ev.timestamp}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
