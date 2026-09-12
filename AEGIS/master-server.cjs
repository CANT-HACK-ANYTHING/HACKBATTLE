// ============================================================================
// AEGIS OS — Localhost Master Gateway & Multi-App Hub
// Runs unified portal on Port 3000 and mounts all applications and APIs
// ============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function serveStatic(baseDir, req, res, fallbackFile = 'index.html') {
  const parsed = url.parse(req.url);
  let pathname = decodeURIComponent(parsed.pathname);
  if (pathname === '/' || pathname === '') {
    pathname = '/' + fallbackFile;
  }

  let filePath = path.join(baseDir, pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA Fallback to index.html if request accepts HTML
      const fallbackPath = path.join(baseDir, fallbackFile);
      fs.readFile(fallbackPath, (fbErr, content) => {
        if (fbErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      });
      res.end(content);
    });
  });
}

// ----------------------------------------------------------------------------
// 1. Mock API Microservice Router (Handles /api/* on 8000 and 3000)
// ----------------------------------------------------------------------------
const mockAgents = [
  {
    id: 'agent-learn-01',
    name: 'Learning Agent',
    type: 'learning',
    status: 'LEARNING',
    task: 'Ingesting dynamic API schemas and fine-tuning heuristic embeddings',
    goal: 'Ingesting dynamic API schemas and fine-tuning heuristic embeddings',
    progress: 74,
    currentAction: 'Indexing 48 semantic tool signatures into vector space...',
    icon: '📚',
    permissionLevel: 'autonomous',
    automationLevel: 'full_auto',
    position: { x: -380, y: -190 },
    size: { w: 380, h: 360 },
    memory: {
      status: 'CONNECTED',
      shortTerm: 'Active schema parser (v2.4)',
      longTerm: '14,280 vector embeddings',
      vectorTokens: 384000,
      activeContexts: 4,
    },
    guardrails: {
      status: 'ACTIVE',
      active: true,
      rules: ['Sandboxed model evaluation', 'Verify JSON schema validation'],
      blockedActions: ['External network egress', 'Direct database write'],
    },
    inputs: [
      { id: 'in-1', label: 'Schema Manifest', type: 'JSON', source: 'OpenAPI Spec v3' },
      { id: 'in-2', label: 'Telemetry Stream', type: 'gRPC', source: 'Kernel Telemetry' },
    ],
    outputs: [
      { id: 'out-1', label: 'Vector Index', type: 'HNSW', destination: 'Memory Agent' },
      { id: 'out-2', label: 'Heuristic Rules', type: 'Policy', destination: 'Security Agent' },
    ],
    activity: [
      { id: 'act-1', type: 'action', title: 'Synthesized 12 new function definitions', timestamp: '2m ago' },
      { id: 'act-2', type: 'memory', title: 'Updated long-term vector cluster #4', timestamp: '5m ago' },
    ],
    tools: ['Schema Parser', 'Vector DB', 'Semantic Reasoner'],
  },
  {
    id: 'agent-sec-02',
    name: 'Security Agent',
    type: 'security',
    status: 'ACTIVE',
    task: 'Continuous boundary enforcement and unauthorized token revocation',
    goal: 'Continuous boundary enforcement and unauthorized token revocation',
    progress: 92,
    currentAction: 'Monitoring OAuth token usage and inspecting runtime egress...',
    icon: '🔐',
    permissionLevel: 'approval_required',
    automationLevel: 'supervised',
    position: { x: 380, y: -190 },
    size: { w: 380, h: 360 },
    memory: {
      status: 'CONNECTED',
      shortTerm: 'Threat anomaly buffer',
      longTerm: 'Zero-trust policy ledger',
      vectorTokens: 112000,
      activeContexts: 8,
    },
    guardrails: {
      status: 'ACTIVE',
      active: true,
      rules: ['Strict 2FA on financial operations', 'Zero data-loss egress filter', 'Rate limit: 60 req/min'],
      blockedActions: ['Raw credential export', 'Unsigned binary execution'],
    },
    inputs: [
      { id: 'in-sec-1', label: 'Audit Trail', type: 'Stream', source: 'Kernel Audit Log' },
      { id: 'in-sec-2', label: 'Policy Feed', type: 'Rules', source: 'Learning Agent' },
    ],
    outputs: [
      { id: 'out-sec-1', label: 'Revocation Signals', type: 'Signal', destination: 'IAM Controller' },
    ],
    activity: [
      { id: 'act-sec-1', type: 'guardrail', title: 'Verified 24 agent actions against safety ceiling', timestamp: '1m ago' },
    ],
    tools: ['IAM Validator', 'Sandbox Scanner', 'Audit Logger'],
  },
  {
    id: 'agent-res-03',
    name: 'Research Agent',
    type: 'research',
    status: 'EXECUTING',
    task: 'Gathering multi-source market intelligence and cross-referencing benchmarks',
    goal: 'Gathering multi-source market intelligence and cross-referencing benchmarks',
    progress: 61,
    currentAction: 'Synthesizing benchmark telemetry across 14 distributed clusters...',
    icon: '🔬',
    permissionLevel: 'autonomous',
    automationLevel: 'full_auto',
    position: { x: -380, y: 190 },
    size: { w: 380, h: 360 },
    memory: {
      status: 'SYNCING',
      shortTerm: 'Crawler page cache',
      longTerm: 'Synthesized domain dossiers',
      vectorTokens: 520000,
      activeContexts: 12,
    },
    guardrails: {
      status: 'ACTIVE',
      active: true,
      rules: ['Adhere to robots.txt & rate limits', 'No proprietary data extraction'],
      blockedActions: ['Form POST automation without approval'],
    },
    inputs: [
      { id: 'in-res-1', label: 'Target Queries', type: 'Query[]', source: 'Planning Agent' },
    ],
    outputs: [
      { id: 'out-res-1', label: 'Synthesized Brief', type: 'Markdown', destination: 'Memory Agent' },
      { id: 'out-res-2', label: 'Raw Data Matrix', type: 'CSV/Table', destination: 'Learning Agent' },
    ],
    activity: [
      { id: 'act-res-1', type: 'action', title: 'Parsed 18 documentation pages & extracted API specs', timestamp: '3m ago' },
    ],
    tools: ['Web Scraper', 'Doc Parser', 'Entity Extractor'],
  },
  {
    id: 'agent-mem-04',
    name: 'Memory Agent',
    type: 'memory',
    status: 'IDLE',
    task: 'Maintaining associative knowledge graph and hierarchical contextual indexes',
    goal: 'Maintaining associative knowledge graph and hierarchical contextual indexes',
    progress: 100,
    currentAction: 'Standing by for contextual associative retrieval queries...',
    icon: '🧠',
    permissionLevel: 'autonomous',
    automationLevel: 'full_auto',
    position: { x: 380, y: 190 },
    size: { w: 380, h: 360 },
    memory: {
      status: 'CONNECTED',
      shortTerm: 'LRU Ephemeral Cache (4GB)',
      longTerm: 'Persistent Vector Lake',
      vectorTokens: 1420000,
      activeContexts: 2,
    },
    guardrails: {
      status: 'ACTIVE',
      active: true,
      rules: ['Encrypted at rest (AES-256-GCM)', 'Strict tenant partition boundary'],
      blockedActions: ['Unencrypted memory dump'],
    },
    inputs: [
      { id: 'in-mem-1', label: 'Incoming Embeddings', type: 'HNSW', source: 'Learning Agent' },
      { id: 'in-mem-2', label: 'Research Dossiers', type: 'Markdown', source: 'Research Agent' },
    ],
    outputs: [
      { id: 'out-mem-1', label: 'Context Hydration', type: 'Context', destination: 'Planning Agent' },
    ],
    activity: [
      { id: 'act-mem-1', type: 'memory', title: 'Garbage collected stale ephemeral tokens (240MB freed)', timestamp: '12m ago' },
    ],
    tools: ['Vector DB', 'Graph Store', 'Semantic Indexer'],
  },
  {
    id: 'agent-plan-05',
    name: 'Planning Agent',
    type: 'planning',
    status: 'THINKING',
    task: 'Decomposing complex objectives into coordinated multi-agent subtasks',
    goal: 'Decomposing complex objectives into coordinated multi-agent subtasks',
    progress: 48,
    currentAction: 'Calculating optimal task dependency graph and critical path...',
    icon: '🗺️',
    permissionLevel: 'approval_required',
    automationLevel: 'supervised',
    position: { x: 0, y: -260 },
    size: { w: 380, h: 360 },
    memory: {
      status: 'CONNECTED',
      shortTerm: 'DAG State Matrix',
      longTerm: 'Historical Plan Success Library',
      vectorTokens: 89000,
      activeContexts: 6,
    },
    guardrails: {
      status: 'ACTIVE',
      active: true,
      rules: ['Verify task precondition assertions', 'Human sign-off on branch re-planning'],
      blockedActions: ['Unbounded recursive task generation'],
    },
    inputs: [
      { id: 'in-plan-1', label: 'High-Level Directive', type: 'Goal', source: 'AEGIS Core' },
      { id: 'in-plan-2', label: 'Knowledge Context', type: 'Context', source: 'Memory Agent' },
    ],
    outputs: [
      { id: 'out-plan-1', label: 'Dispatched Subtasks', type: 'Task[]', destination: 'All Agents' },
    ],
    activity: [
      { id: 'act-plan-1', type: 'action', title: 'Constructed 5-stage execution pipeline', timestamp: '4m ago' },
    ],
    tools: ['DAG Planner', 'Resource Allocator', 'Dependency Resolver'],
  },
];

