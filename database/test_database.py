#!/usr/bin/env python3
"""
Database Read/Write Verification Script
========================================
Proves that data written to the SQLite database persists correctly.
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path

DATABASE_DIR = Path("../db")
DATABASE_PATH = DATABASE_DIR / "safestack.db"


def get_connection():
    """Create a database connection with foreign keys enabled."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def main():
    print("=" * 60)
    print("Database Read/Write Verification")
    print("=" * 60)
    print(f"\nDatabase: {DATABASE_PATH}\n")

    # Generate unique identifiers using timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    test_email = f"test_{timestamp}@example.com"
    test_policy_title = f"Test Policy {timestamp}"

    # =========================================================================
    # STEP 1: Connect and write data
    # =========================================================================
    print("-" * 60)
    print("STEP 1: Writing data to database")
    print("-" * 60)

    conn = get_connection()
    cursor = conn.cursor()

    # Insert a new user
    print(f"\n  Inserting user: {test_email}")
    cursor.execute(
        "INSERT INTO users (email, name) VALUES (?, ?)",
        (test_email, "Test User"),
    )
    print(f"  ✓ User created with email: {test_email}")

    # Insert a new policy
    print(f"\n  Inserting policy: {test_policy_title}")
    cursor.execute(
        "INSERT INTO policies (title, level, description) VALUES (?, ?, ?)",
        (test_policy_title, 2, "This is a test policy for verification."),
    )
    policy_id = cursor.lastrowid
    print(f"  ✓ Policy created with ID: {policy_id}")

    # Insert a new alert for that policy
    test_image_urls = [
        "https://example.com/test_image_1.jpg",
        "https://example.com/test_image_2.jpg",
    ]
    print(f"\n  Inserting alert for policy ID: {policy_id}")
    cursor.execute(
        "INSERT INTO alerts (policy_id, image_urls, explanation) VALUES (?, ?, ?)",
        (policy_id, json.dumps(test_image_urls), "Test alert explanation."),
    )
    alert_id = cursor.lastrowid
    print(f"  ✓ Alert created with ID: {alert_id}")

    # Commit the transaction
    conn.commit()
    print("\n  ✓ Changes committed to database")

    # =========================================================================
    # STEP 2: Read back immediately (same connection)
    # =========================================================================
    print("\n" + "-" * 60)
    print("STEP 2: Reading data back (same connection)")
    print("-" * 60)

    # Read the user
    user = cursor.execute(
        "SELECT * FROM users WHERE email = ?", (test_email,)
    ).fetchone()

    if user:
        print(f"\n  ✓ User found:")
        print(f"      Email:      {user['email']}")
        print(f"      Name:       {user['name']}")
        print(f"      Created:    {user['created_at']}")
    else:
        print("\n  ✗ ERROR: User not found!")
        return

    # Read the policy
    policy = cursor.execute(
        "SELECT * FROM policies WHERE id = ?", (policy_id,)
    ).fetchone()

    if policy:
        print(f"\n  ✓ Policy found:")
        print(f"      ID:          {policy['id']}")
        print(f"      Title:       {policy['title']}")
        print(f"      Level:       {policy['level']}")
        print(f"      Description: {policy['description']}")
    else:
        print("\n  ✗ ERROR: Policy not found!")
        return

    # Read the alert
    alert = cursor.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()

    if alert:
        print(f"\n  ✓ Alert found:")
        print(f"      ID:          {alert['id']}")
        print(f"      Policy ID:   {alert['policy_id']}")
        print(f"      Image URLs:  {json.loads(alert['image_urls'])}")
        print(f"      Explanation: {alert['explanation']}")
        print(f"      Timestamp:   {alert['timestamp']}")
    else:
        print("\n  ✗ ERROR: Alert not found!")
        return

    # =========================================================================
    # STEP 3: Close connection
    # =========================================================================
    print("\n" + "-" * 60)
    print("STEP 3: Closing database connection")
    print("-" * 60)

    conn.close()
    print("\n  ✓ Connection closed")

    # =========================================================================
    # STEP 4: Reopen connection and verify persistence
    # =========================================================================
    print("\n" + "-" * 60)
    print("STEP 4: Reopening connection and verifying persistence")
    print("-" * 60)

    conn2 = get_connection()
    cursor2 = conn2.cursor()
    print("\n  ✓ New connection established")

    # Read the user again
    user2 = cursor2.execute(
        "SELECT * FROM users WHERE email = ?", (test_email,)
    ).fetchone()

    if user2 and user2["email"] == test_email:
        print(f"\n  ✓ User PERSISTED after reconnect:")
        print(f"      Email: {user2['email']}")
        print(f"      Name:  {user2['name']}")
    else:
        print("\n  ✗ ERROR: User not found after reconnect!")
        conn2.close()
        return

    # Read the policy again
    policy2 = cursor2.execute(
        "SELECT * FROM policies WHERE id = ?", (policy_id,)
    ).fetchone()

    if policy2 and policy2["title"] == test_policy_title:
        print(f"\n  ✓ Policy PERSISTED after reconnect:")
        print(f"      Title: {policy2['title']}")
        print(f"      Level: {policy2['level']}")
    else:
        print("\n  ✗ ERROR: Policy not found after reconnect!")
        conn2.close()
        return

    # Read the alert again
    alert2 = cursor2.execute(
        "SELECT * FROM alerts WHERE id = ?", (alert_id,)
    ).fetchone()

    if alert2:
        print(f"\n  ✓ Alert PERSISTED after reconnect:")
        print(f"      ID:          {alert2['id']}")
        print(f"      Explanation: {alert2['explanation']}")
    else:
        print("\n  ✗ ERROR: Alert not found after reconnect!")
        conn2.close()
        return

    # =========================================================================
    # STEP 5: Show total counts to prove data accumulated
    # =========================================================================
    print("\n" + "-" * 60)
    print("STEP 5: Database statistics")
    print("-" * 60)

    user_count = cursor2.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    policy_count = cursor2.execute("SELECT COUNT(*) FROM policies").fetchone()[0]
    alert_count = cursor2.execute("SELECT COUNT(*) FROM alerts").fetchone()[0]

    print(f"\n  Total users in database:    {user_count}")
    print(f"  Total policies in database: {policy_count}")
    print(f"  Total alerts in database:   {alert_count}")

    conn2.close()

    # =========================================================================
    # SUCCESS
    # =========================================================================
    print("\n" + "=" * 60)
    print("✓ SUCCESS: Database read/write verification complete!")
    print("=" * 60)
    print(
        f"""
Data was:
  1. Written to the database (user, policy, alert)
  2. Read back successfully (same connection)
  3. Persisted after closing the connection
  4. Retrieved successfully from a new connection

The SQLite database at {DATABASE_PATH} is working correctly.
"""
    )


if __name__ == "__main__":
    main()
