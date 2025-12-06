import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export const maxDuration = 300 // 5 minutes for video processing

export interface AnalysisResult {
  video_id: number
  video_url: string
  violations_found: number
  alerts_created: number
  alerts: Array<{
    alert_id: number
    policy_name: string
    policy_level: number
    severity: string
    video_timestamp: string
    description: string
    reasoning: string
    image_url: string
  }>
}

export interface VideoAnalysisRequest {
  video_url?: string
  video_base64?: string
  mime_type?: string
}

/**
 * POST /api/analyze-video
 *
 * Analyzes a video for safety violations using the backend Gemini integration.
 *
 * Request Body (JSON):
 * - video_url (optional): URL of the video to analyze
 * - video_base64 (optional): Base64-encoded video data
 * - mime_type (optional): MIME type for base64 video (default: video/webm)
 *
 * At least one of video_url or video_base64 must be provided.
 *
 * Returns: AnalysisResult with violations found and alerts created
 */
export async function POST(request: NextRequest) {
  try {
    const body: VideoAnalysisRequest = await request.json()
    const { video_url, video_base64, mime_type } = body

    if (!video_url && !video_base64) {
      return NextResponse.json(
        { error: 'Either video_url or video_base64 is required' },
        { status: 400 }
      )
    }

    // Build request body for backend
    const backendBody: VideoAnalysisRequest = {}
    if (video_base64) {
      backendBody.video_base64 = video_base64
      backendBody.mime_type = mime_type || 'video/webm'
    } else if (video_url) {
      backendBody.video_url = video_url
    }

    // Call backend analyze-video-full endpoint
    const response = await fetch(`${BACKEND_URL}/analyze-video-full`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendBody),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      return NextResponse.json(
        { error: error.detail || 'Failed to analyze video' },
        { status: response.status }
      )
    }

    const result: AnalysisResult = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error analyzing video:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend server. Is it running?' },
      { status: 503 }
    )
  }
}