function handleApiRequest(req, res) {
  const parsed = url.parse(req.url, true);
  const p = parsed.pathname;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /api/agents
  if (p === '/api/agents' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(mockAgents));
    return;
  }

  // POST /api/agents
  if (p === '/api/agents' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const newAgent = {
          id: `agent-${data.type || 'custom'}-${Date.now().toString(36)}`,
          name: data.name || 'Custom Agent',
          type: data.type || 'assistant',
          status: 'ACTIVE',
          goal: data.goal || 'Custom goal',
          progress: 10,
          currentAction: 'Initialized autonomous runtime',
          permissionLevel: data.permissionLevel || 'approval_required',
          automationLevel: data.automationLevel || 'supervised',
          memoryConnected: true,
          guardrailsEnabled: true,
        };
        mockAgents.unshift(newAgent);
        res.writeHead(201);
        res.end(JSON.stringify(newAgent));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // GET /api/tasks
  if (p === '/api/tasks') {
    res.writeHead(200);
    res.end(
      JSON.stringify([
        { id: 'task-1', title: 'Compare Bose QC Ultra deals', progress: 72, status: 'in_progress' },
        { id: 'task-2', title: 'Scan executive inbox for threats', progress: 88, status: 'in_progress' },
      ])
    );
    return;
  }

  // GET /api/guardrails
  if (p === '/api/guardrails') {
    res.writeHead(200);
    res.end(
      JSON.stringify([
        { id: 'gr-01', name: 'Spending Ceiling', rule: 'Max INR 5,000 without 2FA', decision: 'approval_required' },
        { id: 'gr-02', name: 'Zero Egress DLP', rule: 'Block outbound database dumps', decision: 'blocked' },
      ])
    );
    return;
  }

  // POST /api/shopping/search
  if (p.startsWith('/api/shopping/search')) {
    res.writeHead(200);
    res.end(
      JSON.stringify([
        { sku: 'BOSE-QCU-BLK', name: 'Bose QuietComfort Ultra (Black)', price: 9499, retailer: 'Tata Cliq' },
        { sku: 'BOSE-QCU-WHT', name: 'Bose QuietComfort Ultra (White)', price: 10299, retailer: 'Amazon India' },
        { sku: 'SONY-WH1000XM5', name: 'Sony WH-1000XM5 ANC', price: 9990, retailer: 'Croma' },
      ])
    );
    return;
  }

  // Default fallback
  res.writeHead(200);
  res.end(
    JSON.stringify({
      message: 'AEGIS Autonomous OS API Gateway Live',
      endpoint: p,
      status: 'active',
      timestamp: new Date().toISOString(),
    })
  );
}

