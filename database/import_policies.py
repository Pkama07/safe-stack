#!/usr/bin/env python3
"""
Policy Import Script
====================
Reads policies from policies.txt and imports them into the database.

Format expected in policies.txt:
    L<level>: <Title>

    Description: <description text>
"""

import sqlite3
import re
from pathlib import Path

DATABASE_PATH = Path(__file__).parent.parent / "db" / "safestack.db"
POLICIES_FILE = Path(__file__).parent.parent / "policies.txt"


def get_connection():
    """Create a database connection with foreign keys enabled."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def parse_policies(file_path):
    """Parse policies from the text file.

    Returns a list of (level, title, description) tuples.
    """
    with open(file_path, "r") as f:
        content = f.read()

    policies = []

    # Split by the L<number>: pattern to find each policy block
    # Pattern: L followed by digits, colon, then title
    pattern = r"L(\d+):\s*(.+?)\n\nDescription:\s*(.+?)(?=\n\nL\d+:|\Z)"

    matches = re.findall(pattern, content, re.DOTALL)

    for level_str, title, description in matches:
        level = int(level_str)
        title = title.strip()
        description = description.strip()
        policies.append((level, title, description))

    return policies


def import_policies(conn, policies, clear_existing=False):
    """Import policies into the database.

    Args:
        conn: Database connection
        policies: List of (level, title, description) tuples
        clear_existing: If True, delete all existing policies first
    """
    cursor = conn.cursor()

    if clear_existing:
        # Need to delete alerts first due to foreign key constraint
        cursor.execute("DELETE FROM alerts")
        cursor.execute("DELETE FROM policies")
        print("  ✓ Cleared existing policies and alerts")

    inserted = 0
    skipped = 0

    for level, title, description in policies:
        # Check if policy with same title already exists
        existing = cursor.execute(
            "SELECT id FROM policies WHERE title = ?", (title,)
        ).fetchone()

        if existing:
            skipped += 1
            continue

        cursor.execute(
            "INSERT INTO policies (title, level, description) VALUES (?, ?, ?)",
            (title, level, description),
        )
        inserted += 1

    conn.commit()
    return inserted, skipped


def main():
    print("=" * 60)
    print("Policy Import")
    print("=" * 60)
    print(f"\nPolicies file: {POLICIES_FILE}")
    print(f"Database: {DATABASE_PATH}\n")

    # Check if policies file exists
    if not POLICIES_FILE.exists():
        print(f"✗ ERROR: Policies file not found at {POLICIES_FILE}")
        return

    # Parse policies from file
    print("Parsing policies from file...")
    policies = parse_policies(POLICIES_FILE)
    print(f"  ✓ Found {len(policies)} policies\n")

    # Show preview
    print("Preview of parsed policies:")
    print("-" * 60)
    for i, (level, title, desc) in enumerate(policies[:3]):
        print(f"  L{level}: {title}")
        print(f"        {desc[:60]}...")
        print()
    if len(policies) > 3:
        print(f"  ... and {len(policies) - 3} more\n")

    # Connect to database
    print("Connecting to database...")
    try:
        conn = get_connection()
        print("  ✓ Connected\n")
    except Exception as e:
        print(f"  ✗ ERROR: Could not connect to database: {e}")
        print(f"    Make sure to run setup_database.py first.")
        return

    # Import policies (clear existing to replace with file contents)
    print("Importing policies (replacing existing)...")
    inserted, skipped = import_policies(conn, policies, clear_existing=True)
    print(f"  ✓ Inserted {inserted} policies")
    if skipped:
        print(f"  ⊘ Skipped {skipped} (already exist)")

    # Show final count
    total = conn.execute("SELECT COUNT(*) FROM policies").fetchone()[0]
    print(f"\nTotal policies in database: {total}")

    # Show breakdown by level
    print("\nPolicies by level:")
    rows = conn.execute(
        "SELECT level, COUNT(*) as count FROM policies GROUP BY level ORDER BY level"
    ).fetchall()
    for row in rows:
        print(f"  L{row['level']}: {row['count']} policies")

    conn.close()
    print("\n✓ Import complete!\n")


if __name__ == "__main__":
    main()
