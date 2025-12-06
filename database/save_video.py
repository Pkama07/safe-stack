#!/usr/bin/env python3
"""
Save a video URL to the database.
Usage: python save_video.py <video_url>
"""

import sqlite3
import sys
from pathlib import Path

DATABASE_PATH = Path(__file__).parent.parent / "db" / "safestack.db"


def save_video(url: str) -> int:
    """Save a video URL to the database and return its ID."""
    # Ensure database exists
    if not DATABASE_PATH.exists():
        print(f"Error: Database not found at {DATABASE_PATH}")
        print("Run setup_database.py first.")
        sys.exit(1)

    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.execute(
        "INSERT INTO videos (url) VALUES (?)",
        (url,),
    )
    conn.commit()
    video_id = cursor.lastrowid

    # Verify the insert
    row = conn.execute("SELECT * FROM videos WHERE id = ?", (video_id,)).fetchone()
    conn.close()

    return video_id, dict(row)


def main():
    if len(sys.argv) < 2:
        print("Usage: python save_video.py <video_url>")
        print("\nExample:")
        print("  python save_video.py https://example.com/video.mp4")
        sys.exit(1)

    url = sys.argv[1]
    video_id, video = save_video(url)

    print(f"Video saved successfully!")
    print(f"  ID: {video_id}")
    print(f"  URL: {video['url']}")
    print(f"  Timestamp: {video['timestamp']}")


if __name__ == "__main__":
    main()
