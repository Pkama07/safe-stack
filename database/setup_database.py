#!/usr/bin/env python3
"""
SQLite Database Setup & Migration Script
=========================================
Creates a local SQLite database with schema migrations and sample data.
"""

import sqlite3
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
import random

DATABASE_DIR = Path(__file__).parent.parent / "db"
DATABASE_PATH = DATABASE_DIR / "safestack.db"

# ============================================================================
# MIGRATIONS
# ============================================================================
# Each migration is a tuple of (version, description, sql_statements)
# Migrations run in order and are tracked in the _migrations table.

MIGRATIONS = [
    (
        1,
        "Create users table",
        """
        CREATE TABLE users (
            email TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """,
    ),
    (
        2,
        "Create policies table",
        """
        CREATE TABLE policies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            level INTEGER NOT NULL,
            description TEXT
        );
        CREATE INDEX idx_policies_level ON policies(level);
    """,
    ),
    (
        3,
        "Create alerts table",
        """
        CREATE TABLE alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            policy_id INTEGER NOT NULL,
            image_urls TEXT,
            explanation TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
        );
        CREATE INDEX idx_alerts_policy_id ON alerts(policy_id);
        CREATE INDEX idx_alerts_timestamp ON alerts(timestamp);
    """,
    ),
]


def ensure_database_dir():
    """Ensure the database directory exists."""
    if not DATABASE_DIR.exists():
        print(f"Creating database directory: {DATABASE_DIR}")
        DATABASE_DIR.mkdir(parents=True, exist_ok=True)


