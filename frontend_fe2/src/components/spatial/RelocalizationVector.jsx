import React from 'react';
import { useDemo } from '../../context/DemoContext';
import { DRIFT_OFFSETS } from '../../state/demoState';

export const RelocalizationVector = ({ originCoords, targetCoords }) => {
  const { isDriftActive, relocalizationProgress, currentPhaseIndex } = useDemo();

  // If drift is not active and not in relocalization phases, hide overlay
  if (!isDriftActive && currentPhaseIndex < 4) return null;

  const x1 = originCoords?.x || 0;
  const y1 = originCoords?.y || 0;
  const x2 = targetCoords?.x || (x1 + DRIFT_OFFSETS.dx);
  const y2 = targetCoords?.y || (y1 + DRIFT_OFFSETS.dy);

  // Vector midpoint for the HUD telemetry badge
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const isRecovered = relocalizationProgress >= 100;
  const progressRatio = (relocalizationProgress || 0) / 100;

  // Vector angle
  const angleRad = Math.atan2(y2 - y1, x2 - x1);
  const angleDeg = (angleRad * 180) / Math.PI;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
      {/* SVG Canvas for mathematical vector ray & target reticle */}
      <svg className="w-full h-full absolute inset-0 overflow-visible">
        <defs>
          <linearGradient id="vectorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.9" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Expected Anchor Ghost Box */}
        <rect
          x={x1 - 50}
          y={y1 - 16}
          width={100}
          height={32}
          rx={4}
          fill="none"
          stroke="#f43f5e"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          className="animate-pulse"
        />

        {/* Expected origin reticle */}
        <circle cx={x1} cy={y1} r={4} fill="#f43f5e" />
        <circle cx={x1} cy={y1} r={10} stroke="#f43f5e" strokeWidth={1} fill="none" opacity="0.4" />

        {/* 2. Dotted Directional Vector */}
        <line
          x1={x1}
          y1={y1}
          x2={x1 + (x2 - x1) * (isRecovered ? 1 : Math.max(0.15, progressRatio))}
          y2={y1 + (y2 - y1) * (isRecovered ? 1 : Math.max(0.15, progressRatio))}
          stroke={isRecovered ? '#10b981' : 'url(#vectorGradient)'}
          strokeWidth={2.5}
          strokeDasharray="6 4"
          className="animate-dash-march"
          filter="url(#glow)"
        />

        {/* 3. Actual Drifted Target Box */}
        <rect
          x={x2 - 50}
          y={y2 - 16}
          width={100}
          height={32}
          rx={4}
          fill={isRecovered ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 240, 255, 0.06)'}
          stroke={isRecovered ? '#10b981' : '#00f0ff'}
          strokeWidth={2}
          filter="url(#glow)"
        />

        {/* Dynamic target reticle */}
        <circle cx={x2} cy={y2} r={5} fill={isRecovered ? '#10b981' : '#00f0ff'} />
        <circle
          cx={x2}
          cy={y2}
          r={isRecovered ? 14 : 12 + Math.sin(Date.now() / 200) * 3}
          stroke={isRecovered ? '#10b981' : '#00f0ff'}
          strokeWidth={1.5}
          fill="none"
          strokeDasharray={isRecovered ? 'none' : '3 3'}
        />

        {/* Relocalization ripple wave on recovery */}
        {isRecovered && (
          <circle
            cx={x2}
            cy={y2}
            r={24}
            stroke="#10b981"
            strokeWidth={1}
            fill="none"
            opacity="0.6"
            className="animate-ping"
          />
        )}
      </svg>

      {/* HTML Floating Badges & Computer Vision Telemetry */}
      {/* Expected Label */}
      <div
        className="absolute font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40 transform -translate-x-1/2 -translate-y-8"
        style={{ left: `${x1}px`, top: `${y1}px` }}
      >
        EXPECTED ANCHOR [ORIGIN]
      </div>

      {/* Actual Target Label */}
      <div
        className={`absolute font-mono text-[9px] font-bold px-2 py-0.5 rounded border transform -translate-x-1/2 translate-y-6 ${
          isRecovered
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
            : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/60 animate-pulse'
        }`}
        style={{ left: `${x2}px`, top: `${y2}px` }}
      >
        {isRecovered ? 'TARGET RE-LOCKED (100%)' : `DISPLACED TARGET (${relocalizationProgress}%)`}
      </div>

      {/* Vector Math Telemetry Callout */}
      <div
        className="absolute font-mono text-[9px] px-2 py-1 rounded bg-slate-900/90 backdrop-blur border border-cyan-500/30 text-slate-200 transform -translate-x-1/2 -translate-y-12 shadow-xl flex items-center space-x-2"
        style={{ left: `${midX}px`, top: `${midY}px` }}
      >
        <span className="text-cyan-400 font-semibold">ΔX: +{DRIFT_OFFSETS.dx}px</span>
        <span className="text-slate-500">|</span>
        <span className="text-cyan-400 font-semibold">ΔY: +{DRIFT_OFFSETS.dy}px</span>
        <span className="text-slate-500">|</span>
        <span className="text-amber-400">L2: {DRIFT_OFFSETS.distance}px</span>
        <span className="text-slate-500">|</span>
        <span className="text-emerald-400">CV: 99.8%</span>
      </div>
    </div>
  );
};
