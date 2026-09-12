import React, { useRef, useEffect } from 'react';
import { useDemo } from '../../context/DemoContext';

export const MemoryGraph = () => {
  const canvasRef = useRef(null);
  const { currentPhaseIndex, isDriftActive, relocalizationProgress, guardrailResults } = useDemo();

  // Keep state in refs so the requestAnimationFrame loop is decoupled from React renders
  const animStateRef = useRef({
    phase: currentPhaseIndex,
    drift: isDriftActive,
    reloProgress: relocalizationProgress,
    guardrail: guardrailResults,
    time: 0,
    particles: [],
  });

  useEffect(() => {
    animStateRef.current.phase = currentPhaseIndex;
    animStateRef.current.drift = isDriftActive;
    animStateRef.current.reloProgress = relocalizationProgress;
    animStateRef.current.guardrail = guardrailResults;
  }, [currentPhaseIndex, isDriftActive, relocalizationProgress, guardrailResults]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Node topology
    // Positions are normalized (0 to 1) and will scale dynamically to canvas width & height
    const graphNodes = [
      { id: 'root', label: 'PURCHASE ENTRY CONTEXT', type: 'context', x: 0.5, y: 0.18, r: 18, baseColor: '#38bdf8' },
      { id: 'vendor', label: 'LANDMARK: VENDOR', type: 'landmark', x: 0.22, y: 0.48, r: 16, baseColor: '#00f0ff' },
      { id: 'amount', label: 'LANDMARK: AMOUNT', type: 'landmark', x: 0.50, y: 0.56, r: 16, baseColor: '#00f0ff' },
      { id: 'submit', label: 'LANDMARK: SUBMIT [F9]', type: 'landmark', x: 0.78, y: 0.50, r: 16, baseColor: '#00f0ff' },
      { id: 'db', label: 'ERP LEDGER SCHEMA', type: 'context', x: 0.16, y: 0.82, r: 13, baseColor: '#818cf8' },
      { id: 'guardrail', label: 'BOUNDARY HARNESS', type: 'guardrail', x: 0.50, y: 0.86, r: 15, baseColor: '#f59e0b' },
      { id: 'token', label: 'EXECUTION TOKEN', type: 'state', x: 0.84, y: 0.82, r: 13, baseColor: '#10b981' },
    ];

    const graphEdges = [
      { from: 'root', to: 'vendor', weight: 1 },
      { from: 'root', to: 'amount', weight: 1 },
      { from: 'root', to: 'submit', weight: 1 },
      { from: 'vendor', to: 'db', weight: 0.8 },
      { from: 'amount', to: 'guardrail', weight: 1 },
      { from: 'submit', to: 'guardrail', weight: 1 },
      { from: 'guardrail', to: 'token', weight: 1 },
      { from: 'vendor', to: 'amount', weight: 0.6 },
    ];

    // Initialize photon particles
    const particles = [];
    for (let i = 0; i < 38; i++) {
      const edge = graphEdges[Math.floor(Math.random() * graphEdges.length)];
      particles.push({
        edge,
        t: Math.random(),
        speed: 0.003 + Math.random() * 0.005,
        size: 1.5 + Math.random() * 2,
        color: '#00f0ff',
      });
    }
    animStateRef.current.particles = particles;

    // Handle high DPI
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);

    // Animation Render Loop
    const render = () => {
      animStateRef.current.time += 0.02;
      const t = animStateRef.current.time;
      const currentPhase = animStateRef.current.phase;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Node coordinate map with gentle organic idle floating
      const nodePos = {};
      graphNodes.forEach((node, i) => {
        // Dynamic organic breathing
        const floatX = Math.sin(t * 1.2 + i * 1.5) * 4;
        const floatY = Math.cos(t * 1.4 + i * 1.2) * 4;

        // Drift displacement during drift phase on submit node
        let driftX = 0;
        let driftY = 0;
        if (node.id === 'submit' && animStateRef.current.drift) {
          // If relocalizing, it smooths toward recovered anchor
          const recoFactor = (animStateRef.current.reloProgress || 0) / 100;
          driftX = (1 - recoFactor * 0.6) * 24;
          driftY = (1 - recoFactor * 0.6) * 16;
        }

        nodePos[node.id] = {
          x: node.x * w + floatX + driftX,
          y: node.y * h + floatY + driftY,
          r: node.r,
          label: node.label,
          type: node.type,
          baseColor: node.baseColor,
        };
      });

      // 1. Draw Edges
      graphEdges.forEach((edge) => {
        const p1 = nodePos[edge.from];
        const p2 = nodePos[edge.to];
        if (!p1 || !p2) return;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        // Edge styling based on active phase
        let edgeColor = 'rgba(56, 189, 248, 0.12)';
        let lineWidth = 1;

        if (currentPhase >= 1) {
          edgeColor = 'rgba(56, 189, 248, 0.22)';
        }

        if (currentPhase === 2 && (edge.from === 'vendor' || edge.to === 'vendor')) {
          edgeColor = 'rgba(0, 240, 255, 0.6)';
          lineWidth = 2;
        } else if (currentPhase === 3 && (edge.from === 'amount' || edge.to === 'amount')) {
          edgeColor = 'rgba(0, 240, 255, 0.6)';
          lineWidth = 2;
        } else if ((currentPhase === 4 || currentPhase === 5) && (edge.from === 'submit' || edge.to === 'submit')) {
          edgeColor = animStateRef.current.drift ? 'rgba(244, 63, 94, 0.6)' : 'rgba(16, 185, 129, 0.6)';
          lineWidth = 2;
        } else if (currentPhase === 6 && (edge.from === 'guardrail' || edge.to === 'guardrail')) {
          edgeColor = 'rgba(245, 158, 11, 0.7)';
          lineWidth = 2;
        }

        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      });

      // 2. Draw Traveling Photon Particles
      const particles = animStateRef.current.particles;
      particles.forEach((p) => {
        p.t += p.speed;
        if (p.t > 1) p.t = 0;

        const p1 = nodePos[p.edge.from];
        const p2 = nodePos[p.edge.to];
        if (!p1 || !p2) return;

        const px = p1.x + (p2.x - p1.x) * p.t;
        const py = p1.y + (p2.y - p1.y) * p.t;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = currentPhase >= 1 ? 'rgba(0, 240, 255, 0.85)' : 'rgba(56, 189, 248, 0.4)';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      // 3. Draw Nodes with Glow and State
      Object.keys(nodePos).forEach((key) => {
        const node = nodePos[key];
        let color = node.baseColor;
        let isFocused = false;
        let isDriftNode = false;

        // Phase-specific node state colors
        if (key === 'vendor' && currentPhase === 2) {
          isFocused = true;
          color = '#38bdf8';
        } else if (key === 'amount' && currentPhase === 3) {
          isFocused = true;
          color = '#38bdf8';
        } else if (key === 'submit') {
          if (animStateRef.current.drift) {
            isDriftNode = true;
            color = animStateRef.current.reloProgress >= 100 ? '#10b981' : '#f43f5e';
          } else if (currentPhase === 7) {
            color = '#10b981';
            isFocused = true;
          }
        } else if (key === 'guardrail' && currentPhase === 6) {
          isFocused = true;
          color = animStateRef.current.guardrail.overall === 'BLOCKED' ? '#ef4444' : '#10b981';
        } else if (key === 'token' && currentPhase >= 7) {
          color = '#10b981';
        }

        // Outer pulsing ring for active nodes
        if (isFocused || isDriftNode || currentPhase >= 1) {
          const pulseR = node.r + 6 + Math.sin(t * 4) * 4;
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = isDriftNode ? 'rgba(244, 63, 94, 0.4)' : `${color}44`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Inner Core Glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = '#0b1329';
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = isFocused ? 3 : 1.8;
        ctx.shadowColor = color;
        ctx.shadowBlur = isFocused || isDriftNode ? 16 : 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Center dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Node Label
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = isFocused ? '#ffffff' : 'rgba(226, 232, 240, 0.75)';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.r + 14);

        // Extra status pill
        if (isDriftNode) {
          const statusText = animStateRef.current.reloProgress >= 100 ? '[ RELOCALIZED ]' : '[ DRIFT ALERT ]';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.fillStyle = animStateRef.current.reloProgress >= 100 ? '#10b981' : '#f43f5e';
          ctx.fillText(statusText, node.x, node.y - node.r - 6);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="px-4 py-2 border-b border-cyan-500/20 bg-slate-950/60 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="text-xs font-mono font-semibold tracking-wider text-cyan-400 uppercase">
            Spatial Memory Graph (HTML5 2D Canvas)
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 flex items-center space-x-3">
          <span>NODES: 7</span>
          <span className="text-slate-600">|</span>
          <span>EDGES: 8</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400">FPS: 60</span>
        </div>
      </div>

      {/* Canvas container */}
      <div className="flex-1 w-full h-full relative">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
};
