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

export interface CreateAlertRequest {
  policy_id: number
  image_urls?: string[]
  explanation: string
  user_email?: string
}

/**
 * GET /api/alerts
 * 
 * Fetches alerts from the backend server with optional filtering.
 * 
 * Query Parameters:
 * - user_email (optional): Filter alerts by user email
 * - policy_id (optional): Filter alerts by policy ID
 * - min_level (optional): Filter alerts by minimum policy level
 * - limit (optional): Maximum number of results (default: 100)
 * 
 * Returns: Array of Alert objects
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userEmail = searchParams.get('user_email')
    const policyId = searchParams.get('policy_id')
    const minLevel = searchParams.get('min_level')
    const limit = searchParams.get('limit')

    // Build the backend URL with query params
    const backendUrl = new URL(`${BACKEND_URL}/alerts`)
    if (userEmail) {
      backendUrl.searchParams.set('user_email', userEmail)
    }
    if (policyId) {
      backendUrl.searchParams.set('policy_id', policyId)
    }
    if (minLevel) {
      backendUrl.searchParams.set('min_level', minLevel)
    }
    if (limit) {
      backendUrl.searchParams.set('limit', limit)
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
        { error: error.detail || 'Failed to fetch alerts' },
        { status: response.status }
      )
    }

    const alerts: Alert[] = await response.json()
    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend server. Is it running?' },
      { status: 503 }
    )
  }
}

/**
 * POST /api/alerts
 * 
 * Creates a new alert in the backend server.
 * 
 * Request Body:
 * - policy_id (required): The ID of the policy that was violated
 * - explanation (required): Description of the violation
 * - image_urls (optional): Array of image URLs for the alert
 * - user_email (optional): Email of the user associated with this alert
 * 
 * Returns: The created Alert object
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateAlertRequest = await request.json()

    // Validate required fields
    if (!body.policy_id || !body.explanation) {
      return NextResponse.json(
        { error: 'policy_id and explanation are required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${BACKEND_URL}/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        policy_id: body.policy_id,
        image_urls: body.image_urls || [],
        explanation: body.explanation,
        user_email: body.user_email || null,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      return NextResponse.json(
        { error: error.detail || 'Failed to create alert' },
        { status: response.status }
      )
    }

    const alert: Alert = await response.json()
    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    console.error('Error creating alert:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend server. Is it running?' },
      { status: 503 }
    )
  }
}

