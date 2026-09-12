import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { AegisCore } from './AegisCore';
import { AgentWindow } from './AgentWindow';
import { MetricStack } from './MetricStack';
import { AlertsPanel } from './AlertsPanel';

export const SpatialCanvas: React.FC = () => {
  const {
    zoom,
    setZoom,
    pan,
    setPan,
    activeTool,
    agents,
    expandedAgentId,
    setSelectedAgent,
  } = useAppStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [, setTick] = useState(0);

  // Key listeners for Spacebar panning mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse wheel zoom (CTRL/CMD + Wheel)
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        setZoom((prev) => Math.min(2.0, Math.max(0.5, prev + delta)));
      }
    };

    canvasEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvasEl.removeEventListener('wheel', handleWheel);
  }, [setZoom]);

  // Canvas Pan Handler
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const isMiddleClick = e.button === 1;
    const isPanMode = activeTool === 'pan' || isSpacePressed || isMiddleClick;
    const isBackgroundClick =
      e.target === canvasRef.current ||
      (e.target as HTMLElement).classList.contains('grid-bg') ||
      (e.target as HTMLElement).classList.contains('spatial-plane');

    if (!isPanMode && !isBackgroundClick) {
      return;
    }

    if (isBackgroundClick) {
      setSelectedAgent(null);
    }

    setIsDraggingCanvas(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const initialPan = { ...pan };

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setPan({
        x: Math.round(initialPan.x + dx),
        y: Math.round(initialPan.y + dy),
      });
    };

    const onPointerUp = () => {
      setIsDraggingCanvas(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Draw dynamic SVG connection links based purely on agent relationships
  const drawLinks = useCallback(() => {
    const svg = svgRef.current;
    const plane = planeRef.current;
    if (!svg || !plane) return;

    // Clear existing paths (preserve defs)
    const existingPaths = svg.querySelectorAll('path');
    existingPaths.forEach((p) => p.remove());

    const core = plane.querySelector('.core-orb');
    if (!core) return;

    const planeRect = plane.getBoundingClientRect();
    const coreRect = core.getBoundingClientRect();

    // Coordinates in plane space
    const coreCenter = {
      x: (coreRect.left + coreRect.width / 2 - planeRect.left) / zoom,
      y: (coreRect.top + coreRect.height / 2 - planeRect.top) / zoom,
    };

    const getPlanePos = (el: Element) => {
      const r = el.getBoundingClientRect();
      return {
        x: (r.left + r.width / 2 - planeRect.left) / zoom,
        y: (r.top + r.height / 2 - planeRect.top) / zoom,
        left: (r.left - planeRect.left) / zoom,
        right: (r.right - planeRect.left) / zoom,
        top: (r.top - planeRect.top) / zoom,
        bottom: (r.bottom - planeRect.top) / zoom,
      };
    };

    let delayIndex = 0;

    // 1. Metric Stack Cards -> AEGIS Core (System Telemetry inputs)
    const metricCards = plane.querySelectorAll('#metricStack [data-node]');
    metricCards.forEach((card) => {
      const p = getPlanePos(card);
      const startX = p.right;
      const startY = p.y;
      const midX = (startX + coreCenter.x) / 2;
      const d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${coreCenter.y}, ${coreCenter.x} ${coreCenter.y}`;

      const base = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      base.setAttribute('d', d);
      base.classList.add('base');
      svg.appendChild(base);

      const flow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      flow.setAttribute('d', d);
      flow.classList.add('flow', 'flow-cyan');
      flow.style.animationDelay = `${delayIndex * 0.2}s`;
      svg.appendChild(flow);
      delayIndex++;
    });

    // 2. Data-Driven Dynamic Agent Relationships
    // (NO external fake services like Stripe/CRM remain in graph)
    agents.forEach((agent) => {
      const agentEl = plane.querySelector(`#agent-window-${agent.id}`);
      if (!agentEl) return;

      const p = getPlanePos(agentEl);
      const targetX = p.x < coreCenter.x ? p.right : p.left;
      const targetY = p.y;

      // Color coding based on actual agent status
      let colorClass = 'flow-cyan';
      if (agent.status === 'THINKING' || agent.status === 'LEARNING') {
        colorClass = 'flow-violet';
      } else if (agent.status === 'WAITING' || agent.status === 'PAUSED') {
        colorClass = 'flow-gold';
      } else if (agent.status === 'ERROR') {
        colorClass = 'flow-danger';
      }

      // Link: Agent <-> Central AEGIS Core (if relationship exists)
      const connectsToCore = !agent.relationships || agent.relationships.includes('aegis-core');
      if (connectsToCore) {
        const midX = (coreCenter.x + targetX) / 2;
        const midY = (coreCenter.y + targetY) / 2;
        const d = `M ${coreCenter.x} ${coreCenter.y} Q ${midX} ${midY}, ${targetX} ${targetY}`;

        const base = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        base.setAttribute('d', d);
        base.classList.add('base');
        svg.appendChild(base);

        const flow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        flow.setAttribute('d', d);
        flow.classList.add('flow', colorClass);
        flow.style.animationDelay = `${(delayIndex * 0.25) % 2}s`;
        svg.appendChild(flow);
        delayIndex++;
      }

      // Link: Peer-to-Peer Inter-Agent Relationships (if specified in agent data)
      if (agent.relationships) {
        agent.relationships.forEach((relId) => {
          if (relId === 'aegis-core') return;
          const peerEl = plane.querySelector(`#agent-window-${relId}`);
          if (!peerEl) return;

          const peerP = getPlanePos(peerEl);
          const peerX = peerP.x < p.x ? peerP.right : peerP.left;
          const selfX = p.x < peerP.x ? p.right : p.left;

          const d = `M ${selfX} ${p.y} C ${(selfX + peerX) / 2} ${p.y}, ${(selfX + peerX) / 2} ${peerP.y}, ${peerX} ${peerP.y}`;

          const base = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          base.setAttribute('d', d);
          base.classList.add('base');
          svg.appendChild(base);

          const flow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          flow.setAttribute('d', d);
          flow.classList.add('flow', 'flow-violet');
          flow.style.animationDelay = `${(delayIndex * 0.3) % 2}s`;
          svg.appendChild(flow);
          delayIndex++;
        });
      }
    });
  }, [agents, zoom]);

  // Update links on change
  useEffect(() => {
    const handle = requestAnimationFrame(drawLinks);
    return () => cancelAnimationFrame(handle);
  }, [drawLinks, agents, zoom, pan, expandedAgentId]);

  useEffect(() => {
    const onResize = () => {
      setTick((t) => t + 1);
      drawLinks();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [drawLinks]);

  const isPanningCursor = isDraggingCanvas || isSpacePressed || activeTool === 'pan';

  return (
    <main
      ref={canvasRef}
      className={`canvas ${isPanningCursor ? 'panning' : ''}`}
      onPointerDown={handlePointerDown}
    >
      {/* 42px Spatial Grid Background */}
      <div className="grid-bg" />

      {/* Radial Teal Center Glow Blob */}
      <div className="glow-blob" />

      {/* Spatial Transformed Plane */}
      <div
        ref={planeRef}
        className="spatial-plane"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* Dynamic SVG Connection Links Layer */}
        <svg ref={svgRef} className="links" id="links">
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#37e8c4" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#37e8c4" stopOpacity="0.55" />
            </linearGradient>
          </defs>
        </svg>

        {/* Left Metric Stack */}
        <MetricStack />

        {/* Central AEGIS Intelligence Core */}
        <AegisCore />

        {/* Dynamic Multi-Agent Windows (Compact by default, Expandable on click) */}
        {agents.map((agent) => (
          <AgentWindow key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Fixed UI Overlay: Guardrail Alerts Panel (Bottom Left) */}
      <AlertsPanel />

      {/* Fixed UI Overlay: Live Status Badge (Bottom Right) */}
      <div className="footer-tag">
        <span className="live-dot" />
        Live &bull; AEGIS Intelligence Operating
      </div>
    </main>
  );
};
