import React from 'react';
import { useDemo } from '../../context/DemoContext';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Lock } from 'lucide-react';

export const GuardrailModal = () => {
  const { currentPhaseIndex, guardrailResults, injectViolation } = useDemo();

  // Show during Guardrail Phase (6), Execution (7), or Complete (8)
  if (currentPhaseIndex < 6) return null;

  const { schema, limit, intent, overall } = guardrailResults;

  const isBlocked = overall === 'BLOCKED';

  return (
    <div className="absolute top-4 right-4 z-40 w-80 glass-panel-cyan rounded-md border border-cyan-500/40 p-3 shadow-2xl backdrop-blur-xl animate-fade-in font-mono select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-2.5">
        <div className="flex items-center space-x-2">
          {isBlocked ? (
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Guardrail Trust Harness
          </span>
        </div>
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
            isBlocked
              ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
              : overall === 'PASS'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
              : 'bg-amber-950 text-amber-300 border border-amber-500/50'
          }`}
        >
          {overall === 'BLOCKED' ? 'SAFETY_HALT' : overall === 'PASS' ? 'TRUST_VERIFIED' : 'EVALUATING'}
        </span>
      </div>

      {/* Verification Checks */}
      <div className="space-y-2 text-[11px]">
        {/* Check 1: Schema */}
        <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">1. Schema & Injection</span>
          </div>
          <span className="font-bold flex items-center space-x-1">
            {schema === 'PASS' && <span className="text-emerald-400 flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> PASS</span>}
            {schema === 'CHECKING' && <span className="text-amber-400 animate-pulse">CHECKING</span>}
            {schema === 'PENDING' && <span className="text-slate-500">QUEUED</span>}
          </span>
        </div>

        {/* Check 2: Financial Threshold */}
        <div className={`flex items-center justify-between p-1.5 rounded border ${
          limit === 'FAIL' ? 'bg-rose-950/50 border-rose-500/50 text-rose-300' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex flex-col">
            <span className={limit === 'FAIL' ? 'text-rose-300 font-semibold' : 'text-slate-400'}>
              2. Spend Authorization
            </span>
            <span className="text-[9px] text-slate-500">Cap: ≤ ₹100,000 / PO</span>
          </div>
          <span className="font-bold flex items-center space-x-1">
            {limit === 'PASS' && <span className="text-emerald-400 flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> PASS</span>}
            {limit === 'FAIL' && <span className="text-rose-400 flex items-center"><XCircle className="w-3.5 h-3.5 mr-1" /> BLOCKED</span>}
            {limit === 'CHECKING' && <span className="text-amber-400 animate-pulse">CHECKING</span>}
            {limit === 'PENDING' && <span className="text-slate-500">QUEUED</span>}
          </span>
        </div>

        {/* Check 3: Semantic Alignment */}
        <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">3. Context Alignment</span>
          </div>
          <span className="font-bold flex items-center space-x-1">
            {intent === 'PASS' && <span className="text-emerald-400 flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> PASS</span>}
            {intent === 'CHECKING' && <span className="text-amber-400 animate-pulse">CHECKING</span>}
            {intent === 'PENDING' && <span className="text-slate-500">QUEUED</span>}
          </span>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-2.5 pt-2 border-t border-cyan-500/20 text-[10px] text-slate-400">
        {isBlocked ? (
          <div className="flex items-start space-x-1.5 text-rose-400 bg-rose-950/40 p-1.5 rounded border border-rose-500/30">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Honeypot Triggered: Total exceeds authorized financial ceiling. Autonomous click execution revoked.</span>
          </div>
        ) : overall === 'PASS' ? (
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Execution Token: AUTH-0x892F-VERIFIED</span>
          </div>
        ) : (
          <span className="text-slate-500">Evaluating safety boundaries before hardware dispatch...</span>
        )}
      </div>
    </div>
  );
};
