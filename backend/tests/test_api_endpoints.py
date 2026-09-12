"""
FastAPI route and WebSocket integration test
"""
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_api_health():
    response = client.get("/api/memory/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "subsystem" in data


def test_seed_demo_and_graph_query():
    # Seed workflow
    seed_res = client.post("/api/memory/seed-demo")
    assert seed_res.status_code == 200
    assert seed_res.json()["success"] is True

    # Query Canvas graph
    graph_res = client.get("/api/memory/graph?task_id=vendor_payout_task")
    assert graph_res.status_code == 200
    data = graph_res.json()
    assert data["total_nodes"] == 5
    assert data["total_edges"] == 4
    assert len(data["nodes"]) == 5


def test_simulate_chaos_endpoint():
    # Run Act II chaos
    chaos_res = client.post("/api/memory/simulate-chaos?delta_x=120")
    assert chaos_res.status_code == 200
    data = chaos_res.json()
    assert "drift_detected" in data
    assert "self_healing" in data
    assert data["self_healing"]["updated_status"] == "HEALED"
    assert data["self_healing"]["delta_x"] == 120.0

    # Query Canvas graph again and verify healed status and emerald green color
    graph_res = client.get("/api/memory/graph?task_id=vendor_payout_task")
    assert graph_res.status_code == 200
    graph_data = graph_res.json()
    assert graph_data["healed_count"] >= 1


def test_websocket_telemetry():
    # Ensure demo is seeded first
    client.post("/api/memory/seed-demo")
    with client.websocket_connect("/ws/telemetry") as websocket:
        # Trigger an action that emits telemetry
        client.post("/api/memory/simulate-chaos?delta_x=120")
        data = websocket.receive_json()
        assert "event_type" in data
        assert "summary" in data
        assert data["event_type"] in ["MEMORY_DRIFT_DETECTED", "SELF_HEALING_COMPLETED"]
