#!/usr/bin/env python3
"""
F1 Historic Race Replayer FastAPI Backend
Entry point for running the FastAPI server
"""

import os
import uvicorn
from app.main import app

if __name__ == "__main__":
    # Get port from environment variable (for production deployment)
    port = int(os.environ.get("PORT", 8000))
    
    # Run the FastAPI server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,  # Disable auto-reload for production
        log_level="info"
    )

# See PyCharm help at https://www.jetbrains.com/help/pycharm/
