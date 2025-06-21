#!/usr/bin/env python3
"""
Data fetching script for F1 Historic Race Replayer
This script can be run independently to fetch and store session data
"""

import asyncio
import sys
import os
import logging

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.data_service import get_data_service
from app.openf1_client import get_openf1_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    """Main function for data fetching"""
    try:
        logger.info("Starting F1 data fetching script...")
        
        # Get the data service
        data_service = await get_data_service()
        
        # Option 1: Initialize demo session (Japan 2022)
        session_key = await data_service.initialize_demo_session()
        if session_key:
            logger.info(f"Successfully initialized demo session: {session_key}")
        else:
            logger.error("Failed to initialize demo session")
            return False
        
        # Option 2: Fetch specific session (uncomment to use)
        # session_key = "9158"  # Example session key
        # success = await data_service.fetch_and_store_session_data(session_key)
        # if success:
        #     logger.info(f"Successfully fetched session: {session_key}")
        # else:
        #     logger.error(f"Failed to fetch session: {session_key}")
        #     return False
        
        # Close the OpenF1 client
        openf1_client = await get_openf1_client()
        await openf1_client.close()
        
        logger.info("Data fetching completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Error in data fetching script: {e}")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    if not success:
        sys.exit(1) 