def get_connection():
    """Create a database connection with foreign keys enabled."""
    ensure_database_dir()
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Access columns by name
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_migration_table(conn):
    """Create the migrations tracking table if it doesn't exist."""
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS _migrations (
            version INTEGER PRIMARY KEY,
            description TEXT,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """
    )
    conn.commit()


def get_current_version(conn):
    """Get the current migration version."""
    cursor = conn.execute("SELECT MAX(version) FROM _migrations")
    result = cursor.fetchone()[0]
    return result or 0


def run_migrations(conn):
    """Run all pending migrations."""
    init_migration_table(conn)
    current_version = get_current_version(conn)

    pending = [(v, d, s) for v, d, s in MIGRATIONS if v > current_version]

    if not pending:
        print(f"✓ Database is up to date (version {current_version})")
        return

    print(f"Current version: {current_version}")
    print(f"Pending migrations: {len(pending)}\n")

    for version, description, sql in pending:
        print(f"  Running migration {version}: {description}...")
        conn.executescript(sql)
        conn.execute(
            "INSERT INTO _migrations (version, description) VALUES (?, ?)",
            (version, description),
        )
        conn.commit()
        print(f"  ✓ Migration {version} complete")

    print(f"\n✓ All migrations complete. Now at version {get_current_version(conn)}")


# ============================================================================
# SEED DATA
# ============================================================================

SAMPLE_USERS = [
    ("alice@example.com", "Alice Johnson"),
    ("bob@example.com", "Bob Smith"),
    ("carol@example.com", "Carol Williams"),
    ("dave@example.com", "Dave Brown"),
    ("eve@example.com", "Eve Davis"),
]

SAMPLE_POLICIES = [
    (
        "No Smoking",
        1,
        "Smoking is prohibited in all indoor areas and within 25 feet of entrances.",
    ),
    (
        "Hard Hat Required",
        2,
        "Hard hats must be worn in all construction and warehouse zones.",
    ),
    (
        "No Unauthorized Access",
        3,
        "Restricted areas require badge access and supervisor approval.",
    ),
    ("Fire Exit Clear", 2, "Fire exits must remain unobstructed at all times."),
    (
        "PPE Required",
        2,
        "Personal protective equipment must be worn in designated areas.",
    ),
    (
        "Speed Limit 10 MPH",
        1,
        "Vehicle speed must not exceed 10 MPH in facility areas.",
    ),
]

SAMPLE_ALERTS = [
    # (policy_index, image_urls, explanation)
    (
        0,
        ["https://example.com/img/smoking_001.jpg"],
        "Individual detected smoking near entrance at Building A.",
    ),
    (
        1,
        [
            "https://example.com/img/hardhat_001.jpg",
            "https://example.com/img/hardhat_002.jpg",
        ],
        "Worker in warehouse zone without required hard hat.",
    ),
    (
        2,
        ["https://example.com/img/access_001.jpg"],
        "Unauthorized individual attempted to enter server room.",
    ),
    (
        3,
        ["https://example.com/img/fireexit_001.jpg"],
        "Boxes stacked in front of fire exit on floor 2.",
    ),
    (
        1,
        ["https://example.com/img/hardhat_003.jpg"],
        "Multiple workers in construction area without hard hats.",
    ),
    (
        4,
        ["https://example.com/img/ppe_001.jpg"],
        "Employee in chemical storage without safety goggles.",
    ),
    (
        5,
        ["https://example.com/img/speed_001.jpg"],
        "Forklift exceeding speed limit in loading dock area.",
    ),
    (
        0,
        ["https://example.com/img/smoking_002.jpg"],
        "Smoking detected in break room area.",
    ),
]


def seed_data(conn):
    """Insert sample data into the database."""
    cursor = conn.cursor()

    # Check if data already exists
    existing = cursor.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if existing > 0:
        print(f"✓ Database already has {existing} users. Skipping seed.")
        return

    print("Seeding database with sample data...")

    # Insert users
    for email, name in SAMPLE_USERS:
        cursor.execute(
            "INSERT INTO users (email, name) VALUES (?, ?)",
            (email, name),
        )
    print(f"  ✓ Added {len(SAMPLE_USERS)} users")

    # Insert policies
    for title, level, description in SAMPLE_POLICIES:
        cursor.execute(
            "INSERT INTO policies (title, level, description) VALUES (?, ?, ?)",
            (title, level, description),
        )
    print(f"  ✓ Added {len(SAMPLE_POLICIES)} policies")

    # Get policy IDs for alerts
    policy_ids = [
        row[0]
        for row in cursor.execute("SELECT id FROM policies ORDER BY id").fetchall()
    ]

    # Insert alerts with timestamps spread over the past week
    now = datetime.now()
    for i, (policy_idx, image_urls, explanation) in enumerate(SAMPLE_ALERTS):
        policy_id = policy_ids[policy_idx]
        # Spread alerts over the past 7 days
        hours_ago = random.randint(1, 168)  # 1 hour to 7 days
        timestamp = now - timedelta(hours=hours_ago)

        cursor.execute(
            "INSERT INTO alerts (policy_id, image_urls, explanation, timestamp) VALUES (?, ?, ?, ?)",
            (policy_id, json.dumps(image_urls), explanation, timestamp.isoformat()),
        )
    print(f"  ✓ Added {len(SAMPLE_ALERTS)} alerts")

    conn.commit()
    print("\n✓ Seed complete!")


# ============================================================================
# QUERY HELPERS
# ============================================================================


def print_table(rows, headers=None):
    """Pretty print query results as a table."""
    if not rows:
        print("  (no results)")
        return

    if headers is None:
        headers = (
            rows[0].keys()
            if hasattr(rows[0], "keys")
            else [f"col{i}" for i in range(len(rows[0]))]
        )

    # Convert rows to lists
    data = [
        [str(row[h]) if row[h] is not None else "NULL" for h in headers] for row in rows
    ]

    # Calculate column widths (cap at 50 for readability)
    widths = [
        min(50, max(len(h), max(len(row[i]) for row in data)))
        for i, h in enumerate(headers)
    ]

    # Print header
    header_row = " | ".join(h.ljust(widths[i]) for i, h in enumerate(headers))
    print(f"  {header_row}")
    print(f"  {'-+-'.join('-' * w for w in widths)}")

    # Print rows (truncate long values)
    for row in data:
        truncated = [
            val[: widths[i]] if len(val) > widths[i] else val
            for i, val in enumerate(row)
        ]
        print(
            f"  {' | '.join(val.ljust(widths[i]) for i, val in enumerate(truncated))}"
        )


def demo_queries(conn):
    """Run some example queries to demonstrate the database."""
    print("\n" + "=" * 60)
    print("EXAMPLE QUERIES")
    print("=" * 60)

    # Query 1: All users
    print("\n1. All users:")
    rows = conn.execute("SELECT email, name, created_at FROM users").fetchall()
    print_table(rows)

    # Query 2: All policies by severity level
    print("\n2. Policies by severity level:")
    rows = conn.execute(
        """
        SELECT id, title, level, description
        FROM policies
        ORDER BY level DESC, title
    """
    ).fetchall()
    print_table(rows)

    # Query 3: Recent alerts with policy info
    print("\n3. Recent alerts with policy details:")
    rows = conn.execute(
        """
        SELECT a.id, p.title as policy, p.level, 
               SUBSTR(a.explanation, 1, 40) as explanation, a.timestamp
        FROM alerts a
        JOIN policies p ON a.policy_id = p.id
        ORDER BY a.timestamp DESC
        LIMIT 5
    """
    ).fetchall()
    print_table(rows)

    # Query 4: Alert counts by policy
    print("\n4. Alert counts by policy:")
    rows = conn.execute(
        """
        SELECT p.title, p.level, COUNT(a.id) as alert_count
        FROM policies p
        LEFT JOIN alerts a ON p.id = a.policy_id
        GROUP BY p.id
        ORDER BY alert_count DESC
    """
    ).fetchall()
    print_table(rows)

    # Query 5: High severity alerts (level >= 2)
    print("\n5. High severity alerts (policy level >= 2):")
    rows = conn.execute(
        """
        SELECT a.id, p.title as policy, p.level, a.timestamp
        FROM alerts a
        JOIN policies p ON a.policy_id = p.id
        WHERE p.level >= 2
        ORDER BY p.level DESC, a.timestamp DESC
    """
    ).fetchall()
    print_table(rows)


# ============================================================================
# MAIN
# ============================================================================


def main():
    print("=" * 60)
    print("SQLite Database Setup")
    print("=" * 60)
    print(f"\nDatabase file: {DATABASE_PATH}\n")

    # Create/connect to database
    conn = get_connection()

    # Run migrations
    run_migrations(conn)

    # Seed data
    print()
    seed_data(conn)

    # Show example queries
    demo_queries(conn)

    # Show how to connect manually
    print("\n" + "=" * 60)
    print("HOW TO QUERY THE DATABASE")
    print("=" * 60)
    print(
        f"""
You can now query the database using:

1. Python:
   >>> import sqlite3
   >>> conn = sqlite3.connect('{DATABASE_PATH}')
   >>> conn.execute("SELECT * FROM users").fetchall()

2. Command line (if sqlite3 is installed):
   $ sqlite3 {DATABASE_PATH}
   sqlite> .tables
   sqlite> SELECT * FROM policies;
   sqlite> SELECT * FROM alerts;
   sqlite> .quit

3. VS Code / Cursor:
   Install the "SQLite Viewer" extension and open {DATABASE_PATH.name}
"""
    )

    conn.close()
    print("✓ Setup complete!\n")


if __name__ == "__main__":
    main()
