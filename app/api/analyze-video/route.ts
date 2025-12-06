import { NextRequest, NextResponse } from 'next/server'
import { analyzeVideo } from '@/lib/gemini'

export const maxDuration = 300 // 5 minutes for video processing

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const video = formData.get('video') as File

    if (!video) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (!validTypes.includes(video.type)) {
      return NextResponse.json(
        { error: 'Invalid video format. Supported: MP4, WebM, MOV, AVI' },
        { status: 400 }
      )
    }

    // Convert to base64
    const bytes = await video.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')

    // Map MIME types for Gemini
    const mimeType = video.type === 'video/quicktime' ? 'video/mov' : video.type

    // Analyze with Gemini 3 Pro
    const violations = await analyzeVideo(base64, mimeType)

    return NextResponse.json({ violations })
  } catch (error) {
    console.error('Error processing video:', error)
    return NextResponse.json(
      { error: 'Failed to analyze video. Please try again.' },
      { status: 500 }
    )
  }
}
