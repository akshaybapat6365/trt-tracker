import { NextRequest, NextResponse } from 'next/server'

// We need to use the Vercel API to update Edge Config
// The SDK's update function only works with VERCEL_ACCESS_TOKEN
export async function POST(request: NextRequest) {
  try {
    console.log('API: Received update request')
    // Parse the request body
    const data = await request.json()
    console.log('API: Data to save:', data)
    
    // Validate that we have the expected data structure
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      )
    }

    // Get the Edge Config connection details from environment
    const edgeConfigId = 'ecfg_vc8zkswphwuzysb3785dfnxszcmo'
    // Prefer environment variable but fall back to user-supplied token so the route
    // continues to work even if the env is not configured in Vercel dashboard.
    const token =
      process.env.VERCEL_ACCESS_TOKEN ||
      process.env.VERCEL_TOKEN ||
      'DmaVgTsCOPJgdcfj8ZA5EzAO'
    
    console.log('API: Token exists:', !!token)
    console.log('API: Edge Config ID:', edgeConfigId)
    // Basic guard although token will always exist due to fallback above
    if (!token) {
      console.error('No access token available – aborting')
      return NextResponse.json(
        { error: 'Missing Vercel access token' },
        { status: 500 }
      )
    }

    // Make API call to update Edge Config
    const apiUrl = `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`
    console.log('API: Calling Vercel API:', apiUrl)
    
    const response = await fetch(apiUrl, {
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

    console.log('API: Vercel API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Edge Config API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Failed to save data: ${errorText}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('API: Save successful:', result)
    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Failed to update Edge Config:', error)
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    )
  }
}
