#!/usr/bin/env python3
"""
Database API Server
===================
A FastAPI server that provides REST endpoints to access the SQLite database.

Run with: uvicorn server:app --reload
Or: python server.py
"""

import base64
import json
import os
import re
import sqlite3
import tempfile
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import cv2
import httpx
import requests
import resend
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel
from supabase import create_client, Client

# Load environment variables from .env.local file
load_dotenv(Path(__file__).parent.parent / ".env.local")

# Configure Resend API key from environment variable
resend.api_key = os.getenv("RESEND_API_KEY", "")

# Configure Google Gemini API
GOOGLE_CLOUD_KEY = os.getenv("GOOGLE_CLOUD_KEY", "")
gemini_client = genai.Client(api_key=GOOGLE_CLOUD_KEY)

# Configure Supabase storage
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ksbfdhccpkfycuyngwhv.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_BUCKET = "uploads-bucket"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Alert email recipient from environment variable
ALERT_EMAIL_RECIPIENT = os.getenv("ALERT_EMAIL_RECIPIENT", "")

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
# Email Integration (Resend)
# =============================================================================


def send_alert_email(
    recipient: str,
    image_urls: list[str],
    body: str,
    subject: str = "Safety Alert Notification",
) -> dict:
    """
    Send an alert email using Resend.

    Args:
        recipient: Email address of the recipient
        image_urls: List of image URLs to include in the email
        body: The main body text of the email
        subject: Email subject line (default: "Safety Alert Notification")

    Returns:
        dict: Response from Resend API containing email ID and status
    """
    # Build HTML content with images
    images_html = ""
    if image_urls:
        images_html = "<div style='margin-top: 20px;'><h3>Evidence Images:</h3>"
        for i, url in enumerate(image_urls, 1):
            images_html += f"""
                <div style='margin: 10px 0;'>
                    <p style='color: #666; font-size: 12px;'>Image {i}</p>
                    <img src='{url}' alt='Evidence {i}' style='max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid #ddd;' />
                </div>
            """
        images_html += "</div>"

    html_content = f"""
    <div style='font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px;'>
            <h1 style='color: #FF2626; margin: 0; font-size: 24px;'>⚠️ Safety Alert</h1>
        </div>
        <div style='background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;'>
            <div style='color: #334155; line-height: 1.6; white-space: pre-wrap;'>{body}</div>
            {images_html}
        </div>
        <div style='margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;'>
            <p>This is an automated alert from SafeStack Safety Monitoring System.</p>
        </div>
    </div>
    """

    params: resend.Emails.SendParams = {
        "from": "SafeStack Alerts <alerts@resend.dev>",
        "to": [recipient],
        "subject": subject,
        "html": html_content,
    }

    email = resend.Emails.send(params)
    return email


# =============================================================================
# Gemini Video Analysis
# =============================================================================


def get_policies() -> str:
    """Load policies from the database and format them for Gemini analysis."""
    conn = get_db()
    rows = conn.execute(
        "SELECT title, level, description FROM policies ORDER BY level, title"
    ).fetchall()
    conn.close()

    if not rows:
        return ""

    # Format policies in the same format as policies.txt
    formatted_policies = []
    for row in rows:
        policy_text = f"[Severity {row['level']}] {row['title']}\n\nDescription: {row['description'] or ''}"
        formatted_policies.append(policy_text)

    return "\n\n".join(formatted_policies)


