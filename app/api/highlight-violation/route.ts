import { NextRequest, NextResponse } from 'next/server'
import { highlightViolation } from '@/lib/gemini'
import { Violation } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { frame, violation } = await request.json() as {
      frame: string
      violation: Violation
    }

    if (!frame) {
      return NextResponse.json(
        { error: 'No frame data provided' },
        { status: 400 }
      )
    }

    if (!violation) {
      return NextResponse.json(
        { error: 'No violation data provided' },
        { status: 400 }
      )
    }

    // Call Nano Banana Pro to highlight the violation
    const highlightedImage = await highlightViolation(frame, violation)

    return NextResponse.json({
      highlightedImage,
      mimeType: 'image/png'
    })
  } catch (error) {
    console.error('Error highlighting violation:', error)
    return NextResponse.json(
      { error: 'Failed to highlight violation. Please try again.' },
      { status: 500 }
    )
  }
}
