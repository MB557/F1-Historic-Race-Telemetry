from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import logging
from typing import Optional
import asyncio
import os

from .models import ReplayState, Timeline, LoadRaceResponse
from .data_service import get_data_service, DataService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="F1 Historic Race Replayer API",
    description="FastAPI backend for Formula 1 Historic Race Replayer using OpenF1 API",
    version="1.0.0"
)

# Mount static files
static_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_path):
    app.mount("/static", StaticFiles(directory=static_path), name="static")

# Global demo session key - in production, this would be managed differently
DEMO_SESSION_KEY: Optional[str] = None


@app.on_event("startup")
async def startup_event():
    """Initialize the application and load demo data"""
    global DEMO_SESSION_KEY
    
    logger.info("Starting F1 Historic Race Replayer API...")
    
    try:
        # Initialize demo session
        data_service = await get_data_service()
        DEMO_SESSION_KEY = await data_service.initialize_demo_session()
        
        if DEMO_SESSION_KEY:
            logger.info(f"Demo session ready: {DEMO_SESSION_KEY}")
        else:
            logger.warning("Could not initialize demo session - API will work but with no data")
            
    except Exception as e:
        logger.error(f"Error during startup: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    logger.info("Shutting down F1 Historic Race Replayer API...")
    
    # TODO: Close OpenF1 client connection
    try:
        from .openf1_client import _openf1_client
        if _openf1_client:
            await _openf1_client.close()
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the frontend HTML page"""
    static_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
    index_path = os.path.join(static_path, "index.html")
    
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    else:
        return HTMLResponse(content="<h1>F1 Historic Race Replayer</h1><p>Frontend not found. Please ensure static files are properly set up.</p>")


@app.get("/api")
async def api_root():
    """API health check endpoint"""
    return {
        "message": "F1 Historic Race Replayer API", 
        "version": "1.0.0",
        "demo_session": DEMO_SESSION_KEY
    }


@app.get("/api/replay/{session_key}/state", response_model=ReplayState)
async def get_replay_state(
    session_key: str,
    t: float = Query(..., description="Timestamp in seconds"),
    data_service: DataService = Depends(get_data_service)
):
    """
    Get the state of all cars at a specific timestamp
    
    Args:
        session_key: The session identifier
        t: Timestamp in seconds (Unix timestamp)
    
    Returns:
        ReplayState containing all car positions and telemetry at the timestamp
    """
    try:
        replay_state = await data_service.get_replay_state(session_key, t)
        
        if replay_state is None:
            raise HTTPException(
                status_code=404, 
                detail=f"No data found for session {session_key} at timestamp {t}"
            )
        
        return replay_state
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting replay state: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/replay/{session_key}/timeline", response_model=Timeline)
async def get_session_timeline(
    session_key: str,
    data_service: DataService = Depends(get_data_service)
):
    """
    Get lap-level timeline metadata for a session
    
    Args:
        session_key: The session identifier
    
    Returns:
        Timeline containing lap times, sector times, and pit stop information
    """
    try:
        timeline = await data_service.get_session_timeline(session_key)
        
        if timeline is None:
            raise HTTPException(
                status_code=404,
                detail=f"No timeline data found for session {session_key}"
            )
        
        return timeline
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting timeline: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/admin/load-session/{session_key}")
async def load_session_data(
    session_key: str,
    data_service: DataService = Depends(get_data_service)
):
    """
    Admin endpoint to manually load session data
    
    TODO: Add authentication and authorization for admin endpoints
    """
    try:
        success = await data_service.fetch_and_store_session_data(session_key)
        
        if success:
            return {"message": f"Successfully loaded session {session_key}"}
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to load session {session_key}"
            )
            
    except Exception as e:
        logger.error(f"Error loading session: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/load-race", response_model=LoadRaceResponse)
async def load_race_by_name(
    race_name: str = Query(..., description="Race name (e.g., 'Bahrain GP 2023', 'Monaco 2024')"),
    data_service: DataService = Depends(get_data_service)
):
    """
    Load a race session by name
    
    Args:
        race_name: Race name (e.g., 'Bahrain GP 2023', 'Monaco 2024', 'Japan 2023')
    
    Returns:
        Session information and loading status
    """
    try:
        session_key = await data_service.initialize_race_by_name(race_name)
        
        if session_key:
            return {
                "success": True,
                "message": f"Successfully loaded race: {race_name}",
                "session_key": session_key,
                "endpoints": {
                    "state": f"/api/replay/{session_key}/state?t=<timestamp>",
                    "timeline": f"/api/replay/{session_key}/timeline"
                },
                "example_usage": {
                    "get_timeline": f"/api/replay/{session_key}/timeline",
                    "get_state_at_start": f"/api/replay/{session_key}/state?t=1678024866"
                }
            }
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Could not find or load race: {race_name}. Try races like 'Bahrain GP 2023', 'Monaco 2024', etc."
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error loading race '{race_name}': {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/demo")
async def get_demo_info():
    """Get information about the demo session"""
    if DEMO_SESSION_KEY:
        return {
            "success": True,
            "session_key": DEMO_SESSION_KEY,
            "session_name": "Bahrain Grand Prix 2023",
            "status": "ready",
            "endpoints": {
                "state": f"/api/replay/{DEMO_SESSION_KEY}/state?t=<timestamp>",
                "timeline": f"/api/replay/{DEMO_SESSION_KEY}/timeline"
            },
            "example_usage": {
                "get_timeline": f"/api/replay/{DEMO_SESSION_KEY}/timeline",
                "get_state_at_start": f"/api/replay/{DEMO_SESSION_KEY}/state?t=1678024866"
            }
        }
    else:
        return {
            "success": False,
            "message": "No demo session available",
            "suggestion": "Use POST /api/load-race?race_name=Bahrain GP 2023 to load a race"
        }


# TODO: Add the following endpoints for a complete replay system:
# - GET /api/replay/{session_key}/drivers - List all drivers in session
# - GET /api/replay/{session_key}/events - Get race events (crashes, safety cars, etc.)
# - GET /api/replay/{session_key}/weather - Get weather data
# - POST /api/replay/{session_key}/bookmark - Create bookmarks for interesting moments
# - WebSocket endpoint for real-time replay streaming
# - Data export endpoints for analysis
# - Session comparison endpoints 