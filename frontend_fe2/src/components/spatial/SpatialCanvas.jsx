import React from 'react';
import { VirtualDesktop } from './VirtualDesktop';
import { DemoControls } from './DemoControls';
import { Cpu, ShieldCheck, Radio, Sparkles } from 'lucide-react';

export const SpatialCanvas = () => {
  return (
    <div className="w-screen h-screen flex flex-col bg-[#050811] text-slate-100 overflow-hidden font-sans relative">
      {/* 1. Futuristic Top Bar Header */}
      <header className="h-12 border-b border-cyan-500/20 bg-slate-950/80 px-4 flex items-center justify-between z-30 select-none">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm bg-cyan-400 shadow-[0_0_10px_#00f0ff] animate-pulse"></div>
            <h1 className="font-display font-bold text-sm tracking-wider uppercase text-slate-100 flex items-center space-x-2">
              <span>AgentDesk OS</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40">
                FE2 SPATIAL
              </span>
            </h1>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            VITHACK 2026: “Rescuing AI from the Chat Window”
          </span>
        </div>

        {/* System Badges */}
        <div className="flex items-center space-x-3 font-mono text-xs">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="text-[11px]">SPATIAL CV: ONLINE</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px]">GUARDRAILS: ARMED</span>
          </div>

          <div className="hidden lg:flex items-center space-x-1 text-[11px] text-slate-400">
            <span>FPS:</span>
            <span className="text-cyan-400 font-bold">60.0</span>
          </div>
        </div>
      </header>

      {/* 2. Main Stage (Virtual Desktop & Memory Graph) */}
      <VirtualDesktop />

      {/* 3. Bottom Demo Timeline Controller */}
      <DemoControls />
    </div>
  );
};
