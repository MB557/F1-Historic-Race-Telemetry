import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from dateutil import parser as date_parser

from .openf1_client import get_openf1_client, OpenF1Client
from .database import get_database_manager, DatabaseManager
from .models import CarState, TimelineEntry, ReplayState, Timeline

logger = logging.getLogger(__name__)


class DataService:
    """Service for managing F1 telemetry data fetching and processing"""
    
    def __init__(self, openf1_client: OpenF1Client, db_manager: DatabaseManager):
        self.openf1_client = openf1_client
        self.db_manager = db_manager
    
    @staticmethod
    def _convert_timestamp(date_str: str) -> float:
        """Convert OpenF1 date string to Unix timestamp"""
        try:
            # TODO: Handle timezone conversions properly
            dt = date_parser.parse(date_str)
            return dt.timestamp()
        except (ValueError, TypeError):
            logger.warning(f"Could not parse timestamp: {date_str}")
            return 0.0
    
    async def fetch_and_store_session_data(self, session_key: str, session_name: str = "Unknown Race", country_name: str = "Unknown") -> bool:
        """Fetch all data for a session and store in database"""
        try:
            logger.info(f"Starting data fetch for session {session_key}")
            
            # Check if data already exists
            if await self.db_manager.session_exists(session_key):
                logger.info(f"Session {session_key} already exists in database")
                return True
            
            # Fetch all data from OpenF1 API
            session_data = await self.openf1_client.fetch_all_session_data(session_key)
            
            # Process and convert timestamps
            processed_data = self._process_raw_data(session_data)
            
            # Store in database
            await self.db_manager.store_session(session_key, {
                "session_key": session_key,
                "session_name": session_name,
                "session_type": "Race",
                "date_start": "",
                "date_end": "",
                "country_name": country_name,
                "year": 2023  # TODO: Extract year from session data
            })
            
            await self.db_manager.store_telemetry_data(session_key, processed_data)
            
            logger.info(f"Successfully stored data for session {session_key}")
            return True
            
        except Exception as e:
            logger.error(f"Error fetching and storing session data: {e}")
            return False
    
    def _process_raw_data(self, raw_data: Dict[str, List[Dict[str, Any]]]) -> Dict[str, List[Dict[str, Any]]]:
        """Process raw OpenF1 data and convert timestamps"""
        processed = {}
        
        # Process position data
        if "position" in raw_data:
            processed["position"] = []
            for record in raw_data["position"]:
                if record.get("date"):
                    record["date"] = self._convert_timestamp(record["date"])
                processed["position"].append(record)
        
        # Process car data
        if "car_data" in raw_data:
            processed["car_data"] = []
            for record in raw_data["car_data"]:
                if record.get("date"):
                    record["date"] = self._convert_timestamp(record["date"])
                processed["car_data"].append(record)
        
        # Process lap times
        if "lap_times" in raw_data:
            processed["lap_times"] = []
            for record in raw_data["lap_times"]:
                processed["lap_times"].append(record)
        
        return processed
    
    async def get_replay_state(self, session_key: str, timestamp: float) -> Optional[ReplayState]:
        """Get the state of all cars at a specific timestamp"""
        try:
            car_states_data = await self.db_manager.get_car_states_at_timestamp(session_key, timestamp)
            
            cars = []
            for car_data in car_states_data:
                cars.append(CarState(
                    driver_number=car_data.get("driver_number", 0),
                    x=float(car_data.get("x", 0)),  # Using x to store race position
                    y=car_data.get("y", 0.0),       # Not used for now
                    speed=car_data.get("speed", 0.0) if car_data.get("speed") is not None else 0.0,
                    gear=car_data.get("gear", 1) if car_data.get("gear") is not None else 1,
                    throttle=car_data.get("throttle", 0.0) if car_data.get("throttle") is not None else 0.0,
                    brake=car_data.get("brake", False) if car_data.get("brake") is not None else False,
                    timestamp=car_data.get("timestamp", timestamp)
                ))
            
            return ReplayState(timestamp=timestamp, cars=cars)
            
        except Exception as e:
            logger.error(f"Error getting replay state: {e}")
            return None
    
    async def get_session_timeline(self, session_key: str) -> Optional[Timeline]:
        """Get timeline data for a session"""
        try:
            timeline_data = await self.db_manager.get_timeline(session_key)
            
            entries = []
            for lap_data in timeline_data.get("laps", []):
                entries.append(TimelineEntry(
                    lap=lap_data.get("lap_number", 0),
                    driver_number=lap_data.get("driver_number", 0),
                    sector1_time=lap_data.get("sector_1_time"),
                    sector2_time=lap_data.get("sector_2_time"),
                    sector3_time=lap_data.get("sector_3_time"),
                    lap_time=lap_data.get("lap_time"),
                    pit_stop=bool(lap_data.get("pit_in_time") or lap_data.get("pit_out_time"))
                ))
            
            return Timeline(
                session_key=session_key,
                total_laps=timeline_data.get("total_laps", 0),
                entries=entries
            )
            
        except Exception as e:
            logger.error(f"Error getting timeline: {e}")
            return None
    
    async def initialize_demo_session(self) -> Optional[str]:
        """Initialize demo session with Bahrain 2023 race data"""
        return await self.initialize_race_by_name("Bahrain GP 2023")
    
    async def initialize_race_by_name(self, race_name: str) -> Optional[str]:
        """Initialize a race session by race name (e.g., 'Bahrain GP 2023')"""
        try:
            # Search for the race session
            race_session = await self.openf1_client.search_race_by_name(race_name)
            
            if not race_session:
                logger.error(f"Could not find race session for '{race_name}'")
                return None
            
            session_key = str(race_session["session_key"])
            session_name = race_session.get("session_name", race_name)
            country_name = race_session.get("country_name", "Unknown")
            
            logger.info(f"Found race session for '{race_name}': {session_key}")
            
            # Fetch and store data
            success = await self.fetch_and_store_session_data(session_key, session_name, country_name)
            
            if success:
                logger.info(f"Race session initialized: {session_key} ({race_name})")
                return session_key
            else:
                logger.error(f"Failed to initialize race session for '{race_name}'")
                return None
                
        except Exception as e:
            logger.error(f"Error initializing race session for '{race_name}': {e}")
            return None


# Dependency injection
async def get_data_service() -> DataService:
    """Get data service instance"""
    openf1_client = await get_openf1_client()
    db_manager = await get_database_manager()
    return DataService(openf1_client, db_manager) 