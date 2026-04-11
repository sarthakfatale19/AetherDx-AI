import os
import sys

# Add the project root to the path so we can import from 'backend'
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from backend.main import app

# Vercel needs 'app' to be exported
# FastAPI works automatically when exported this way
