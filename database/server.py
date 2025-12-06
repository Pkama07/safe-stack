#!/usr/bin/env python3
"""
Database API Server
===================
A FastAPI server that provides REST endpoints to access the SQLite database.

Run with: uvicorn server:app --reload
Or: python server.py
"""

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DATABASE_PATH = Path(__file__).parent.parent / "db" / "safestack.db"

app = FastAPI(
    title="SafeStack API",
    description="API for accessing safety policies and alerts",
    version="1.0.0",
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Database Connection
# =============================================================================


def get_db():
    """Get database connection."""
    if not DATABASE_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Database not found at {DATABASE_PATH}. Run setup_database.py first.",
        )
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def row_to_dict(row):
    """Convert sqlite3.Row to dict."""
    return dict(row) if row else None


def rows_to_list(rows):
    """Convert list of sqlite3.Row to list of dicts."""
    return [dict(row) for row in rows]


# =============================================================================
# Pydantic Models
# =============================================================================


class UserCreate(BaseModel):
    email: str
    name: str


class PolicyCreate(BaseModel):
    title: str
    level: int
    description: Optional[str] = None


class AlertCreate(BaseModel):
    policy_id: int
    image_urls: list[str] = []
    explanation: str


# =============================================================================
# User Endpoints
# =============================================================================