ANALYSIS_PROMPT = """You are an expert workplace safety inspector analyzing video footage for OSHA safety violations.

Given the following OSHA safety policies:
---
{POLICIES}
---

Analyze the video carefully and identify ANY safety violations you observe. For each violation found, provide:
- timestamp: The time in the video where the violation occurs (MM:SS format)
- policy_name: The name of the violated policy (e.g., "Poor Housekeeping and Walking-Working Surfaces")
- severity: The severity level exactly as shown in brackets in the policy (must be one of: "Severity 1", "Severity 2", or "Severity 3")
- description: What you observed in the video
- reasoning: Why this constitutes a violation of the specific policy
- fix: A specific, actionable instruction on how to fix this violation (e.g., "Move the boxes off the walkway and store them on the designated shelf")

IMPORTANT:
- Be thorough and identify ALL potential violations
- Only report violations you can clearly see in the video
- If the SAME violation type occurs multiple times in the video, report ONLY the MOST SIGNIFICANT instance (the one that is most clearly visible, most severe, or poses the greatest risk) - do NOT report the first occurrence, report the WORST/MOST SIGNIFICANT occurrence
- Each unique violation type should appear only once in your results, at its most significant timestamp
- The timestamp you return should be the one with where the violation is most clearly visible. It shouldn't be the start of the violation, but when it is the MOST apparent (1-2 seconds after the start of the violation)
- If no violations are found, return an empty array
- Return ONLY valid JSON, no additional text

Return your analysis as a JSON array of violations:
[
  {
    "timestamp": "00:15",
    "policy_name": "Poor Housekeeping and Walking-Working Surfaces",
    "severity": "Severity 1",
    "description": "Tools and materials scattered across walkway",
    "reasoning": "This creates slip, trip, and fall hazards as per OSHA guidelines",
    "fix": "Clear the walkway by moving tools to the designated tool storage area and materials to the proper staging zone"
  }
]"""


def analyze_video_with_gemini(video_base64: str, mime_type: str) -> list[dict]:
    """
    Analyze a video for safety violations using Gemini.

    Args:
        video_base64: Base64-encoded video data
        mime_type: MIME type of the video (e.g., 'video/mp4')

    Returns:
        List of violation dictionaries with timestamp, policy_name, severity, description, reasoning
    """
    policies = get_policies()
    prompt = ANALYSIS_PROMPT.replace("{POLICIES}", policies)

    try:
        response = gemini_client.models.generate_content(
            model="gemini-3-pro-preview",
            contents=[
                {
                    "role": "user",
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": video_base64,
                            }
                        },
                        {"text": prompt},
                    ],
                }
            ],
        )

        text = response.text or ""

        # Extract JSON from the response
        json_match = re.search(r"\[[\s\S]*\]", text)
        if not json_match:
            print(f"No JSON array found in response: {text}")
            return []

        violations = json.loads(json_match.group(0))
        return violations
    except Exception as e:
        print(f"Error analyzing video with Gemini: {e}")
        raise


# =============================================================================
# Nano Banana Image Highlighting
# =============================================================================

AMEND_POLICY_PROMPT = """You are an expert safety policy writer reviewing a policy that generated a false positive detection.

Current Policy:
- Title: {POLICY_TITLE}
- Severity Level: {POLICY_LEVEL}
- Description: {POLICY_DESCRIPTION}

User Feedback (explaining why this was a false positive):
{USER_FEEDBACK}

Based on the user's feedback, write an improved policy description that:
1. Maintains the original intent and safety requirements of the policy
2. Adds clarifying language to prevent this type of false positive in the future
3. Is clear, specific, and actionable for safety inspectors
4. Does not weaken the safety standards - only adds precision to avoid incorrect detections

Return ONLY the updated policy description text, without any additional commentary or formatting."""


AMENDED_IMAGE_PROMPT = """You are a safety compliance visualization expert.

Violation detected: {POLICY_NAME}
Description: {DESCRIPTION}
Reasoning: {REASONING}

How to fix: {FIX}

Edit this image to show how the scene SHOULD look after applying the fix above:
- Apply the specific fix described to correct the safety hazard
- Show the compliant, safe state as if the fix has been implemented
- Keep the overall scene, setting, and context identical
- The result should be a realistic visualization of a safe, compliant workplace"""


def generate_amended_image(
    frame_base64: str,
    policy_name: str,
    description: str,
    reasoning: str,
    fix: str,
) -> str:
    """
    Use Gemini to generate an amended version of the image with the violation fixed.

    Args:
        frame_base64: Base64-encoded JPEG frame
        policy_name: Name of the violated policy
        description: Description of the violation
        reasoning: Reasoning for the violation
        fix: Specific instruction on how to fix the violation

    Returns:
        Base64-encoded amended image showing the corrected scene
    """
    prompt = (
        AMENDED_IMAGE_PROMPT.replace("{POLICY_NAME}", policy_name)
        .replace("{DESCRIPTION}", description)
        .replace("{REASONING}", reasoning)
        .replace("{FIX}", fix)
    )

    try:
        response = gemini_client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[
                {
                    "role": "user",
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": frame_base64,
                            }
                        },
                        {"text": prompt},
                    ],
                }
            ],
            config={
                "response_modalities": ["IMAGE"],
            },
        )

        # Extract the generated image from response
        if response.candidates:
            for part in response.candidates[0].content.parts:
                if (
                    hasattr(part, "inline_data")
                    and part.inline_data
                    and part.inline_data.data
                ):
                    return part.inline_data.data

        raise Exception("No image returned from Gemini")
    except Exception as e:
        print(f"Error generating amended image: {e}")
        raise


