"""
Database connection manager and schema initializer for AegisOS Memory Subsystem
"""
import sqlite3
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Generator, Optional
from backend.app.config import settings_memory

# Thread-local storage for connection reuse per thread
_thread_local = threading.local()

SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"


def get_db_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    """
    Creates and configures a SQLite connection with WAL mode and Row factory.
    """
    path_to_use = str(db_path or settings_memory.db_path)
    
    conn = sqlite3.connect(
        path_to_use,
        timeout=10.0,
        check_same_thread=False
    )
    conn.row_factory = sqlite3.Row
    # Ensure foreign keys & WAL pragmas
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn


@contextmanager
def db_session(db_path: Optional[Path] = None) -> Generator[sqlite3.Connection, None, None]:
    """
    Transactional context manager. Automatically commits on success, rolls back on exception.
    """
    conn = get_db_connection(db_path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db(db_path: Optional[Path] = None) -> None:
    """
    Applies the schema DDL to create tables and indexes.
    """
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    
    with db_session(db_path) as conn:
        conn.executescript(schema_sql)
