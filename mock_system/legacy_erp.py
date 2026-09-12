# mock_system/legacy_erp.py
import sqlite3
import shutil
import os

DB_PATH = "data/erp_database.db"
SNAPSHOT_PATH = "data/erp_snapshot.db"

class MockERP:
    """Mock legacy ERP accounting system with atomic snapshot and rollback."""
    
    def __init__(self):
        os.makedirs("data", exist_ok=True)
        self._init_db()

    def _init_db(self):
        """Initializes the database schema if not present."""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS invoices (
                id TEXT PRIMARY KEY,
                vendor TEXT,
                amount REAL,
                status TEXT
            )
        """)
        conn.commit()
        conn.close()

    def create_snapshot(self):
        """Takes an atomic snapshot of current database state."""
        if os.path.exists(DB_PATH):
            shutil.copyfile(DB_PATH, SNAPSHOT_PATH)
            return True
        return False

    def rollback(self):
        """Instantly restores database to last valid snapshot if invariant fails."""
        if os.path.exists(SNAPSHOT_PATH):
            shutil.copyfile(SNAPSHOT_PATH, DB_PATH)
            return True
        return False

    def insert_invoice(self, invoice_id: str, vendor: str, amount: float):
        """Inserts an authorized invoice into ERP database."""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO invoices (id, vendor, amount, status) VALUES (?, ?, ?, ?)",
            (invoice_id, vendor, amount, "APPROVED")
        )
        conn.commit()
        conn.close()

    def get_all_invoices(self):
        """Fetches all invoices currently stored in database."""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, vendor, amount, status FROM invoices")
        rows = cursor.fetchall()
        conn.close()
        return rows