# =============================================================================
# Video Frame Extraction
# =============================================================================


def parse_timestamp(timestamp: str) -> float:
    """
    Parse a timestamp string (MM:SS or HH:MM:SS) to seconds.

    Args:
        timestamp: Timestamp string like "00:15" or "01:30:45"

    Returns:
        Time in seconds as float
    """
    parts = timestamp.split(":")
    parts = [float(p) for p in parts]

    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    elif len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return 0.0


def extract_frame_at_timestamp(video_path: str, timestamp_seconds: float) -> str:
    """
    Extract a frame from a video at the specified timestamp.

    Args:
        video_path: Path to the video file
        timestamp_seconds: Time in seconds to extract frame from

    Returns:
        Base64-encoded JPEG image
    """
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise Exception(f"Could not open video: {video_path}")

    # Set position to the specified timestamp (in milliseconds)
    cap.set(cv2.CAP_PROP_POS_MSEC, timestamp_seconds * 1000)

    ret, frame = cap.read()
    cap.release()

    if not ret:
        raise Exception(f"Could not read frame at timestamp {timestamp_seconds}s")

    # Encode frame as JPEG
    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
    frame_base64 = base64.b64encode(buffer).decode("utf-8")

    return frame_base64


# =============================================================================
# Supabase S3 Storage Upload
# =============================================================================


def upload_image_to_supabase(image_base64: str, filename: str) -> str:
    """
    Upload an image to Supabase storage.

    Args:
        image_base64: Base64-encoded image data
        filename: Name for the file in storage

    Returns:
        Public URL of the uploaded image
    """
    # Decode base64 to bytes
    image_bytes = base64.b64decode(image_base64)

    # Upload to Supabase storage
    file_path = f"images/{filename}"

    response = supabase.storage.from_(SUPABASE_BUCKET).upload(
        file_path,
        image_bytes,
        file_options={"content-type": "image/png", "upsert": "false"},
    )

    # Get public URL
    public_url_response = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(
        file_path
    )

    return public_url_response


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
    user_email: Optional[str] = None


class VideoCreate(BaseModel):
    url: str


class VideoAnalysisRequest(BaseModel):
    video_url: str  # URL to download video from


class PolicyAmendmentRequest(BaseModel):
    alert_id: int  # ID of the false positive alert
    feedback: str  # User's explanation of why this was a false positive


class FrameAnalysisRequest(BaseModel):
    frame_base64: str  # Base64-encoded JPEG frame
    camera_id: str
    camera_name: Optional[str] = None


# =============================================================================
# Frame Analysis
# =============================================================================

FRAME_ANALYSIS_PROMPT = """You are an expert workplace safety inspector analyzing a frame from a live video feed.

Given the following OSHA safety policies:
---
{POLICIES}
---

Analyze this frame and identify ANY safety violations visible. For each violation found, provide:
- policy_name: The name of the violated policy (must match exactly one of the policy titles above)
- severity: The severity level exactly as shown in brackets in the policy (must be one of: "Severity 1", "Severity 2", or "Severity 3")
- description: What you observed in the frame
- reasoning: Why this constitutes a violation of the specific policy

IMPORTANT:
- Only report violations you can clearly see in the frame
- If no violations are found, return an empty array
- Return ONLY valid JSON, no additional text

Return your analysis as a JSON array:
[
  {
    "policy_name": "Poor Housekeeping and Walking-Working Surfaces",
    "severity": "Severity 1",
    "description": "Tools and materials scattered across walkway",
    "reasoning": "This creates slip, trip, and fall hazards as per OSHA guidelines"
  }
]"""


