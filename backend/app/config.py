"""
Configuration for AegisOS - BE 2 Memory Engine & Subsystem
"""
import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True, parents=True)

class MemorySettings(BaseModel):
    # Database path
    db_path: Path = DATA_DIR / "aegis_episodic_graph.db"
    
    # Drift thresholds
    # Fast path threshold: score <= tau_fast means state matches current node
    tau_fast: float = 0.15
    # Drift threshold: tau_fast < score <= tau_drift means drifted node, trigger self-healing
    tau_drift: float = 0.55
    # Beyond tau_drift: completely unfamiliar state / anomaly
    
    # Weight configuration for drift calculation
    weight_hash: float = 0.35      # Hamming distance on perceptual hash
    weight_spatial: float = 0.50   # Spatial center displacement
    weight_area: float = 0.15      # Bounding box scale/aspect ratio change
    
    # Coordinate system (Normalized space: 0 to 1000)
    coord_space_max: float = 1000.0
    
    # Maximum acceptable spatial displacement before treating as novel element
    max_drift_distance_px: float = 300.0

class ServerSettings(BaseModel):
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    cors_origins: list[str] = ["*"]

settings_memory = MemorySettings()
settings_server = ServerSettings()
