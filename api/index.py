import sys
import os

# Make the project root importable
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import app

# Vercel expects a callable named 'app'
