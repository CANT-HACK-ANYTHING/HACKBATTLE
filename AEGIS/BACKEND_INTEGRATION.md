# AEGIS — Backend & AI Integration Guide

This guide is for the **Backend / AI / Model engineering team** to connect their AI models, agent frameworks (LangGraph, CrewAI, AutoGen, FastAPI, etc.), and database to this frontend.

---

## 1. Where to Connect Your API URL

Open:
📂 `src/api/agentApi.ts`

Change the `BASE_URL`:
```typescript
// Replace with your real backend server URL (e.g. FastAPI, Express, Flask)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```
Or create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:8000
```

---

## 2. API Endpoints Needed from Backend

You only need to implement **3 endpoints** for full integration:

### Endpoint 1: List All Active Agents
* **Method**: `GET`
* **Route**: `/api/agents`
* **Response (JSON)**: Array of `Agent` objects (see Schema below).

### Endpoint 2: Get Agent Activity / Telemetry Trace
* **Method**: `GET`
* **Route**: `/api/agents/:id/activity`
* **Response (JSON)**: Array of activity log items.

### Endpoint 3: Send Action to Agent
* **Method**: `POST`
* **Route**: `/api/agents/:id/action`
* **Request Body**: `{ action: "pause" | "resume" | "stop" | "trigger" }`
* **Response (JSON)**: Updated `Agent` object.

---

## 3. The Agent Data Model (JSON Payload)

The frontend is **100% data-driven**. Inputs, outputs, memory, and guardrails are optional and dynamic — only include what your agent actually has!

```json
{
  "id": "agent-learn-01",
  "name": "Learning Agent",
  "type": "learning",
  "status": "LEARNING",
  "task": "Ingesting dynamic API schemas and fine-tuning heuristic embeddings",
  "progress": 74,
  "icon": "📚",
  "permissionLevel": "autonomous",
  "automationLevel": "full_auto",
  "position": { "x": -380, "y": -190 },
  "size": { "w": 380, "h": 360 },

  "memory": {
    "status": "CONNECTED",
    "shortTerm": "Active schema parser (v2.4)",
    "longTerm": "14,280 vector embeddings",
    "vectorTokens": 384000,
    "activeContexts": 4
  },

  "guardrails": {
    "status": "ACTIVE",
    "active": true,
    "rules": [
      "Sandboxed model evaluation",
      "Verify JSON schema validation"
    ],
    "blockedActions": [
      "External network egress",
      "Direct database write"
    ]
  },

  "inputs": [
    { "id": "in-1", "label": "Schema Manifest", "type": "JSON", "source": "OpenAPI Spec v3" },
    { "id": "in-2", "label": "Telemetry Stream", "type": "gRPC", "source": "Kernel Telemetry" }
  ],

  "outputs": [
    { "id": "out-1", "label": "Vector Index", "type": "HNSW", "destination": "Memory Agent" },
    { "id": "out-2", "label": "Heuristic Rules", "type": "Policy", "destination": "Security Agent" }
  ],

  "activity": [
    { "id": "act-1", "type": "action", "title": "Synthesized 12 new function definitions", "timestamp": "2m ago" },
    { "id": "act-2", "type": "memory", "title": "Updated long-term vector cluster #4", "timestamp": "5m ago" }
  ],

  "tools": [
    "Schema Parser",
    "Vector DB",
    "Semantic Reasoner"
  ]
}
```

### Valid Status Values
* `"IDLE"`
* `"ACTIVE"`
* `"THINKING"`
* `"LEARNING"`
* `"EXECUTING"`
* `"WAITING"`
* `"PAUSED"`
* `"COMPLETED"`
* `"ERROR"`

---

## 4. Real-Time Streaming / WebSockets (Optional)

If your backend streams agent status updates or token generation in real time:
1. In `src/api/agentApi.ts`, add a WebSocket connection in `subscribeToAgentUpdates`:
```typescript
export function subscribeToAgentStream(onUpdate: (agent: Agent) => void) {
  const ws = new WebSocket('ws://localhost:8000/ws/agents');
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onUpdate(data);
  };
  return () => ws.close();
}
```
2. The Zustand store in `src/store/appStore.ts` will automatically update the UI in real time.

---

## 5. Running the Frontend

```bash
# In C:\AEGIS
npm run dev
```
Runs at `http://localhost:5173/`.
