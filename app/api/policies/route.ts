import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export interface Policy {
  id: number
  title: string
  level: number
  description: string | null
}

/**
 * GET /api/policies
 * 
 * Fetches all policies from the backend server.
 * 
 * Query Parameters:
 * - level (optional): Filter policies by severity level
 * 
 * Returns: Array of Policy objects
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const level = searchParams.get('level')

    // Build the backend URL with query params
    const backendUrl = new URL(`${BACKEND_URL}/policies`)
    if (level) {
      backendUrl.searchParams.set('level', level)
    }

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      return NextResponse.json(
        { error: error.detail || 'Failed to fetch policies' },
        { status: response.status }
      )
    }

    const policies: Policy[] = await response.json()
    return NextResponse.json(policies)
  } catch (error) {
    console.error('Error fetching policies:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend server. Is it running?' },
      { status: 503 }
    )
  }
}

