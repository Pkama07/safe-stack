#!/usr/bin/env python3
"""
Policy Import Script
====================
Imports policies from policies_latest.json into the database.
"""

import json
import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).parent.parent / "db" / "safestack.db"
POLICIES_JSON = Path(__file__).parent.parent / "policies_latest.json"


def get_connection():
    """Create a database connection with foreign keys enabled."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def import_from_json(clear_existing=True):
    """
    Import policies from policies_latest.json into database.

    Args:
        clear_existing: If True, delete all existing policies first
    """
    # Load JSON policies
    with open(POLICIES_JSON, "r") as f:
        data = json.load(f)

    policies = data.get("policies", [])
    if not policies:
        print("No policies found in JSON file")
        return

    conn = get_connection()
    cursor = conn.cursor()

    if clear_existing:
        # Delete alerts first due to foreign key constraint
        cursor.execute("DELETE FROM alerts")
        cursor.execute("DELETE FROM policies")
        print(f"  ✓ Cleared existing policies and alerts")

    inserted = 0
    for policy in policies:
        cursor.execute(
            "INSERT INTO policies (title, level, description, policy_enum) VALUES (?, ?, ?, ?)",
            (policy["title"], policy["level"], policy["description"], policy["id"]),
        )
        inserted += 1

    conn.commit()
    conn.close()

    return inserted


def main():
    print("=" * 60)
    print("Policy Import from JSON")
    print("=" * 60)
    print(f"\nJSON file: {POLICIES_JSON}")
    print(f"Database: {DATABASE_PATH}\n")

    # Check if JSON file exists
    if not POLICIES_JSON.exists():
        print(f"✗ ERROR: JSON file not found at {POLICIES_JSON}")
        return

    # Load and preview
    with open(POLICIES_JSON, "r") as f:
        data = json.load(f)

    policies = data.get("policies", [])
    print(f"Found {len(policies)} policies in JSON (version {data.get('version', 'unknown')})\n")

    print("Preview:")
    print("-" * 60)
    for policy in policies[:3]:
        print(f"  [{policy['id']}] {policy['title']} (Level {policy['level']})")
    if len(policies) > 3:
        print(f"  ... and {len(policies) - 3} more\n")

    # Import
    print("Importing policies (replacing existing)...")
    inserted = import_from_json(clear_existing=True)
    print(f"  ✓ Imported {inserted} policies")

    # Show breakdown by level
    conn = get_connection()
    print("\nPolicies by level:")
    rows = conn.execute(
        "SELECT level, COUNT(*) as count FROM policies GROUP BY level ORDER BY level"
    ).fetchall()
    for row in rows:
        print(f"  Level {row['level']}: {row['count']} policies")

    conn.close()
    print("\n✓ Import complete!\n")


if __name__ == "__main__":
    main()
