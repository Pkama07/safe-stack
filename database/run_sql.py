#!/usr/bin/env python3
"""Edit the SQL below and run this script."""

import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).parent.parent / "db" / "safestack.db"

# ============================================================================
# EDIT YOUR SQL HERE
# ============================================================================

SQL = """
delete from alerts
"""

# ============================================================================

conn = sqlite3.connect(DATABASE_PATH)
conn.row_factory = sqlite3.Row

cursor = conn.execute(SQL)

if cursor.description:
    rows = cursor.fetchall()
    headers = [d[0] for d in cursor.description]
    print(" | ".join(headers))
    print("-+-".join("-" * len(h) for h in headers))
    for row in rows:
        print(" | ".join(str(v) if v is not None else "NULL" for v in row))
    print(f"\n({len(rows)} rows)")
else:
    conn.commit()
    print(f"OK. Rows affected: {cursor.rowcount}")

conn.close()
