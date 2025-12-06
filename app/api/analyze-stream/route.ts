import { NextRequest, NextResponse } from 'next/server'
import { analyzeFrame } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const { frame, timestamp } = await request.json()

    if (!frame) {
      return NextResponse.json(
        { error: 'No frame data provided' },
        { status: 400 }
      )
    }

    // Analyze frame with Gemini 3 Pro
    const violations = await analyzeFrame(frame, timestamp || '00:00')

    return NextResponse.json({ violations })
  } catch (error) {
    console.error('Error analyzing frame:', error)
    return NextResponse.json(
      { error: 'Failed to analyze frame' },
      { status: 500 }
    )
  }
}
