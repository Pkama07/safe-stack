import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export interface Policy {
  id: number
  title: string
  level: number
  description: string | null
}

export interface AmendPolicyRequest {
  alert_id: number
  feedback: string
}

/**
 * POST /api/amend-policy
 * 
 * Amends a policy based on user feedback about a false positive alert.
 * 
 * Request Body:
 * - alert_id: The ID of the alert that was a false positive
 * - feedback: User's explanation of why this was a false positive
 * 
 * Returns: Updated Policy object
 */
export async function POST(request: NextRequest) {
  try {
    const body: AmendPolicyRequest = await request.json()

    if (!body.alert_id || !body.feedback) {
      return NextResponse.json(
        { error: 'alert_id and feedback are required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${BACKEND_URL}/amend-policy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        alert_id: body.alert_id,
        feedback: body.feedback,
      }),
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Alert or policy not found' },
          { status: 404 }
        )
      }
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      return NextResponse.json(
        { error: error.detail || 'Failed to amend policy' },
        { status: response.status }
      )
    }

    const policy: Policy = await response.json()
    return NextResponse.json(policy)
  } catch (error) {
    console.error('Error amending policy:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend server. Is it running?' },
      { status: 503 }
    )
  }
}

