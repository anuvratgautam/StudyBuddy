# backend/db.py
from sqlmodel import create_engine, SQLModel
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "studybuddy.db")
DB_DIR = os.path.dirname(DB_PATH)
os.makedirs(DB_DIR, exist_ok=True)

# SQLite file-based DB
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)

def init_db():
    # Import models lazily to avoid circular import at startup
    from .models import SQLModel as Models   # noop, ensures models file exists
    SQLModel.metadata.create_all(engine)
