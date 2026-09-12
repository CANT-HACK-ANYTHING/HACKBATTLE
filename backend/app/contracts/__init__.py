"""
AegisOS Cross-Module Contracts (BE 2 Bridges)
"""
from backend.app.contracts.be1_actuator_contract import (
    ActuatorMemoryBridge,
    FastPathActionResponse,
    PerceptualStateObservation,
)
from backend.app.contracts.be3_boundary_contract import (
    BoundaryMemoryBridge,
    BoundaryVerificationRequest,
    BoundaryVerificationResult,
    StateRollbackSnapshot,
)
from backend.app.contracts.fe2_canvas_contract import (
    STATUS_COLOR_MAP,
    build_canvas_graph_payload,
)

__all__ = [
    "STATUS_COLOR_MAP",
    "build_canvas_graph_payload",
    "PerceptualStateObservation",
    "FastPathActionResponse",
    "ActuatorMemoryBridge",
    "BoundaryVerificationRequest",
    "BoundaryVerificationResult",
    "StateRollbackSnapshot",
    "BoundaryMemoryBridge",
]
