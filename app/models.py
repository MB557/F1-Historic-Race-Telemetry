from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class CarState(BaseModel):
    """State of a car at a specific timestamp"""
    driver_number: int
    x: float
    y: float
    speed: float
    gear: Optional[int] = None
    throttle: Optional[float] = None
    brake: Optional[float] = None
    timestamp: float  # Unix timestamp in seconds


class TimelineEntry(BaseModel):
    """Lap-level timeline metadata for a driver"""
    lap: int
    driver_number: int
    sector1_time: Optional[float] = None
    sector2_time: Optional[float] = None
    sector3_time: Optional[float] = None
    lap_time: Optional[float] = None
    pit_stop: bool = False


class SessionInfo(BaseModel):
    """Session information"""
    session_key: str
    session_name: str
    session_type: str
    date_start: datetime
    date_end: datetime
    total_laps: int


class ReplayState(BaseModel):
    """Complete state at a given timestamp"""
    timestamp: float
    cars: List[CarState]


class Timeline(BaseModel):
    """Complete timeline for a session"""
    session_key: str
    total_laps: int
    entries: List[TimelineEntry]


class LoadRaceResponse(BaseModel):
    """Response for loading a race by name"""
    success: bool
    message: str
    session_key: Optional[str] = None
    endpoints: Optional[Dict[str, str]] = None
    example_usage: Optional[Dict[str, str]] = None 