// ----------------------------------------------------------------------------
// 2. Ports Configuration
// ----------------------------------------------------------------------------
const PATHS = {
  aegisReact: path.join(__dirname, 'dist'),
  aegisStandalone: __dirname,
  spatialErp: path.join(__dirname, 'dist'),
  knowledgeGraph: path.join(__dirname, 'dist'),
};

// PORT 3001: AEGIS Multi-Agent OS (React 19 + TypeScript)
http.createServer((req, res) => serveStatic(PATHS.aegisReact, req, res)).listen(3001, () => {
  console.log('⚡ [Port 3001] AEGIS React OS: http://localhost:3001');
});

// PORT 3002: AEGIS Standalone Console (Zero-Dependency HTML)
http.createServer((req, res) => serveStatic(PATHS.aegisStandalone, req, res, 'aegis-console.html')).listen(3002, () => {
  console.log('⚡ [Port 3002] AEGIS Standalone Console: http://localhost:3002');
});

// PORT 3003: Kinematic Spatial OS & Legacy ERP
http.createServer((req, res) => serveStatic(PATHS.spatialErp, req, res)).listen(3003, () => {
  console.log('⚡ [Port 3003] Kinematic Spatial OS & ERP: http://localhost:3003');
});

// PORT 3004: Knowledge Graph & Memory Explorer
http.createServer((req, res) => serveStatic(PATHS.knowledgeGraph, req, res)).listen(3004, () => {
  console.log('⚡ [Port 3004] Knowledge Graph & Memory Explorer: http://localhost:3004');
});

