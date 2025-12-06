#!/usr/bin/env python3
"""
View Table Contents
===================
A simple script to view the contents of any table in the SafeStack database.

Usage:
    python view_table.py <table_name>
    python view_table.py alerts
    python view_table.py policies
    python view_table.py users
    python view_table.py videos

To see all available tables:
    python view_table.py --list
"""

import sqlite3
import sys
import json
from pathlib import Path

DATABASE_DIR = Path(__file__).parent.parent / "db"
DATABASE_PATH = DATABASE_DIR / "safestack.db"


def get_connection():
    """Create a database connection."""
    if not DATABASE_PATH.exists():
        print(f"Error: Database not found at {DATABASE_PATH}")
        print("Run setup_database.py first to create the database.")
        sys.exit(1)
    
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def list_tables(conn):
    """List all tables in the database."""
    cursor = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    tables = [row[0] for row in cursor.fetchall()]
    return tables


def get_table_schema(conn, table_name):
    """Get the schema (column info) for a table."""
    cursor = conn.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    return [(col["name"], col["type"]) for col in columns]


def print_table_contents(conn, table_name):
    """Print all contents of a table."""
    # Verify table exists
    tables = list_tables(conn)
    if table_name not in tables:
        print(f"Error: Table '{table_name}' not found.")
        print(f"Available tables: {', '.join(tables)}")
        sys.exit(1)
    
    # Get schema
    schema = get_table_schema(conn, table_name)
    columns = [col[0] for col in schema]
    
    # Get row count
    count = conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
    
    print("=" * 80)
    print(f"TABLE: {table_name}")
    print(f"ROWS: {count}")
    print("=" * 80)
    
    # Print schema
    print("\nSchema:")
    for col_name, col_type in schema:
        print(f"  - {col_name}: {col_type}")
    
    print("\n" + "-" * 80)
    print("Contents:")
    print("-" * 80)
    
    if count == 0:
        print("  (empty table)")
        return
    
    # Fetch all rows
    cursor = conn.execute(f"SELECT * FROM {table_name}")
    rows = cursor.fetchall()
    
    # Print each row
    for i, row in enumerate(rows, 1):
        print(f"\n[Row {i}]")
        for col in columns:
            value = row[col]
            # Pretty print JSON fields
            if isinstance(value, str) and value.startswith('['):
                try:
                    parsed = json.loads(value)
                    value = json.dumps(parsed, indent=4)
                except json.JSONDecodeError:
                    pass
            print(f"  {col}: {value}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    arg = sys.argv[1]
    conn = get_connection()
    
    if arg == "--list":
        tables = list_tables(conn)
        print("Available tables:")
        for table in tables:
            count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            print(f"  - {table} ({count} rows)")
    else:
        print_table_contents(conn, arg)
    
    conn.close()


if __name__ == "__main__":
    main()

