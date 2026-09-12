import React, { useState, useRef } from 'react';
import { LegacyERP } from './LegacyERP';
import { VirtualCursor } from './VirtualCursor';
import { GuardrailModal } from './GuardrailModal';
import { MemoryGraph } from './MemoryGraph';
import { Telemetry } from './Telemetry';
import { useDemo } from '../../context/DemoContext';
import { Monitor, Cpu, Sparkles, AlertCircle } from 'lucide-react';

export const VirtualDesktop = () => {
  const [erpCoordinates, setErpCoordinates] = useState(null);
  const desktopRef = useRef(null);
  const { currentPhase, isDriftActive, injectViolation } = useDemo();

  return (
    <div className="flex-1 w-full flex min-h-0 relative overflow-hidden spatial-grid-bg">
      {/* LEFT / CENTER STAGE: Virtual Desktop running the Legacy ERP */}
      <div
        ref={desktopRef}
        className="flex-1 h-full flex flex-col p-4 relative overflow-hidden items-center justify-center"
      >
        {/* Spatial Stage Ambient Framing */}
        <div className="absolute top-4 left-6 flex items-center space-x-2 text-[11px] font-mono text-slate-400 z-10">
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span>VIRTUAL_HOST: DESKTOP_WIN_LEGACY [SANDBOX_ACTIVE]</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-bold">MODE: DUAL_LAYER_EXECUTION</span>
        </div>

        {/* Anomaly / Warning Banner in Stage if Drift is Active */}
        {isDriftActive && (
          <div className="absolute top-11 left-6 flex items-center space-x-2 text-[10px] font-mono px-2.5 py-1 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300 z-10 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>DISPLACEMENT DETECTED: Landmark Submit (+76px, +42px) — CV Relocalization Engaged</span>
          </div>
        )}

        {/* Mission Complete Overlay Banner */}
        {currentPhase.id === 9 && !injectViolation && (
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-40 flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-300 font-mono text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-bounce">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>MISSION COMPLETE: REAL-WORLD INTERACTION ACHIEVED WITHOUT CHAT CONSTRAINTS</span>
          </div>
        )}

        {/* Centered Legacy ERP Container */}
        <div className="relative z-20 max-w-2xl w-full">
          <LegacyERP onCoordinatesReady={setErpCoordinates} />
        </div>

        {/* Autonomous Virtual Kinematic Cursor Overlay */}
        {erpCoordinates && (
          <VirtualCursor erpCoordinates={erpCoordinates} containerBounds={desktopRef.current?.getBoundingClientRect()} />
        )}

        {/* Guardrail Safety Evaluation Hologram */}
        <GuardrailModal />
      </div>

      {/* RIGHT STAGE: HTML5 Canvas Memory Graph & Real-Time Telemetry */}
      <div className="w-[440px] h-full flex flex-col border-l border-cyan-500/20 glass-panel z-20">
        {/* Top half: HTML5 Canvas Memory Graph */}
        <div className="h-[52%] w-full border-b border-cyan-500/20 relative">
          <MemoryGraph />
        </div>

        {/* Bottom half: Real-Time Telemetry & Event Audit Feed */}
        <div className="flex-1 w-full min-h-0 relative">
          <Telemetry />
        </div>
      </div>
    </div>
  );
};