// PORT 8000: Mock API Microservices Gateway
http.createServer(handleApiRequest).listen(8000, () => {
  console.log('⚡ [Port 8000] AEGIS API Microservices Gateway: http://localhost:8000/api/agents');
});

// ----------------------------------------------------------------------------
// 3. PORT 3000: Master Command Center & Unified Hub
// ----------------------------------------------------------------------------
const HUB_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AEGIS — Master Localhost Command Center</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #05080b;
    --panel: rgba(14, 21, 31, 0.9);
    --panel-border: rgba(255, 255, 255, 0.1);
    --teal: #37e8c4;
    --gold: #eab35a;
    --violet: #8b93ff;
    --text: #e9eef2;
    --muted: #7c8794;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .hub-bar {
    height: 52px;
    background: rgba(8, 13, 20, 0.95);
    border-bottom: 1px solid var(--panel-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    z-index: 100;
  }
  .hub-brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .hub-mark {
    width: 26px; height: 26px;
    border-radius: 7px;
    background: conic-gradient(from 210deg, var(--teal), var(--violet), var(--teal));
    box-shadow: 0 0 12px rgba(55,232,196,0.4);
    display: flex; align-items: center; justify-content: center;
  }
  .hub-title {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.5px;
    background: linear-gradient(90deg, #fff, var(--teal));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .hub-tabs {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--panel-border);
    padding: 3px 4px;
    border-radius: 10px;
  }
  .hub-tab {
    padding: 6px 12px;
    border-radius: 7px;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
  }
  .hub-tab:hover {
    color: var(--text);
    background: rgba(255, 255, 255, 0.05);
  }
  .hub-tab.active {
    color: var(--teal);
    background: rgba(55, 232, 196, 0.12);
    border: 1px solid rgba(55, 232, 196, 0.3);
  }
  .hub-tab .dot {
    width: 6px; height: 6px; border-radius: 50%;
  }
  .hub-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .hub-popout-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--panel-border);
    color: var(--muted);
    font-size: 11px;
    font-weight: 600;
    padding: 5px 10px;
    border-radius: 7px;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s;
  }
  .hub-popout-btn:hover {
    color: var(--text);
    border-color: rgba(255, 255, 255, 0.2);
  }
  .hub-ports {
    font-size: 10.5px;
    color: var(--muted);
    font-family: 'Space Grotesk', sans-serif;
  }
  .hub-ports span {
    color: var(--teal);
    font-weight: 700;
  }
  .hub-viewport {
    flex: 1;
    position: relative;
    background: #000;
  }
  iframe.app-frame {
    width: 100%;
    height: 100%;
    border: none;
    display: none;
  }
  iframe.app-frame.active {
    display: block;
  }
  /* API Console Overlay Tab */
  .api-console {
    display: none;
    width: 100%; height: 100%;
    background: #06090e;
    overflow-y: auto;
    padding: 24px;
  }
  .api-console.active { display: block; }
  .api-card {
    max-width: 900px;
    margin: 0 auto;
    background: rgba(14, 21, 31, 0.75);
    border: 1px solid var(--panel-border);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .api-endpoint {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-family: monospace;
  }
  .api-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
  }
  .badge-get { background: rgba(55, 232, 196, 0.2); color: var(--teal); }
  .badge-post { background: rgba(139, 147, 255, 0.2); color: var(--violet); }
  .api-btn {
    padding: 5px 12px;
    background: var(--teal);
    color: #05080b;
    border: none;
    border-radius: 6px;
    font-weight: 700;
    cursor: pointer;
    font-size: 11px;
    width: fit-content;
  }
  .api-result {
    background: #000;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 10px;
    font-size: 11.5px;
    color: #37e8c4;
    white-space: pre-wrap;
    max-height: 200px;
    overflow-y: auto;
  }
