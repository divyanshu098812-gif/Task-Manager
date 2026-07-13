# ==========================================================================
# db_config.py — Robust MySQL Connection with Auto-Setup
# Updated for Cloud Deployment with Environment Variables
# ==========================================================================

import sys
import os
import mysql.connector
from mysql.connector import Error

# ===== DATABASE CREDENTIALS FROM ENVIRONMENT VARIABLES =====
# For local development, these fall back to default values
# For production (Render), set these in Environment Variables
DB_CONFIG = {
    'host':     os.environ.get('DB_HOST', 'localhost'),
    'port':     int(os.environ.get('DB_PORT', 3306)),
    'user':     os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', 'password'),
    'database': os.environ.get('DB_NAME', 'task_manager_db'),
    'charset':  'utf8mb4',
    'collation': 'utf8mb4_unicode_ci',
    'autocommit': False,
    'connection_timeout': 30,  # Increased for cloud
    'raise_on_warnings': False,
}

# ===== SQL TO CREATE TABLES (run once on first startup) =====
SCHEMA_SQL = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id            INT          NOT NULL AUTO_INCREMENT,
        username      VARCHAR(100) NOT NULL,
        email         VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(256) NOT NULL,
        created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,
    """
    CREATE TABLE IF NOT EXISTS tasks (
        id          INT          NOT NULL AUTO_INCREMENT,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        deadline    DATE,
        status      VARCHAR(20)  NOT NULL DEFAULT 'Pending',
        user_id     INT          NOT NULL,
        created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_task_user FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,
    """
    CREATE TABLE IF NOT EXISTS notifications (
        id         INT          NOT NULL AUTO_INCREMENT,
        user_id    INT          NOT NULL,
        type       VARCHAR(50)  NOT NULL DEFAULT 'info',
        title      VARCHAR(255) NOT NULL,
        message    TEXT,
        is_read    TINYINT(1)   NOT NULL DEFAULT 0,
        created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_notif_user FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
]


def get_db_connection(with_database: bool = True) -> mysql.connector.MySQLConnection:
    """
    Return an open MySQL connection.

    Parameters
    ----------
    with_database : bool
        If True (default), connect directly to task_manager_db.
        If False, connect without selecting a database (used during setup).

    Raises
    ------
    mysql.connector.Error
        Propagates the original MySQL error so callers can handle it.
    """
    cfg = dict(DB_CONFIG)
    if not with_database:
        cfg.pop('database', None)

    try:
        conn = mysql.connector.connect(**cfg)
        return conn
    except Error as e:
        # Surface a clear message in the logs
        print(f"[DB ERROR] Could not connect to MySQL: {e}", file=sys.stderr)
        raise


def ensure_database_exists() -> None:
    """Create the database if it doesn't exist."""
    conn = get_db_connection(with_database=False)
    try:
        cur = conn.cursor()
        cur.execute(
            f"CREATE DATABASE IF NOT EXISTS `{DB_CONFIG['database']}` "
            f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        )
        conn.commit()
        print(f"[DB] Database `{DB_CONFIG['database']}` is ready.")
    finally:
        conn.close()


def ensure_tables_exist() -> None:
    """Create all required tables if they don't exist yet."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        for sql in SCHEMA_SQL:
            cur.execute(sql)
        conn.commit()
        print("[DB] All tables verified / created.")
    finally:
        conn.close()


def init_db() -> bool:
    """
    Run full database initialisation:
      1. Verify the server is reachable.
      2. Create the database if missing.
      3. Create tables if missing.

    Returns True on success, False on failure.
    Called automatically when app.py starts.
    """
    try:
        ensure_database_exists()
        ensure_tables_exist()
        print("[DB] Initialisation complete. MySQL is ready.")
        return True
    except Error as e:
        print("=" * 60, file=sys.stderr)
        print("[DB INIT FAILED] Cannot connect to MySQL.", file=sys.stderr)
        print(f"  Error code : {e.errno}", file=sys.stderr)
        print(f"  Message    : {e.msg}", file=sys.stderr)
        print("  Check:", file=sys.stderr)
        print(f"    • MySQL is running  (host={DB_CONFIG['host']}, port={DB_CONFIG['port']})", file=sys.stderr)
        print(f"    • Username          : {DB_CONFIG['user']}", file=sys.stderr)
        print(f"    • Password          : {'(set)' if DB_CONFIG['password'] else '(blank)'}", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        return False
