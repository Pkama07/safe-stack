import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export interface FrameAnalysisResult {
  violations: Array<{
    policy_name: string
    severity: string
    description: string
    reasoning: string
    image_url?: string
  }>
  alerts_created: number
}

/**
 * POST /api/analyze-frame
 *
 * Analyzes a video frame for safety violations.
 *
 * Request Body (JSON):
 * - frame (required): Base64-encoded JPEG image
 * - camera_id (required): ID of the camera that captured the frame
 * - camera_name (optional): Name of the camera for context
 *
 * Returns: FrameAnalysisResult with violations found
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { frame, camera_id, camera_name } = body

    if (!frame) {
      return NextResponse.json(
        { error: 'frame is required' },
        { status: 400 }
      )
    }

    // Call backend analyze-frame endpoint
    const response = await fetch(`${BACKEND_URL}/analyze-frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frame_base64: frame,
        camera_id,
        camera_name: camera_name || `Camera ${camera_id}`,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      return NextResponse.json(
        { error: error.detail || 'Failed to analyze frame' },
        { status: response.status }
      )
    }

    const result: FrameAnalysisResult = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error analyzing frame:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend server. Is it running?' },
      { status: 503 }
    )
  }
}