</style>
</head>
<body>

  <!-- Top Hub Bar -->
  <header class="hub-bar">
    <div class="hub-brand">
      <div class="hub-mark">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="#05080b"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#05080b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div>
        <div class="hub-title">AEGIS MASTER OS HUB</div>
      </div>
    </div>

    <!-- Switcher Tabs -->
    <nav class="hub-tabs">
      <div class="hub-tab active" onclick="switchApp('aegis-react', 'http://localhost:3001')">
        <span class="dot" style="background:var(--teal)"></span>
        AEGIS OS (React)
      </div>
      <div class="hub-tab" onclick="switchApp('aegis-standalone', 'http://localhost:3002')">
        <span class="dot" style="background:var(--gold)"></span>
        Standalone Console
      </div>
      <div class="hub-tab" onclick="switchApp('spatial-erp', 'http://localhost:3003')">
        <span class="dot" style="background:var(--violet)"></span>
        Spatial ERP &amp; Kinematics
      </div>
      <div class="hub-tab" onclick="switchApp('knowledge-graph', 'http://localhost:3004')">
        <span class="dot" style="background:#4ade80"></span>
        Knowledge Graph
      </div>
      <div class="hub-tab" onclick="switchApp('api-console', null)">
        <span class="dot" style="background:#f43f5e"></span>
        REST API Gateway (:8000)
      </div>
    </nav>

    <!-- Right Controls -->
    <div class="hub-right">
      <div class="hub-ports">ALL <span>5 PORTS</span> ACTIVE</div>
      <a id="popoutLink" class="hub-popout-btn" href="http://localhost:3001" target="_blank" title="Open current view in new window">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
        Pop Out
      </a>
    </div>
  </header>

  <!-- Viewport Area -->
  <main class="hub-viewport">
    <iframe id="frame-aegis-react" class="app-frame active" src="http://localhost:3001"></iframe>
    <iframe id="frame-aegis-standalone" class="app-frame" src="http://localhost:3002"></iframe>
    <iframe id="frame-spatial-erp" class="app-frame" src="http://localhost:3003"></iframe>
    <iframe id="frame-knowledge-graph" class="app-frame" src="http://localhost:3004"></iframe>

    <!-- Interactive REST API Console -->
    <div id="view-api-console" class="api-console">
      <div class="api-card">
        <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:18px;color:var(--teal);">
          AEGIS REST API Gateway (:8000)
        </div>
        <p style="font-size:12px;color:var(--muted);line-height:1.4;">
          Test any microservice endpoint live. All endpoints respond with mock payloads matching our TypeScript API contract.
        </p>

        <!-- Endpoint 1 -->
        <div class="api-endpoint">
          <div><span class="api-badge badge-get">GET</span> <strong>/api/agents</strong></div>
          <button class="api-btn" onclick="testEndpoint('/api/agents', 'res-agents')">Execute Request</button>
          <pre id="res-agents" class="api-result">Click "Execute Request" to test live endpoint...</pre>
        </div>

        <!-- Endpoint 2 -->
        <div class="api-endpoint">
          <div><span class="api-badge badge-get">GET</span> <strong>/api/tasks</strong></div>
          <button class="api-btn" onclick="testEndpoint('/api/tasks', 'res-tasks')">Execute Request</button>
          <pre id="res-tasks" class="api-result">Click "Execute Request" to test live endpoint...</pre>
        </div>

        <!-- Endpoint 3 -->
        <div class="api-endpoint">
          <div><span class="api-badge badge-get">GET</span> <strong>/api/guardrails</strong></div>
          <button class="api-btn" onclick="testEndpoint('/api/guardrails', 'res-guardrails')">Execute Request</button>
          <pre id="res-guardrails" class="api-result">Click "Execute Request" to test live endpoint...</pre>
        </div>

        <!-- Endpoint 4 -->
        <div class="api-endpoint">
          <div><span class="api-badge badge-get">GET</span> <strong>/api/shopping/search?q=headphones</strong></div>
          <button class="api-btn" onclick="testEndpoint('/api/shopping/search', 'res-shopping')">Execute Request</button>
          <pre id="res-shopping" class="api-result">Click "Execute Request" to test live endpoint...</pre>
        </div>
      </div>
    </div>
  </main>

