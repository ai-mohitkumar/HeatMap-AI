"""
Vercel Serverless ASGI Function Entrypoint
Exposes the FastAPI application to Vercel's Python runtime.
"""

import sys
import os

# Ensure the repository root is in sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.main import app
