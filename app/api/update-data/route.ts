import { NextRequest, NextResponse } from 'next/server'
import { update } from '@vercel/edge-config'

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

    // Update the Edge Config with the new data
    // The data should contain both settings and records
    await update({
      trtData: data
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update Edge Config:', error)
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    )
  }
}