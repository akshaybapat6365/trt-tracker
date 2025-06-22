import { NextRequest, NextResponse } from 'next/server'

// We need to use the Vercel API to update Edge Config
// The SDK's update function only works with VERCEL_ACCESS_TOKEN
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const data = await request.json()
    
    // Validate that we have the expected data structure
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      )
    }

    // Get the Edge Config connection details from environment
    const edgeConfigId = 'ecfg_vc8zkswphwuzysb3785dfnxszcmo'
    const token = process.env.VERCEL_ACCESS_TOKEN || process.env.VERCEL_TOKEN
    
    if (!token) {
      console.error('VERCEL_ACCESS_TOKEN not found in environment')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Make API call to update Edge Config
    const response = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'upsert',
            key: 'trtData',
            value: data
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Edge Config API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to save data' },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update Edge Config:', error)
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    )
  }
}