@app.get("/users")
def list_users():
    """Get all users."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
    conn.close()
    return rows_to_list(rows)


@app.get("/users/{email}")
def get_user(email: str):
    """Get a user by email."""
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return row_to_dict(row)


@app.post("/users", status_code=201)
def create_user(user: UserCreate):
    """Create a new user."""
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (email, name) VALUES (?, ?)",
            (user.email, user.name),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(
            status_code=400, detail="User with this email already exists"
        )

    row = conn.execute("SELECT * FROM users WHERE email = ?", (user.email,)).fetchone()
    conn.close()
    return row_to_dict(row)


@app.delete("/users/{email}", status_code=204)
def delete_user(email: str):
    """Delete a user by email."""
    conn = get_db()
    cursor = conn.execute("DELETE FROM users WHERE email = ?", (email,))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    conn.close()


# =============================================================================
# Policy Endpoints
# =============================================================================


@app.get("/policies")
def list_policies(
    level: Optional[int] = Query(None, description="Filter by severity level")
):
    """Get all policies, optionally filtered by level."""
    conn = get_db()
    if level is not None:
        rows = conn.execute(
            "SELECT * FROM policies WHERE level = ? ORDER BY level DESC, title",
            (level,),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM policies ORDER BY level DESC, title"
        ).fetchall()
    conn.close()
    return rows_to_list(rows)


@app.get("/policies/{policy_id}")
def get_policy(policy_id: int):
    """Get a policy by ID."""
    conn = get_db()
    row = conn.execute("SELECT * FROM policies WHERE id = ?", (policy_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Policy not found")
    return row_to_dict(row)


@app.post("/policies", status_code=201)
def create_policy(policy: PolicyCreate):
    """Create a new policy."""
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO policies (title, level, description) VALUES (?, ?, ?)",
        (policy.title, policy.level, policy.description),
    )
    conn.commit()
    policy_id = cursor.lastrowid
    row = conn.execute("SELECT * FROM policies WHERE id = ?", (policy_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


@app.delete("/policies/{policy_id}", status_code=204)
def delete_policy(policy_id: int):
    """Delete a policy by ID."""
    conn = get_db()
    cursor = conn.execute("DELETE FROM policies WHERE id = ?", (policy_id,))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Policy not found")
    conn.close()


# =============================================================================
# Alert Endpoints
# =============================================================================


@app.get("/alerts")
def list_alerts(
    policy_id: Optional[int] = Query(None, description="Filter by policy ID"),
    min_level: Optional[int] = Query(
        None, description="Filter by minimum policy level"
    ),
    limit: int = Query(100, description="Maximum number of results"),
):
    """Get alerts with optional filters."""
    conn = get_db()

    query = """
        SELECT a.*, p.title as policy_title, p.level as policy_level
        FROM alerts a
        JOIN policies p ON a.policy_id = p.id
    """
    params = []
    conditions = []

    if policy_id is not None:
        conditions.append("a.policy_id = ?")
        params.append(policy_id)

    if min_level is not None:
        conditions.append("p.level >= ?")
        params.append(min_level)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY a.timestamp DESC LIMIT ?"
    params.append(limit)

    rows = conn.execute(query, params).fetchall()
    conn.close()

    # Parse image_urls JSON for each row
    result = []
    for row in rows:
        d = dict(row)
        if d.get("image_urls"):
            d["image_urls"] = json.loads(d["image_urls"])
        else:
            d["image_urls"] = []
        result.append(d)

    return result


@app.get("/alerts/{alert_id}")
def get_alert(alert_id: int):
    """Get an alert by ID."""
    conn = get_db()
    row = conn.execute(
        """
        SELECT a.*, p.title as policy_title, p.level as policy_level
        FROM alerts a
        JOIN policies p ON a.policy_id = p.id
        WHERE a.id = ?
        """,
        (alert_id,),
    ).fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Alert not found")

    d = dict(row)
    if d.get("image_urls"):
        d["image_urls"] = json.loads(d["image_urls"])
    else:
        d["image_urls"] = []
    return d


@app.post("/alerts", status_code=201)
def create_alert(alert: AlertCreate):
    """Create a new alert."""
    conn = get_db()

    # Verify policy exists
    policy = conn.execute(
        "SELECT id FROM policies WHERE id = ?", (alert.policy_id,)
    ).fetchone()
    if not policy:
        conn.close()
        raise HTTPException(status_code=400, detail="Policy not found")

    cursor = conn.execute(
        "INSERT INTO alerts (policy_id, image_urls, explanation) VALUES (?, ?, ?)",
        (alert.policy_id, json.dumps(alert.image_urls), alert.explanation),
    )
    conn.commit()
    alert_id = cursor.lastrowid

    row = conn.execute(
        """
        SELECT a.*, p.title as policy_title, p.level as policy_level
        FROM alerts a
        JOIN policies p ON a.policy_id = p.id
        WHERE a.id = ?
        """,
        (alert_id,),
    ).fetchone()
    conn.close()

    d = dict(row)
    d["image_urls"] = json.loads(d["image_urls"]) if d.get("image_urls") else []
    return d


@app.delete("/alerts/{alert_id}", status_code=204)
def delete_alert(alert_id: int):
    """Delete an alert by ID."""
    conn = get_db()
    cursor = conn.execute("DELETE FROM alerts WHERE id = ?", (alert_id,))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Alert not found")
    conn.close()


# =============================================================================
# Stats Endpoint
# =============================================================================


@app.get("/stats")
def get_stats():
    """Get database statistics."""
    conn = get_db()

    user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    policy_count = conn.execute("SELECT COUNT(*) FROM policies").fetchone()[0]
    alert_count = conn.execute("SELECT COUNT(*) FROM alerts").fetchone()[0]

    alerts_by_level = conn.execute(
        """
        SELECT p.level, COUNT(a.id) as count
        FROM policies p
        LEFT JOIN alerts a ON p.id = a.policy_id
        GROUP BY p.level
        ORDER BY p.level
        """
    ).fetchall()

    conn.close()

    return {
        "users": user_count,
        "policies": policy_count,
        "alerts": alert_count,
        "alerts_by_level": {row["level"]: row["count"] for row in alerts_by_level},
    }


# =============================================================================
# Health Check
# =============================================================================


@app.get("/health")
def health_check():
    """Health check endpoint."""
    try:
        conn = get_db()
        conn.execute("SELECT 1").fetchone()
        conn.close()
        return {"status": "healthy", "database": str(DATABASE_PATH)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Main
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    print("=" * 60)
    print("SafeStack API Server")
    print("=" * 60)
    print(f"\nDatabase: {DATABASE_PATH}")
    print(f"Docs: http://localhost:8000/docs")
    print(f"API:  http://localhost:8000\n")

    uvicorn.run(app, host="0.0.0.0", port=8000)
