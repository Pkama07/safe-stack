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

/**
 * POST /api/analyze-video
 *
 * Analyzes a video for safety violations using the backend Gemini integration.
 *
 * Request Body (JSON):
 * - video_url (required): URL of the video to analyze
 *
 * Returns: AnalysisResult with violations found and alerts created
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { video_url } = body

    if (!video_url) {
      return NextResponse.json(
        { error: 'video_url is required' },
        { status: 400 }
      )
    }

    // Call backend analyze-video-full endpoint
    const response = await fetch(`${BACKEND_URL}/analyze-video-full`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ video_url }),
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
