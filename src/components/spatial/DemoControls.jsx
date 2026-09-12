import React from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  ShieldAlert,
  ShieldCheck,
  FastForward,
  Layers,
  ChevronRight
} from 'lucide-react';

export const DemoControls = () => {
  const {
    phases,
    currentPhaseIndex,
    currentPhase,
    setPhase,
    isPlaying,
    togglePlay,
    playbackSpeed,
    setPlaybackSpeed,
    soundEnabled,
    toggleSound,
    injectViolation,
    toggleGuardrailViolation,
    triggerDriftNow,
    resetScenario,
  } = useDemo();

  return (
    <div className="w-full glass-panel border-t border-cyan-500/20 bg-slate-950/85 px-4 py-2.5 z-40 select-none">
      <div className="max-w-7xl mx-auto flex flex-col space-y-2">
        {/* Top bar: Narrative Status Banner */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-[10px]">
              PHASE {currentPhase.id}/9
            </span>
            <span className="font-display font-semibold text-slate-100">
              {currentPhase.title}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400 font-mono text-[11px] hidden md:inline">
              {currentPhase.subtitle}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono">
            {/* Speed Multiplier */}
            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5">
              <span className="text-slate-500 text-[10px]">SPEED:</span>
              {[1, 1.5, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className={`px-1 rounded ${playbackSpeed === s ? 'bg-cyan-500/30 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className={`flex items-center space-x-1 px-2 py-1 rounded border transition-colors ${
                soundEnabled
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 hover:bg-cyan-900/50'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-bold">{soundEnabled ? 'AUDIO ON' : 'AUDIO OFF'}</span>
            </button>
          </div>
        </div>

        {/* Phase Scrubber Timeline Bar */}
        <div className="grid grid-cols-9 gap-1">
          {phases.map((p, idx) => {
            const isActive = idx === currentPhaseIndex;
            const isCompleted = idx < currentPhaseIndex;

            return (
              <button
                key={p.id}
                onClick={() => setPhase(idx)}
                className={`py-1.5 px-1 rounded text-left transition-all duration-150 border font-mono text-[10px] flex flex-col justify-between ${
                  isActive
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                    : isCompleted
                    ? 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-slate-500'
                    : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`font-bold ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>
                    0{p.id}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>
                </div>
                <span className="truncate text-[9px] font-semibold mt-0.5">
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Controls & Interactive Hackathon Demonstrators */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
          {/* Play/Pause & Reset */}
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePlay}
              className="flex items-center space-x-1.5 px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs shadow-lg transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'PAUSE DEMO' : 'PLAY DEMO'}</span>
            </button>

            <button
              onClick={resetScenario}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESET</span>
            </button>
          </div>

          {/* Interactive Demonstrators */}
          <div className="flex items-center space-x-2.5">
            {/* Showstopper: Trigger Drift */}
            <button
              onClick={triggerDriftNow}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-mono text-xs shadow transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-bold">SIMULATE DRIFT</span>
            </button>

            {/* Subtrack 3: Guardrail Honeypot Toggle */}
            <button
              onClick={toggleGuardrailViolation}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border font-mono text-xs transition-colors ${
                injectViolation
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              {injectViolation ? (
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>{injectViolation ? 'HONEYPOT VIOLATION (ACTIVE)' : 'INJECT POLICY VIOLATION'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
