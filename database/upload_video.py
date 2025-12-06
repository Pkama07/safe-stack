#!/usr/bin/env python3
"""
Upload a video file to Supabase storage.
Usage: python upload_video.py <video_path> [filename]
"""

import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv
from requests_aws4auth import AWS4Auth

# Load environment variables
load_dotenv(Path(__file__).parent.parent / ".env.local")

SUPABASE_S3_ACCESS_KEY = os.getenv("SUPABASE_S3_ACCESS_KEY", "")
SUPABASE_S3_SECRET_KEY = os.getenv("SUPABASE_S3_SECRET_KEY", "")
SUPABASE_S3_REGION = "us-west-2"
SUPABASE_S3_ENDPOINT = "https://ksbfdhccpkfycuyngwhv.supabase.co/storage/v1/s3"
SUPABASE_BUCKET = "uploads-bucket"


def upload_video(video_path: str, filename: str = None) -> str:
    """Upload a video file to Supabase storage and return the public URL."""
    video_path = Path(video_path)

    if not video_path.exists():
        print(f"Error: File not found: {video_path}")
        sys.exit(1)

    # Use provided filename or original filename
    if filename is None:
        filename = video_path.name

    # Determine content type
    ext = video_path.suffix.lower()
    content_types = {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
        ".avi": "video/x-msvideo",
    }
    content_type = content_types.get(ext, "video/mp4")

    # Set up AWS4 auth for Supabase S3
    auth = AWS4Auth(
        SUPABASE_S3_ACCESS_KEY,
        SUPABASE_S3_SECRET_KEY,
        SUPABASE_S3_REGION,
        "s3",
    )

    # Read video file
    print(f"Reading {video_path}...")
    with open(video_path, "rb") as f:
        video_data = f.read()

    print(f"Uploading {len(video_data) / 1024 / 1024:.2f} MB to Supabase...")

    # Upload to Supabase S3
    upload_url = f"{SUPABASE_S3_ENDPOINT}/{SUPABASE_BUCKET}/{filename}"

    response = requests.put(
        upload_url,
        data=video_data,
        headers={"Content-Type": content_type},
        auth=auth,
    )

    if response.status_code not in (200, 201):
        print(f"Error: Upload failed with status {response.status_code}")
        print(response.text)
        sys.exit(1)

    # Return the public URL
    public_url = f"https://ksbfdhccpkfycuyngwhv.supabase.co/storage/v1/object/public/{SUPABASE_BUCKET}/{filename}"
    return public_url


def main():
    if len(sys.argv) < 2:
        print("Usage: python upload_video.py <video_path> [filename]")
        print("\nExample:")
        print("  python upload_video.py /path/to/video.mp4")
        print("  python upload_video.py /path/to/video.mp4 custom_name.mp4")
        sys.exit(1)

    video_path = sys.argv[1]
    filename = sys.argv[2] if len(sys.argv) > 2 else None

    url = upload_video(video_path, filename)

    print(f"\nUpload successful!")
    print(f"Public URL: {url}")


if __name__ == "__main__":
    main()
