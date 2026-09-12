"""
AegisOS Backend Main Application
Autonomous Ambient Operator - BE 2 Episodic Memory & State Graph Server
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from backend.app.api.memory_routes import router as memory_router
from backend.app.api.websocket_bus import telemetry_bus
from backend.app.config import settings_server
from backend.app.memory.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and tables
    init_db()
    yield


app = FastAPI(
    title="AegisOS - BE 2 Episodic Memory & State Graph",
    description="Autonomous Ambient Operator: Visual State Graph, Drift Detection & Self-Healing Engine",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration for cross-origin frontend support
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings_server.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Memory Subsystem API
app.include_router(memory_router)


# WebSocket endpoint for real-time telemetry streaming (FE 1 HUD & FE 2 Canvas)
@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await telemetry_bus.connect(websocket)
    try:
        while True:
            # Keep-alive receive loop
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        await telemetry_bus.disconnect(websocket)
    except Exception:
        await telemetry_bus.disconnect(websocket)


# Cyberpunk Ambient Operator Preview Console (for immediate visual verification)
@app.get("/", response_class=HTMLResponse)
def get_ambient_console():
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>AegisOS // BE 2 Episodic Memory Console</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #090d16; color: #e2e8f0; font-family: 'JetBrains Mono', monospace, sans-serif; }
        .glow-border { box-shadow: 0 0 15px rgba(59, 130, 246, 0.25); }
        .node-pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    </style>
</head>
<body class="p-6">
    <div class="max-w-6xl mx-auto space-y-6">
        <!-- Header Bar -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
                <div class="flex items-center space-x-3">
                    <span class="inline-block w-3 h-3 bg-cyan-400 rounded-full node-pulse"></span>
                    <h1 class="text-2xl font-black tracking-widest text-cyan-400">AEGIS<span class="text-slate-100">OS</span> // BE 2</h1>
                </div>
                <p class="text-xs text-slate-400 mt-1">Autonomous Ambient Operator: Episodic State Graph & Self-Healing Engine</p>
            </div>
            <div class="flex items-center space-x-3">
                <span id="ws-status" class="px-3 py-1 text-xs rounded border border-red-500 bg-red-950/40 text-red-300">WS Disconnected</span>
                <span class="px-3 py-1 text-xs rounded border border-cyan-500 bg-cyan-950/40 text-cyan-300">Port 8000</span>
            </div>
        </div>

        <!-- Control Action Bar -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onclick="seedDemo()" class="p-3 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/50 rounded text-sm text-blue-200 font-semibold transition text-left">
                <span class="block text-cyan-400 text-xs uppercase tracking-wider mb-1">01. Setup</span>
                Seed 5-Step Demo Workflow
            </button>
            <button onclick="simulateChaos()" class="p-3 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-500/50 rounded text-sm text-amber-200 font-semibold transition text-left">
                <span class="block text-amber-400 text-xs uppercase tracking-wider mb-1">02. Act II Chaos Sabotage</span>
                Shift Button (+120px) & Self-Heal
            </button>
            <button onclick="fetchGraph()" class="p-3 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-700 rounded text-sm text-slate-200 font-semibold transition text-left">
                <span class="block text-slate-400 text-xs uppercase tracking-wider mb-1">03. Refresh</span>
                Poll SQLite Canvas Graph
            </button>
        </div>

        <!-- Main Grid: State Graph View & Real-Time Telemetry Feed -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left: State Graph Topology -->
            <div class="bg-slate-950/80 border border-slate-800 rounded-lg p-4 glow-border">
                <div class="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                    <h2 class="text-sm font-bold text-slate-300 uppercase tracking-wide">Episodic State Graph Nodes</h2>
                    <span id="node-count-badge" class="text-xs text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">0 Nodes</span>
                </div>
                <div id="graph-container" class="space-y-2 max-h-96 overflow-y-auto pr-1 text-xs">
                    <p class="text-slate-500 italic">No nodes loaded. Click 'Seed 5-Step Demo Workflow' above.</p>
                </div>
            </div>

            <!-- Right: Real-time Telemetry Event Feed (HUD Stream) -->
            <div class="bg-slate-950/80 border border-slate-800 rounded-lg p-4 glow-border">
                <div class="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                    <h2 class="text-sm font-bold text-slate-300 uppercase tracking-wide">Telemetry Bus Feed (/ws/telemetry)</h2>
                    <button onclick="clearLogs()" class="text-xs text-slate-500 hover:text-slate-300">Clear</button>
                </div>
                <div id="telemetry-logs" class="space-y-2 max-h-96 overflow-y-auto pr-1 font-mono text-[11px] text-slate-400">
                    <div class="text-slate-600">[System] Awaiting WebSocket telemetry stream...</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProto}//${window.location.host}/ws/telemetry`;
        let ws;

        function connectWs() {
            ws = new WebSocket(wsUrl);
            const statusBadge = document.getElementById('ws-status');

            ws.onopen = () => {
                statusBadge.textContent = 'WS Connected';
                statusBadge.className = 'px-3 py-1 text-xs rounded border border-emerald-500 bg-emerald-950/40 text-emerald-300';
                appendLog('System', 'Connected to real-time telemetry event bus (/ws/telemetry)');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    appendLog(data.event_type, data.summary);
                    fetchGraph();
                } catch(e) {
                    appendLog('RAW', event.data);
                }
            };

            ws.onclose = () => {
                statusBadge.textContent = 'WS Disconnected';
                statusBadge.className = 'px-3 py-1 text-xs rounded border border-red-500 bg-red-950/40 text-red-300';
                setTimeout(connectWs, 2000);
            };
        }

        function appendLog(type, message) {
            const container = document.getElementById('telemetry-logs');
            const item = document.createElement('div');
            item.className = 'p-2 rounded bg-slate-900 border border-slate-800 text-slate-300';
            
            let color = 'text-cyan-400';
            if (type.includes('DRIFT')) color = 'text-amber-400 font-bold';
            if (type.includes('HEALING')) color = 'text-emerald-400 font-bold';
            if (type.includes('LOCK') || type.includes('BREACH')) color = 'text-red-400 font-bold';

            item.innerHTML = `<span class="${color}">[${type}]</span> <span class="text-slate-400 text-[10px]">${new Date().toLocaleTimeString()}</span><div class="mt-1">${message}</div>`;
            container.prepend(item);
        }

        function clearLogs() {
            document.getElementById('telemetry-logs').innerHTML = '';
        }

        async function seedDemo() {
            const res = await fetch('/api/memory/seed-demo', { method: 'POST' });
            const data = await res.json();
            appendLog('SEED_DEMO', data.message);
            fetchGraph();
        }

        async function simulateChaos() {
            const res = await fetch('/api/memory/simulate-chaos?delta_x=120', { method: 'POST' });
            const data = await res.json();
            appendLog('ACT_II_CHAOS', `Button displaced by +120px. Re-anchoring performed: ${data.self_healing.message}`);
            fetchGraph();
        }

        async function fetchGraph() {
            const res = await fetch('/api/memory/graph?task_id=vendor_payout_task');
            if (!res.ok) return;
            const data = await res.json();
            
            document.getElementById('node-count-badge').textContent = `${data.total_nodes} Nodes (${data.healed_count} Healed)`;
            const container = document.getElementById('graph-container');
            container.innerHTML = '';

            data.nodes.forEach(node => {
                const card = document.createElement('div');
                card.className = 'p-2.5 rounded border border-slate-800 bg-slate-900/60 flex items-center justify-between';
                card.innerHTML = `
                    <div class="flex items-center space-x-2">
                        <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${node.color}"></span>
                        <div>
                            <span class="font-semibold text-slate-200">${node.label}</span>
                            <div class="text-[10px] text-slate-400">Coords: [x:${Math.round(node.x)}, y:${Math.round(node.y)}] | Action: ${node.action_type}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold" style="background-color: ${node.color}22; color: ${node.color}; border: 1px solid ${node.color}44">${node.status}</span>
                        <div class="text-[9px] text-slate-500 mt-0.5">Heals: ${node.heal_count}</div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        connectWs();
        fetchGraph();
    </script>
</body>
</html>
    """


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.app.main:app",
        host=settings_server.host,
        port=settings_server.port,
        reload=settings_server.debug,
    )
