import React, { useEffect, useRef, useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { DRIFT_OFFSETS } from '../../state/demoState';

export const VirtualCursor = ({ erpCoordinates, containerBounds }) => {
  const {
    currentPhaseIndex,
    activeFocusedField,
    isDriftActive,
    relocalizationProgress,
    buttonState,
    injectViolation,
  } = useDemo();

  // Cursor position state (current interpolated position)
  const [pos, setPos] = useState({ x: 120, y: 120 });
  const [cursorState, setCursorState] = useState('idle'); // idle, moving, hovering, typing, clicking, blocked
  const [clickEffect, setClickEffect] = useState(false);

  // Target and physics tracking
  const currentPosRef = useRef({ x: 120, y: 120 });
  const targetPosRef = useRef({ x: 120, y: 120 });
  const animRef = useRef(null);

  // Calculate target position based on current demo phase
  useEffect(() => {
    if (!erpCoordinates) return;

    let target = { x: 160, y: 160 };
    let state = 'idle';

    // Phase 1: STANDBY
    if (currentPhaseIndex === 0) {
      target = { x: 80, y: 80 };
      state = 'idle';
    }
    // Phase 2: MEMORY_ACTIVATION
    else if (currentPhaseIndex === 1) {
      target = { x: 200, y: 140 };
      state = 'waiting';
    }
    // Phase 3: AGENT_VENDOR
    else if (currentPhaseIndex === 2) {
      if (erpCoordinates.vendor) {
        target = { x: erpCoordinates.vendor.x, y: erpCoordinates.vendor.y };
      }
      state = activeFocusedField === 'vendor' ? 'typing' : 'moving';
    }
    // Phase 4: AGENT_AMOUNT
    else if (currentPhaseIndex === 3) {
      if (erpCoordinates.amount) {
        target = { x: erpCoordinates.amount.x, y: erpCoordinates.amount.y };
      }
      state = activeFocusedField === 'amount' ? 'typing' : 'moving';
    }
    // Phase 5: DRIFT_DETECTED
    else if (currentPhaseIndex === 4) {
      // Moves towards original expected position then stops in alert
      if (erpCoordinates.submitOriginal) {
        target = { x: erpCoordinates.submitOriginal.x, y: erpCoordinates.submitOriginal.y };
      }
      state = 'scanning';
    }
    // Phase 6: RELOCALIZATION
    else if (currentPhaseIndex === 5) {
      // Re-routes smoothly towards the drifted position
      if (erpCoordinates.submitOriginal) {
        const factor = (relocalizationProgress || 0) / 100;
        target = {
          x: erpCoordinates.submitOriginal.x + DRIFT_OFFSETS.dx * factor,
          y: erpCoordinates.submitOriginal.y + DRIFT_OFFSETS.dy * factor,
        };
      }
      state = 'relocalizing';
    }
    // Phase 7: GUARDRAIL_CHECK
    else if (currentPhaseIndex === 6) {
      if (erpCoordinates.submitOriginal) {
        target = {
          x: erpCoordinates.submitOriginal.x + (isDriftActive ? DRIFT_OFFSETS.dx : 0),
          y: erpCoordinates.submitOriginal.y + (isDriftActive ? DRIFT_OFFSETS.dy : 0),
        };
      }
      state = injectViolation ? 'blocked' : 'waiting';
    }
    // Phase 8: EXECUTION
    else if (currentPhaseIndex === 7) {
      if (erpCoordinates.submitOriginal) {
        target = {
          x: erpCoordinates.submitOriginal.x + (isDriftActive ? DRIFT_OFFSETS.dx : 0),
          y: erpCoordinates.submitOriginal.y + (isDriftActive ? DRIFT_OFFSETS.dy : 0),
        };
      }
      state = injectViolation ? 'blocked' : 'clicking';
      if (!injectViolation && buttonState === 'SUBMITTED') {
        setClickEffect(true);
        setTimeout(() => setClickEffect(false), 600);
      }
    }
    // Phase 9: COMPLETE
    else if (currentPhaseIndex === 8) {
      target = { x: 340, y: 220 };
      state = 'success';
    }

    targetPosRef.current = target;
    setCursorState(state);
  }, [currentPhaseIndex, activeFocusedField, erpCoordinates, isDriftActive, relocalizationProgress, buttonState, injectViolation]);

  // Cubic-bezier / spring interpolation loop for natural humanized trajectory
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (currentTime) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const curr = currentPosRef.current;
      const target = targetPosRef.current;

      // Distance
      const dx = target.x - curr.x;
      const dy = target.y - curr.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Natural ease-out smoothing
      const easeSpeed = dist > 150 ? 5.5 : 4.2;
      curr.x += dx * easeSpeed * dt;
      curr.y += dy * easeSpeed * dt;

      setPos({ x: curr.x, y: curr.y });

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const getStatusBadge = () => {
    switch (cursorState) {
      case 'typing': return { text: 'KEYSTROKE_STREAM', color: 'text-amber-400 border-amber-500/40 bg-amber-950/80' };
      case 'clicking': return { text: 'ACTUATE_CLICK', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/80' };
      case 'scanning': return { text: 'CV_SCAN_DISPLACEMENT', color: 'text-rose-400 border-rose-500/40 bg-rose-950/80' };
      case 'relocalizing': return { text: 'RELOCALIZING_VECTOR', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/80' };
      case 'blocked': return { text: 'GUARDRAIL_HALT', color: 'text-rose-400 border-rose-500/40 bg-rose-950/80' };
      case 'success': return { text: 'TARGET_COMMITTED', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/80' };
      default: return { text: 'AUTONOMOUS_NAV', color: 'text-cyan-300 border-cyan-500/30 bg-slate-900/80' };
    }
  };

  const badge = getStatusBadge();

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none z-50 transition-transform duration-75"
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
      }}
    >
      {/* Dynamic Click Ripple */}
      {clickEffect && (
        <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full border-2 border-emerald-400 animate-ping opacity-80 pointer-events-none"></div>
      )}

      {/* Autonomous Sci-Fi Cursor Reticle */}
      <div className="relative">
        <svg width="32" height="32" viewBox="0 0 32 32" className="overflow-visible drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
          {/* Outer Crosshair Ring */}
          <circle cx="16" cy="16" r="10" stroke="rgba(0,240,255,0.5)" strokeWidth="1" strokeDasharray="3 3" fill="none" className="animate-spin" style={{ animationDuration: '6s' }} />
          
          {/* Target Center Pip */}
          <circle cx="16" cy="16" r="3" fill="#00f0ff" />

          {/* Futuristic Pointer Triangle */}
          <polygon
            points="0,0 20,7 13,13 7,20"
            fill="#050811"
            stroke="#00f0ff"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Inner Accent Line */}
          <line x1="2" y1="2" x2="11" y2="11" stroke="#38bdf8" strokeWidth="1.5" />
        </svg>

        {/* Telemetry Status Pill attached to cursor */}
        <div
          className={`absolute left-6 top-5 px-1.5 py-0.5 rounded font-mono text-[8px] font-bold tracking-wider uppercase border whitespace-nowrap shadow-lg backdrop-blur flex items-center space-x-1 ${badge.color}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
          <span>{badge.text}</span>
        </div>
      </div>
    </div>
  );
};
