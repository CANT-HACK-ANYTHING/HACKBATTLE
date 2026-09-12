import React from 'react';
import { useDemo } from '../../context/DemoContext';
import { Activity, Compass, Cpu, ShieldCheck, Terminal, Crosshair } from 'lucide-react';
import { DRIFT_OFFSETS } from '../../state/demoState';

export const Telemetry = () => {
  const {
    currentPhase,
    isDriftActive,
    relocalizationProgress,
    guardrailResults,
    buttonState,
    eventLogs,
    activeFocusedField,
  } = useDemo();

  return (
    <div className="w-80 h-full flex flex-col glass-panel border-l border-cyan-500/20 text-xs font-mono select-none overflow-hidden">
      {/* 1. System Header */}
      <div className="px-3 py-2.5 border-b border-cyan-500/20 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-200 tracking-wider">SYSTEM TELEMETRY</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
          LIVE
        </span>
      </div>

      {/* 2. Telemetry Grid Metrics */}
      <div className="p-3 border-b border-slate-800 space-y-2.5 bg-slate-950/40">
        {/* Metric A: Spatial Memory */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center">
            <Compass className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            SPATIAL MEMORY
          </span>
          <span className="text-emerald-400 font-bold">ONLINE [7 NODES]</span>
        </div>

        {/* Metric B: Landmark Anchors */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center">
            <Crosshair className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            LANDMARK TRACKING
          </span>
          <span className="text-cyan-300 font-bold">
            {activeFocusedField ? `FOCUS [${activeFocusedField.toUpperCase()}]` : 'ALL RESOLVED'}
          </span>
        </div>

        {/* Metric C: Drift Detection */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center">
            <Activity className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            DRIFT STATUS
          </span>
          <span className={`font-bold ${isDriftActive ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
            {isDriftActive ? `DETECTED (+${DRIFT_OFFSETS.dx}px, +${DRIFT_OFFSETS.dy}px)` : 'NOMINAL [0.0px]'}
          </span>
        </div>

        {/* Metric D: Relocalization */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">RELOCALIZATION</span>
          <div className="flex items-center space-x-2">
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-200"
                style={{ width: `${relocalizationProgress}%` }}
              ></div>
            </div>
            <span className={`font-bold ${relocalizationProgress >= 100 ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {relocalizationProgress}%
            </span>
          </div>
        </div>

        {/* Metric E: Guardrail Trust */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            GUARDRAILS & TRUST
          </span>
          <span className={`font-bold ${
            guardrailResults.overall === 'BLOCKED'
              ? 'text-rose-400'
              : guardrailResults.overall === 'PASS'
              ? 'text-emerald-400'
              : 'text-amber-400'
          }`}>
            {guardrailResults.overall === 'BLOCKED' ? 'SAFETY_HALT' : guardrailResults.overall === 'PASS' ? 'VERIFIED' : 'ACTIVE'}
          </span>
        </div>

        {/* Metric F: Cursor Kinematics */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">CURSOR MODE</span>
          <span className="text-blue-400 font-bold">AUTONOMOUS KINEMATICS</span>
        </div>
      </div>

      {/* 3. Real-Time Autonomous Audit Event Feed */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950/80">
        <div className="px-3 py-1.5 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center">
            <Terminal className="w-3 h-3 mr-1 text-slate-400" />
            EVENT LOG
          </span>
          <span>AUTOSCROLL ON</span>
        </div>

        <div className="flex-1 p-2 space-y-1.5 overflow-y-auto font-mono text-[10px] scrollbar-thin">
          {eventLogs.map((log) => (
            <div key={log.id} className="leading-tight flex items-start space-x-1.5">
              <span className="text-slate-600 shrink-0">[{log.time}]</span>
              <span
                className={
                  log.type === 'warning'
                    ? 'text-rose-400 font-medium'
                    : log.type === 'success'
                    ? 'text-emerald-300 font-medium'
                    : log.type === 'error'
                    ? 'text-red-400 font-bold'
                    : log.type === 'system'
                    ? 'text-cyan-300'
                    : 'text-slate-300'
                }
              >
                {log.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
