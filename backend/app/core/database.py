import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BASE_DIR, "factory_ai.db")
SCHEMA_PATH = os.path.join(BASE_DIR, "schema.sql")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    try:
        if os.path.exists(SCHEMA_PATH):
            with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
                conn.executescript(f.read())
                
        conn.execute("""
            CREATE TABLE IF NOT EXISTS workflow_state (
                table_name TEXT NOT NULL,
                id TEXT NOT NULL,
                data_json TEXT NOT NULL,
                updated_at INTEGER NOT NULL,
                PRIMARY KEY (table_name, id)
            )
        """)
        
        conn.execute("""
            CREATE TABLE IF NOT EXISTS ai_configs (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                provider TEXT NOT NULL,
                type TEXT NOT NULL,
                model TEXT NOT NULL,
                base_url TEXT NOT NULL DEFAULT '',
                api_key TEXT NOT NULL DEFAULT '',
                is_active INTEGER NOT NULL DEFAULT 1,
                is_default INTEGER NOT NULL DEFAULT 0,
                extra_config TEXT NOT NULL DEFAULT '{}',
                created_at INTEGER NOT NULL
            )
        """)
        
        conn.execute("""
            CREATE TABLE IF NOT EXISTS activity_logs (
                id TEXT PRIMARY KEY,
                data_json TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
        """)
        
        conn.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                row_id TEXT NOT NULL,
                job_type TEXT NOT NULL,
                payload TEXT,
                status TEXT NOT NULL DEFAULT 'PENDING',
                retry_count INTEGER DEFAULT 0,
                max_retries INTEGER DEFAULT 3,
                error TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
        """)
        
        conn.commit()
        
        # Migration: thêm cột mới nếu chưa tồn tại
        _run_migration(conn, "ALTER TABLE jobs ADD COLUMN payload TEXT;", "payload column to jobs")
        _run_migration(conn, "ALTER TABLE ai_configs ADD COLUMN extra_config TEXT NOT NULL DEFAULT '{}';", "extra_config column to ai_configs")
            
    finally:
        conn.close()


def _run_migration(conn, sql: str, description: str):
    """Chạy migration ALTER TABLE, bỏ qua nếu cột đã tồn tại."""
    try:
        conn.execute(sql)
        conn.commit()
        print(f"[DB Migration] Added {description}.")
    except sqlite3.OperationalError:
        pass
