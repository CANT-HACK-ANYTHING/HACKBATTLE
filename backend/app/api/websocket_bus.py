"""
WebSocket Telemetry Event Bus for AegisOS
Broadcasts real-time state graph mutations, drift detection alerts, and self-healing events
to FE 1 (Glassmorphic HUD) and FE 2 (Canvas Graph).
"""
import asyncio
import json
import logging
from typing import Set
from fastapi import WebSocket, WebSocketDisconnect
from backend.app.memory.models import MemoryTelemetryEvent

logger = logging.getLogger("aegis.telemetry_bus")


class WebSocketBus:
    def __init__(self):
        self._active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._active_connections.add(websocket)
        logger.info(f"Client connected to telemetry bus. Total active: {len(self._active_connections)}")

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._active_connections.discard(websocket)
        logger.info(f"Client disconnected. Remaining active: {len(self._active_connections)}")

    async def broadcast(self, event: MemoryTelemetryEvent) -> None:
        """
        Broadcasts a typed MemoryTelemetryEvent to all connected frontends.
        """
        if not self._active_connections:
            return

        message_str = event.model_dump_json()
        dead_connections = set()

        async with self._lock:
            for ws in self._active_connections:
                try:
                    await ws.send_text(message_str)
                except Exception as ex:
                    logger.warning(f"Failed to send telemetry event to client: {ex}")
                    dead_connections.add(ws)

            for dead_ws in dead_connections:
                self._active_connections.discard(dead_ws)

    @property
    def client_count(self) -> int:
        return len(self._active_connections)


telemetry_bus = WebSocketBus()
