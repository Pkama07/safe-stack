import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export interface Alert {
  id: number
  policy_id: number
  policy_title: string
  policy_level: number
  image_urls: string[]
  explanation: string
  timestamp: string
  user_email: string | null
}

/**
 * GET /api/alerts/[id]
 * 
 * Fetches a single alert by ID from the backend server.
 * 
 * Path Parameters:
 * - id: The alert ID
 * 
 * Returns: Alert object
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const response = await fetch(`${BACKEND_URL}/alerts/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Alert not found' },
          { status: 404 }
        )
      }
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      return NextResponse.json(
        { error: error.detail || 'Failed to fetch alert' },
        { status: response.status }
      )
    }

    const alert: Alert = await response.json()
    return NextResponse.json(alert)
  } catch (error) {
    console.error('Error fetching alert:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend server. Is it running?' },
      { status: 503 }
    )
  }
}

/**
 * DELETE /api/alerts/[id]
 * 
 * Deletes an alert by ID from the backend server.
 * 
 * Path Parameters:
 * - id: The alert ID
 * 
 * Returns: 204 No Content on success
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const response = await fetch(`${BACKEND_URL}/alerts/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Alert not found' },
          { status: 404 }
        )
      }
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      return NextResponse.json(
        { error: error.detail || 'Failed to delete alert' },
        { status: response.status }
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting alert:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend server. Is it running?' },
      { status: 503 }
    )
  }
}

