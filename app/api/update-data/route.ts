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
    const token = process.env.VERCEL_ACCESS_TOKEN || process.env.VERCEL_TOKEN
    
    console.log('API: Token exists:', !!token)
    console.log('API: Edge Config ID:', edgeConfigId)
    
    if (!token) {
      console.error('VERCEL_ACCESS_TOKEN not found in environment')
      return NextResponse.json(
        { error: 'Server configuration error - no access token' },
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