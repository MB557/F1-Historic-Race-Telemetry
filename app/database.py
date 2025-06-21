import sqlite3
import json
import asyncio
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager
import logging
import threading
from datetime import datetime

logger = logging.getLogger(__name__)


class DatabaseManager:
    """SQLite database manager for F1 telemetry data"""
    
    def __init__(self, db_path: str = "f1_data.db"):
        self.db_path = db_path
        self._local = threading.local()
        self._init_db()
    
    def _get_connection(self):
        """Get thread-local database connection"""
        if not hasattr(self._local, 'conn'):
            self._local.conn = sqlite3.connect(self.db_path)
            self._local.conn.row_factory = sqlite3.Row
        return self._local.conn
    
    def _init_db(self):
        """Initialize database tables"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_key TEXT PRIMARY KEY,
                session_name TEXT,
                session_type TEXT,
                date_start TEXT,
                date_end TEXT,
                country_name TEXT,
                year INTEGER,
                total_laps INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Position data table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS position_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_key TEXT,
                driver_number INTEGER,
                timestamp REAL,
                x REAL,
                y REAL,
                z REAL,
                FOREIGN KEY (session_key) REFERENCES sessions (session_key)
            )
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_session_timestamp 
            ON position_data (session_key, timestamp)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_driver_timestamp 
            ON position_data (driver_number, timestamp)
        """)
        
        # Car data table  
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS car_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_key TEXT,
                driver_number INTEGER,
                timestamp REAL,
                speed REAL,
                gear INTEGER,
                throttle REAL,
                brake REAL,
                rpm INTEGER,
                drs INTEGER,
                FOREIGN KEY (session_key) REFERENCES sessions (session_key)
            )
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_car_session_timestamp 
            ON car_data (session_key, timestamp)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_car_driver_timestamp 
            ON car_data (driver_number, timestamp)
        """)
        
        # Lap times table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS lap_times (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_key TEXT,
                driver_number INTEGER,
                lap_number INTEGER,
                lap_time REAL,
                sector_1_time REAL,
                sector_2_time REAL,
                sector_3_time REAL,
                pit_out_time REAL,
                pit_in_time REAL,
                FOREIGN KEY (session_key) REFERENCES sessions (session_key)
            )
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_lap_session 
            ON lap_times (session_key, lap_number)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_lap_driver 
            ON lap_times (driver_number, lap_number)
        """)
        
        conn.commit()
    
    async def store_session(self, session_key: str, session_data: Dict[str, Any]):
        """Store session metadata"""
        def _store():
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT OR REPLACE INTO sessions 
                (session_key, session_name, session_type, date_start, date_end, country_name, year)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                session_key,
                session_data.get("session_name", ""),
                session_data.get("session_type", ""),
                session_data.get("date_start", ""),
                session_data.get("date_end", ""),
                session_data.get("country_name", ""),
                session_data.get("year", 2022)
            ))
            conn.commit()
        
        await asyncio.get_event_loop().run_in_executor(None, _store)
    
    async def store_telemetry_data(self, session_key: str, data: Dict[str, List[Dict[str, Any]]]):
        """Store all telemetry data for a session"""
        def _store():
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Store position data
            if "position" in data:
                position_records = []
                for record in data["position"]:
                    position_records.append((
                        session_key,
                        record.get("driver_number"),
                        record.get("date"),  # TODO: Convert to Unix timestamp
                        record.get("position", 0),  # Race position (1st, 2nd, etc.)
                        0.0,  # Placeholder for y coordinate
                        0.0   # Placeholder for z coordinate
                    ))
                
                cursor.executemany("""
                    INSERT INTO position_data 
                    (session_key, driver_number, timestamp, x, y, z)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, position_records)
            
            # Store car data
            if "car_data" in data:
                car_records = []
                for record in data["car_data"]:
                    car_records.append((
                        session_key,
                        record.get("driver_number"),
                        record.get("date"),  # TODO: Convert to Unix timestamp
                        record.get("speed"),
                        record.get("n_gear"),
                        record.get("throttle"),
                        record.get("brake"),
                        record.get("rpm"),
                        record.get("drs")
                    ))
                
                cursor.executemany("""
                    INSERT INTO car_data 
                    (session_key, driver_number, timestamp, speed, gear, throttle, brake, rpm, drs)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, car_records)
            
            # Store lap times
            if "lap_times" in data:
                lap_records = []
                for record in data["lap_times"]:
                    lap_records.append((
                        session_key,
                        record.get("driver_number"),
                        record.get("lap_number"),
                        record.get("lap_duration"),
                        record.get("sector_1_duration"),
                        record.get("sector_2_duration"),
                        record.get("sector_3_duration"),
                        record.get("pit_out_time"),
                        record.get("pit_in_time")
                    ))
                
                cursor.executemany("""
                    INSERT INTO lap_times 
                    (session_key, driver_number, lap_number, lap_time, sector_1_time, 
                     sector_2_time, sector_3_time, pit_out_time, pit_in_time)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, lap_records)
            
            conn.commit()
            logger.info(f"Stored telemetry data for session {session_key}")
        
        await asyncio.get_event_loop().run_in_executor(None, _store)
    
    async def get_car_states_at_timestamp(self, session_key: str, timestamp: float) -> List[Dict[str, Any]]:
        """Get all car states at a specific timestamp (with interpolation tolerance)"""
        def _fetch():
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # For timestamps near the end of race, use fallback immediately
            # Check if this is likely end-of-race (within last 10 minutes of known data)
            cursor.execute("SELECT MAX(timestamp) FROM position_data WHERE session_key = ?", (session_key,))
            max_timestamp = cursor.fetchone()[0]
            
            if max_timestamp and timestamp > (max_timestamp - 600):  # Within 10 minutes of last data
                # Skip normal tolerance search and go directly to fallback for race end
                pass
            else:
                # First, try to get data close to the requested timestamp
                tolerances = [1.0, 10.0, 60.0, 300.0, 1800.0]  # 1s, 10s, 1min, 5min, 30min
                
                for tolerance in tolerances:
                    query = """
                        SELECT DISTINCT 
                            p.driver_number,
                            p.x, p.y,
                            c.speed, c.gear, c.throttle, c.brake,
                            p.timestamp
                        FROM position_data p
                        LEFT JOIN car_data c ON p.driver_number = c.driver_number 
                            AND ABS(p.timestamp - c.timestamp) < 1.0
                        WHERE p.session_key = ? 
                            AND ABS(p.timestamp - ?) < ?
                        ORDER BY p.driver_number, ABS(p.timestamp - ?)
                    """
                    
                    cursor.execute(query, (session_key, timestamp, tolerance, timestamp))
                    
                    # Group by driver and take the closest timestamp
                    results = {}
                    for row in cursor.fetchall():
                        driver_num = row['driver_number']
                        if driver_num not in results:
                            results[driver_num] = dict(row)
                    
                    # If we found enough data (at least 10 cars), check if we have race leaders
                    if len(results) >= 10:
                        # Check if we have drivers in positions 1-3 (race leaders)
                        has_leaders = any(car.get('x', 999) <= 3 for car in results.values())
                        if has_leaders:
                            return list(results.values())
                        # If no race leaders, continue to next tolerance or fallback
            
            # If we still don't have enough data, get the most recent position for each driver
            # This helps show race winners even when they don't have data at the end
            fallback_query = """
                WITH latest_positions AS (
                    SELECT 
                        driver_number,
                        x, y,
                        timestamp,
                        ROW_NUMBER() OVER (PARTITION BY driver_number ORDER BY timestamp DESC) as rn
                    FROM position_data 
                    WHERE session_key = ? AND timestamp <= ?
                )
                SELECT DISTINCT 
                    lp.driver_number,
                    lp.x, lp.y,
                    c.speed, c.gear, c.throttle, c.brake,
                    lp.timestamp
                FROM latest_positions lp
                LEFT JOIN car_data c ON lp.driver_number = c.driver_number 
                    AND ABS(lp.timestamp - c.timestamp) < 60.0
                WHERE lp.rn = 1
                ORDER BY lp.x
            """
            
            cursor.execute(fallback_query, (session_key, timestamp))
            
            results = []
            for row in cursor.fetchall():
                results.append(dict(row))
            
            logger.info(f"Fallback query returned {len(results)} cars for timestamp {timestamp}")
            if results:
                # Log first few positions for debugging
                sorted_results = sorted(results, key=lambda x: x.get('x', 999))
                for i, car in enumerate(sorted_results[:5]):
                    logger.info(f"  P{car.get('x', '?')}: Driver #{car.get('driver_number', '?')}")
            
            return results
        
        return await asyncio.get_event_loop().run_in_executor(None, _fetch)
    
    async def get_timeline(self, session_key: str) -> Dict[str, Any]:
        """Get timeline data for a session"""
        def _fetch():
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Get session info
            cursor.execute("SELECT * FROM sessions WHERE session_key = ?", (session_key,))
            session = cursor.fetchone()
            
            # Get lap times
            cursor.execute("""
                SELECT driver_number, lap_number, lap_time, 
                       sector_1_time, sector_2_time, sector_3_time,
                       pit_in_time, pit_out_time
                FROM lap_times 
                WHERE session_key = ? 
                ORDER BY lap_number, driver_number
            """, (session_key,))
            
            laps = cursor.fetchall()
            
            # Get total laps
            cursor.execute("SELECT MAX(lap_number) as max_lap FROM lap_times WHERE session_key = ?", (session_key,))
            max_lap_result = cursor.fetchone()
            total_laps = max_lap_result['max_lap'] if max_lap_result and max_lap_result['max_lap'] else 0
            
            return {
                "session": dict(session) if session else {},
                "laps": [dict(lap) for lap in laps],
                "total_laps": total_laps
            }
        
        return await asyncio.get_event_loop().run_in_executor(None, _fetch)
    
    async def session_exists(self, session_key: str) -> bool:
        """Check if session data exists in database"""
        def _check():
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM sessions WHERE session_key = ?", (session_key,))
            return cursor.fetchone() is not None
        
        return await asyncio.get_event_loop().run_in_executor(None, _check)


# Singleton instance
_db_manager: Optional[DatabaseManager] = None


async def get_database_manager() -> DatabaseManager:
    """Dependency injection for database manager"""
    global _db_manager
    if _db_manager is None:
        _db_manager = DatabaseManager()
    return _db_manager 