<script>
  function switchApp(appId, url) {
    document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
    event.currentTarget.classList.add('active');

    document.querySelectorAll('.app-frame').forEach(f => f.classList.remove('active'));
    document.getElementById('view-api-console').classList.remove('active');

    if (appId === 'api-console') {
      document.getElementById('view-api-console').classList.add('active');
      document.getElementById('popoutLink').href = 'http://localhost:8000/api/agents';
    } else {
      const frame = document.getElementById('frame-' + appId);
      if (frame) frame.classList.add('active');
      document.getElementById('popoutLink').href = url || '#';
    }
  }

  async function testEndpoint(endpoint, resultId) {
    const el = document.getElementById(resultId);
    el.textContent = 'Loading...';
    try {
      const res = await fetch('http://localhost:8000' + endpoint);
      const json = await res.json();
      el.textContent = JSON.stringify(json, null, 2);
    } catch (e) {
      el.textContent = 'Error calling endpoint: ' + e.message;
    }
  }
</script>
</body>
</html>`;

// Port 3000 serves the Master Hub
http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  if (parsed.pathname.startsWith('/api/')) {
    handleApiRequest(req, res);
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(HUB_HTML);
}).listen(3000, () => {
  console.log('🚀 =========================================================');
  console.log('🌟 [PORT 3000] AEGIS MASTER OS COMMAND CENTER: http://localhost:3000');
  console.log('🚀 =========================================================');
});