def analyze_frame_with_gemini(frame_base64: str) -> list[dict]:
    """
    Analyze a single frame for safety violations using Gemini.
    """
    policies = get_policies()
    prompt = FRAME_ANALYSIS_PROMPT.replace("{POLICIES}", policies)

    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                {
                    "role": "user",
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": frame_base64,
                            }
                        },
                        {"text": prompt},
                    ],
                }
            ],
        )

        text = response.text or ""
        json_match = re.search(r"\[[\s\S]*\]", text)
        if not json_match:
            return []

        violations = json.loads(json_match.group(0))
        return violations
    except Exception as e:
        print(f"Error analyzing frame with Gemini: {e}")
        return []


@app.post("/analyze-frame")
async def analyze_frame(request: FrameAnalysisRequest):
    """
    Analyze a single frame for safety violations.
    Creates alerts for any violations found.
    """
    try:
        violations = analyze_frame_with_gemini(request.frame_base64)

        if not violations:
            return {
                "violations": [],
                "alerts_created": 0,
            }

        conn = get_db()
        created_alerts = []

        for violation in violations:
            policy_name = violation.get("policy_name", "")
            policy_row = conn.execute(
                "SELECT id, level FROM policies WHERE title = ?",
                (policy_name,),
            ).fetchone()

            if not policy_row:
                print(f"Policy not found: {policy_name}, skipping")
                continue

            policy_id = policy_row["id"]
            explanation = violation.get("description", "")
            severity = violation.get("severity", "")
            reasoning = violation.get("reasoning", "")

            # Create alert
            cursor = conn.execute(
                """
                INSERT INTO alerts (
                    policy_id, explanation, severity, reasoning
                ) VALUES (?, ?, ?, ?)
                """,
                (policy_id, explanation, severity, reasoning),
            )
            conn.commit()

            created_alerts.append({
                "alert_id": cursor.lastrowid,
                "policy_name": policy_name,
                "severity": severity,
                "description": explanation,
                "reasoning": reasoning,
            })

        conn.close()

        return {
            "violations": created_alerts,
            "alerts_created": len(created_alerts),
        }

    except Exception as e:
        print(f"Error in analyze_frame: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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


@app.post("/amend-policy")
def amend_policy(request: PolicyAmendmentRequest):
    """
    Amend a policy based on user feedback about a false positive alert.

    This endpoint:
    1. Fetches the alert by ID
    2. Gets the associated policy
    3. Uses Gemini to generate an improved policy description
    4. Updates the policy in the database
    """
    conn = get_db()

    # Fetch the alert
    alert_row = conn.execute(
        "SELECT * FROM alerts WHERE id = ?", (request.alert_id,)
    ).fetchone()
    if not alert_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Alert not found")

    alert = dict(alert_row)
    policy_id = alert["policy_id"]

    # Fetch the policy
    policy_row = conn.execute(
        "SELECT * FROM policies WHERE id = ?", (policy_id,)
    ).fetchone()
    if not policy_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Policy not found")

    policy = dict(policy_row)

    # Build the prompt for Gemini
    prompt = (
        AMEND_POLICY_PROMPT.replace("{POLICY_TITLE}", policy["title"])
        .replace("{POLICY_LEVEL}", str(policy["level"]))
        .replace("{POLICY_DESCRIPTION}", policy["description"] or "")
        .replace("{USER_FEEDBACK}", request.feedback)
    )

    try:
        # Call Gemini to generate amended policy description
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ],
        )

        amended_description = response.text or ""
        amended_description = amended_description.strip()

        if not amended_description:
            conn.close()
            raise HTTPException(
                status_code=500, detail="Failed to generate amended policy description"
            )

        # Update the policy in the database
        conn.execute(
            "UPDATE policies SET description = ? WHERE id = ?",
            (amended_description, policy_id),
        )
        conn.commit()

        # Fetch and return the updated policy
        updated_row = conn.execute(
            "SELECT * FROM policies WHERE id = ?", (policy_id,)
        ).fetchone()
        conn.close()

        return row_to_dict(updated_row)

    except HTTPException:
        raise
    except Exception as e:
        conn.close()
        print(f"Error amending policy: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Alert Endpoints
# =============================================================================


@app.get("/alerts")
def list_alerts(
    policy_id: Optional[int] = Query(None, description="Filter by policy ID"),
    min_level: Optional[int] = Query(
        None, description="Filter by minimum policy level"
    ),
    user_email: Optional[str] = Query(None, description="Filter by user email"),
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

    if user_email is not None:
        conditions.append("a.user_email = ?")
        params.append(user_email)

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

    # Verify user exists if user_email is provided
    if alert.user_email:
        user = conn.execute(
            "SELECT email FROM users WHERE email = ?", (alert.user_email,)
        ).fetchone()
        if not user:
            conn.close()
            raise HTTPException(status_code=400, detail="User not found")

    cursor = conn.execute(
        "INSERT INTO alerts (policy_id, image_urls, explanation, user_email) VALUES (?, ?, ?, ?)",
        (
            alert.policy_id,
            json.dumps(alert.image_urls),
            alert.explanation,
            alert.user_email,
        ),
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
# Video Endpoints
# =============================================================================


@app.get("/videos")
def list_videos(
    limit: int = Query(100, description="Maximum number of results"),
):
    """Get all videos, ordered by timestamp descending."""
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM videos ORDER BY timestamp DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return rows_to_list(rows)


@app.get("/videos/{video_id}")
def get_video(video_id: int):
    """Get a video by ID."""
    conn = get_db()
    row = conn.execute("SELECT * FROM videos WHERE id = ?", (video_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Video not found")
    return row_to_dict(row)


@app.post("/videos", status_code=201)
def create_video(video: VideoCreate):
    """Create a new video record."""
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO videos (url) VALUES (?)",
        (video.url,),
    )
    conn.commit()
    video_id = cursor.lastrowid
    row = conn.execute("SELECT * FROM videos WHERE id = ?", (video_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


@app.delete("/videos/{video_id}", status_code=204)
def delete_video(video_id: int):
    """Delete a video by ID."""
    conn = get_db()
    cursor = conn.execute("DELETE FROM videos WHERE id = ?", (video_id,))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Video not found")
    conn.close()


# =============================================================================
# Video Analysis Endpoint
# =============================================================================


@app.post("/analyze-video-full")
async def analyze_video_full(request: VideoAnalysisRequest):
    """
    Analyze a video for safety violations and create alerts.

    This endpoint:
    1. Downloads the video from the provided URL
    2. Creates a video record in the database
    3. Analyzes the video with Gemini for safety violations
    4. For each violation:
       - Extracts the frame at the violation timestamp
       - Highlights the violation using Nano Banana
       - Uploads the highlighted image to Supabase storage
       - Creates an alert record in the database
       - Sends an email notification
    5. Returns a summary of violations found and alerts created
    """
    temp_video_path = None

    try:
        # Step 1: Download video to temp file
        async with httpx.AsyncClient() as client:
            response = await client.get(request.video_url, follow_redirects=True)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to download video: {response.status_code}",
                )

            # Determine file extension from content type or URL
            content_type = response.headers.get("content-type", "video/mp4")
            ext = ".mp4"
            if "webm" in content_type:
                ext = ".webm"
            elif "quicktime" in content_type or "mov" in content_type:
                ext = ".mov"
            elif "avi" in content_type:
                ext = ".avi"

            # Save to temp file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
            temp_file.write(response.content)
            temp_file.close()
            temp_video_path = temp_file.name

        # Step 2: Create video record in database
        conn = get_db()
        cursor = conn.execute(
            "INSERT INTO videos (url) VALUES (?)",
            (request.video_url,),
        )
        conn.commit()
        video_id = cursor.lastrowid

        # Step 3: Analyze video with Gemini
        video_base64 = base64.b64encode(Path(temp_video_path).read_bytes()).decode(
            "utf-8"
        )

        # Map extension to MIME type
        mime_type_map = {
            ".mp4": "video/mp4",
            ".webm": "video/webm",
            ".mov": "video/mov",
            ".avi": "video/x-msvideo",
        }
        mime_type = mime_type_map.get(ext, "video/mp4")

        print("sending video to gemini for analysis")

        violations = analyze_video_with_gemini(video_base64, mime_type)

        print("violations found", violations)

        if not violations:
            conn.close()
            return {
                "video_id": video_id,
                "video_url": request.video_url,
                "violations_found": 0,
                "alerts_created": 0,
                "alerts": [],
            }

        # Step 4: Extract ALL frames first (before any DB writes)
        violation_frames = []
        print("extracting frames from video")
        for violation in violations:
            try:
                timestamp_seconds = parse_timestamp(violation.get("timestamp", "00:00"))
                frame_base64 = extract_frame_at_timestamp(
                    temp_video_path, timestamp_seconds
                )
                violation_frames.append((violation, frame_base64))
            except Exception as extract_error:
                print(f"Error extracting frame for violation: {extract_error}")
                continue

        # Step 5: Process each violation - upload original frame and create alert
        created_alerts = []

        for violation, frame_base64 in violation_frames:
            try:
                # Find matching policy in database (strict match on title)
                policy_name = violation.get("policy_name", "")
                policy_row = conn.execute(
                    "SELECT id, level FROM policies WHERE title = ?",
                    (policy_name,),
                ).fetchone()

                if not policy_row:
                    print(f"Policy not found: {policy_name}, skipping violation")
                    continue

                policy_id = policy_row["id"]
                policy_level = policy_row["level"]

                # Upload original frame to Supabase
                original_filename = f"frame_{video_id}_{uuid.uuid4().hex}.png"
                original_image_url = upload_image_to_supabase(
                    frame_base64, original_filename
                )

                # Create alert record with original frame
                explanation = violation.get("description", "")
                severity = violation.get("severity", "")
                reasoning = violation.get("reasoning", "")
                video_timestamp = violation.get("timestamp", "")

                cursor = conn.execute(
                    """
                    INSERT INTO alerts (
                        policy_id, image_urls, explanation, video_timestamp, 
                        severity, reasoning, video_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        policy_id,
                        json.dumps([original_image_url]),
                        explanation,
                        video_timestamp,
                        severity,
                        reasoning,
                        video_id,
                    ),
                )
                conn.commit()
                alert_id = cursor.lastrowid

                # Step 6: Generate amended image with violation fixed
                amended_image_url = None
                fix = violation.get("fix", "")
                try:
                    amended_image = generate_amended_image(
                        frame_base64=frame_base64,
                        policy_name=policy_name,
                        description=explanation,
                        reasoning=reasoning,
                        fix=fix,
                    )

                    # Upload amended image to Supabase
                    amended_filename = f"violation_{video_id}_{uuid.uuid4().hex}.png"
                    amended_image_url = upload_image_to_supabase(
                        amended_image, amended_filename
                    )

                    # Update alert with amended image
                    conn.execute(
                        "UPDATE alerts SET amended_images = ? WHERE id = ?",
                        (json.dumps([amended_image_url]), alert_id),
                    )
                    conn.commit()
                except Exception as amended_error:
                    print(
                        f"Error generating amended image for alert {alert_id}: {amended_error}"
                    )

                # Send email notification if recipient is configured (after amended image is ready)
                if ALERT_EMAIL_RECIPIENT:
                    try:
                        email_body = f"""
Policy Violated: {policy_name}
Severity: {severity}
Timestamp in Video: {video_timestamp}

Description: {explanation}

Reasoning: {reasoning}

Video URL: {request.video_url}
                        """.strip()

                        # Use amended image in email if available, otherwise use original
                        email_image_url = (
                            amended_image_url
                            if amended_image_url
                            else original_image_url
                        )
                        send_alert_email(
                            recipient=ALERT_EMAIL_RECIPIENT,
                            image_urls=[email_image_url],
                            body=email_body,
                            subject=f"Safety Violation Detected: {policy_name}",
                        )
                    except Exception as email_error:
                        print(
                            f"Failed to send email for alert {alert_id}: {email_error}"
                        )

                created_alerts.append(
                    {
                        "alert_id": alert_id,
                        "policy_name": policy_name,
                        "policy_level": policy_level,
                        "severity": severity,
                        "video_timestamp": video_timestamp,
                        "description": explanation,
                        "reasoning": reasoning,
                        "image_url": original_image_url,
                        "amended_image_url": amended_image_url,
                    }
                )

            except Exception as violation_error:
                print(f"Error processing violation: {violation_error}")
                continue

        conn.close()

        return {
            "video_id": video_id,
            "video_url": request.video_url,
            "violations_found": len(violations),
            "alerts_created": len(created_alerts),
            "alerts": created_alerts,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in analyze_video_full: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temp file
        if temp_video_path and os.path.exists(temp_video_path):
            os.unlink(temp_video_path)


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
    video_count = conn.execute("SELECT COUNT(*) FROM videos").fetchone()[0]

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
        "videos": video_count,
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
