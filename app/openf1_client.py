import httpx
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class OpenF1Client:
    """Client for fetching data from OpenF1 API"""
    
    BASE_URL = "https://api.openf1.org/v1"
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    async def get_sessions(self, year: int = 2023, country_name: str = "Bahrain") -> List[Dict[str, Any]]:
        """Get sessions for a specific year and country"""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/sessions",
                params={"year": year, "country_name": country_name}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching sessions: {e}")
            raise
    
    async def get_race_session(self, year: int = 2023, country_name: str = "Bahrain") -> Optional[Dict[str, Any]]:
        """Get the race session for a specific year and country"""
        sessions = await self.get_sessions(year, country_name)
        race_sessions = [s for s in sessions if s.get("session_type") == "Race"]
        return race_sessions[0] if race_sessions else None
    
    async def search_race_by_name(self, race_name: str) -> Optional[Dict[str, Any]]:
        """Search for a race session by name (e.g., 'Bahrain GP 2023', 'Monaco 2024')"""
        try:
            # Parse the race name to extract year and country
            year, country = self._parse_race_name(race_name)
            
            if not year or not country:
                logger.error(f"Could not parse race name: {race_name}")
                return None
            
            # Get sessions for the parsed year and country
            sessions = await self.get_sessions(year, country)
            race_sessions = [s for s in sessions if s.get("session_type") == "Race"]
            
            if race_sessions:
                session = race_sessions[0]
                logger.info(f"Found race session for '{race_name}': {session['session_key']}")
                return session
            else:
                logger.warning(f"No race session found for '{race_name}'")
                return None
                
        except Exception as e:
            logger.error(f"Error searching for race '{race_name}': {e}")
            return None
    
    def _parse_race_name(self, race_name: str) -> tuple[Optional[int], Optional[str]]:
        """Parse race name to extract year and country"""
        try:
            race_name = race_name.strip().lower()
            
            # Extract year (look for 4-digit number)
            year = None
            words = race_name.split()
            for word in words:
                if word.isdigit() and len(word) == 4:
                    year = int(word)
                    break
            
            # Country name mapping for common race names
            country_mapping = {
                "bahrain": "Bahrain",
                "saudi": "Saudi Arabia",
                "australia": "Australia",
                "japan": "Japan",
                "china": "China",
                "miami": "United States",
                "italy": "Italy",
                "monaco": "Monaco",
                "spain": "Spain",
                "canada": "Canada",
                "austria": "Austria",
                "britain": "United Kingdom",
                "uk": "United Kingdom",
                "hungary": "Hungary",
                "belgium": "Belgium",
                "netherlands": "Netherlands",
                "singapore": "Singapore",
                "mexico": "Mexico",
                "brazil": "Brazil",
                "usa": "United States",
                "united states": "United States",
                "abu dhabi": "United Arab Emirates",
                "uae": "United Arab Emirates"
            }
            
            # Find country in the race name
            country = None
            for key, value in country_mapping.items():
                if key in race_name:
                    country = value
                    break
            
            logger.info(f"Parsed '{race_name}' -> Year: {year}, Country: {country}")
            return year, country
            
        except Exception as e:
            logger.error(f"Error parsing race name '{race_name}': {e}")
            return None, None
    
    async def get_position_data(self, session_key: str) -> List[Dict[str, Any]]:
        """Fetch position data for a session"""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/position",
                params={"session_key": session_key}
            )
            response.raise_for_status()
            data = response.json()
            logger.info(f"Fetched {len(data)} position records for session {session_key}")
            return data
        except Exception as e:
            logger.error(f"Error fetching position data: {e}")
            raise
    
    async def get_car_data(self, session_key: str) -> List[Dict[str, Any]]:
        """Fetch car data (telemetry) for a session"""
        try:
            # TODO: Implement batching for large datasets to avoid memory issues
            response = await self.client.get(
                f"{self.BASE_URL}/car_data",
                params={"session_key": session_key}
            )
            response.raise_for_status()
            data = response.json()
            logger.info(f"Fetched {len(data)} car data records for session {session_key}")
            return data
        except Exception as e:
            logger.error(f"Error fetching car data: {e}")
            raise
    
    async def get_lap_times(self, session_key: str) -> List[Dict[str, Any]]:
        """Fetch lap times for a session"""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/laps",
                params={"session_key": session_key}
            )
            response.raise_for_status()
            data = response.json()
            logger.info(f"Fetched {len(data)} lap records for session {session_key}")
            return data
        except Exception as e:
            logger.error(f"Error fetching lap times: {e}")
            raise
    
    async def fetch_all_session_data(self, session_key: str) -> Dict[str, List[Dict[str, Any]]]:
        """Fetch all required data for a session in parallel"""
        try:
            # TODO: Add progress tracking for large data fetches
            position_task = self.get_position_data(session_key)
            lap_times_task = self.get_lap_times(session_key)
            
            # Try to get car data, but continue if it fails
            car_data = []
            try:
                car_data = await self.get_car_data(session_key)
            except Exception as e:
                logger.warning(f"Could not fetch car data, continuing without it: {e}")
            
            position_data, lap_times = await asyncio.gather(
                position_task, lap_times_task
            )
            
            return {
                "position": position_data,
                "car_data": car_data,
                "lap_times": lap_times
            }
        except Exception as e:
            logger.error(f"Error fetching session data: {e}")
            raise


# Singleton instance
_openf1_client: Optional[OpenF1Client] = None


async def get_openf1_client() -> OpenF1Client:
    """Dependency injection for OpenF1 client"""
    global _openf1_client
    if _openf1_client is None:
        _openf1_client = OpenF1Client()
    return _openf1_client 