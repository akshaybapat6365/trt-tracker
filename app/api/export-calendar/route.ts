import { NextRequest, NextResponse } from 'next/server'
import { createCanvas } from 'canvas'
import { format, getDaysInMonth } from 'date-fns'

// This is a server-side export that doesn't rely on browser Canvas API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      protocol = 'E3D',
      injectionDates = [],
      records = [],
      currentDate = new Date().toISOString()
    } = body

    // Create canvas on server-side
    const canvasWidth = 800
    const canvasHeight = 1200
    const canvas = createCanvas(canvasWidth, canvasHeight)
    const ctx = canvas.getContext('2d')

    // Fill background
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Draw header
    ctx.fillStyle = '#f5f5f5'
    ctx.font = '28px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`TRT Tracker - ${protocol} Protocol`, canvasWidth / 2, 40)

    ctx.font = '14px Arial'
    ctx.fillStyle = '#888888'
    ctx.fillText(`Generated on ${format(new Date(), 'PPP')}`, canvasWidth / 2, 65)

    // Draw calendar
    const padding = 40
    const cellSize = 90
    const cellPadding = 5
    let yOffset = 100

    // Draw 3 months
    const today = new Date(currentDate)
    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const monthDate = new Date(startMonth)
      monthDate.setMonth(startMonth.getMonth() + monthOffset)
      
      // Month header
      ctx.fillStyle = '#f5f5f5'
      ctx.font = '20px Arial'
      ctx.textAlign = 'left'
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      ctx.fillText(monthName, padding, yOffset)
      
      // Day headers
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      ctx.font = '12px Arial'
      ctx.fillStyle = '#888888'
      ctx.textAlign = 'center'
      
      const calendarY = yOffset + 30
      for (let i = 0; i < 7; i++) {
        const x = padding + (i * (cellSize + cellPadding)) + (cellSize / 2)
        ctx.fillText(dayNames[i], x, calendarY)
      }
      
      // Draw days
      const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const daysInMonth = getDaysInMonth(monthDate)
      const startDayOfWeek = firstDay.getDay()
      
      let currentDay = 1
      const cellY = calendarY + 20
      
      for (let week = 0; week < 6; week++) {
        if (currentDay > daysInMonth) break
        
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
          const x = padding + (dayOfWeek * (cellSize + cellPadding))
          const y = cellY + (week * (cellSize + cellPadding))
          
          if (week === 0 && dayOfWeek < startDayOfWeek) {
            continue
          } else if (currentDay <= daysInMonth) {
            // Draw cell
            ctx.fillStyle = '#2a2a2a'
            ctx.fillRect(x, y, cellSize, cellSize)
            
            // Draw border
            ctx.strokeStyle = '#3a3a3a'
            ctx.lineWidth = 1
            ctx.strokeRect(x, y, cellSize, cellSize)
            
            // Draw day number
            ctx.font = '14px Arial'
            ctx.fillStyle = '#f5f5f5'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            ctx.fillText(currentDay.toString(), x + (cellSize / 2), y + 5)
            
            // Check if injection day
            const cellDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), currentDay)
            const cellDateStr = cellDate.toISOString().split('T')[0]
            const isInjectionDay = injectionDates.some((d: string) => 
              new Date(d).toISOString().split('T')[0] === cellDateStr
            )
            
            if (isInjectionDay) {
              // Check if we have a record for this date
              const record = records.find((r: { date: string; missed?: boolean; dose?: number }) => 
                new Date(r.date).toISOString().split('T')[0] === cellDateStr
              )
              
              const indicatorY = y + cellSize - 15
              ctx.font = '10px Arial'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              
              if (record && !record.missed) {
                ctx.fillStyle = '#10b981'
                ctx.fillRect(x + 5, indicatorY - 7, cellSize - 10, 14)
                ctx.fillStyle = '#ffffff'
                ctx.fillText('Done', x + (cellSize / 2), indicatorY)
              } else if (record && record.missed) {
                ctx.fillStyle = '#ef4444'
                ctx.fillRect(x + 5, indicatorY - 7, cellSize - 10, 14)
                ctx.fillStyle = '#ffffff'
                ctx.fillText('Missed', x + (cellSize / 2), indicatorY)
              } else if (cellDate < today) {
                ctx.fillStyle = '#f59e0b'
                ctx.fillRect(x + 5, indicatorY - 7, cellSize - 10, 14)
                ctx.fillStyle = '#000000'
                ctx.fillText('Log', x + (cellSize / 2), indicatorY)
              } else {
                ctx.fillStyle = '#fbbf24'
                ctx.fillRect(x + 5, indicatorY - 7, cellSize - 10, 14)
                ctx.fillStyle = '#000000'
                ctx.fillText('Scheduled', x + (cellSize / 2), indicatorY)
              }
            }
            
            currentDay++
          }
        }
      }
      
      yOffset += 300
    }

    // Draw legend
    const legendY = canvasHeight - 120
    ctx.fillStyle = '#2a2a2a'
    ctx.fillRect(padding, legendY, canvasWidth - (padding * 2), 80)
    
    ctx.fillStyle = '#f5f5f5'
    ctx.font = '16px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('Legend', padding + 20, legendY + 25)
    
    // Legend items
    const legendItems = [
      { color: '#fbbf24', label: 'Scheduled' },
      { color: '#10b981', label: 'Completed' },
      { color: '#ef4444', label: 'Missed' },
      { color: '#f59e0b', label: 'Needs Log' }
    ]
    
    legendItems.forEach((item, index) => {
      const x = padding + 20 + (index * 180)
      const y = legendY + 50
      
      ctx.fillStyle = item.color
      ctx.fillRect(x, y - 8, 16, 16)
      
      ctx.fillStyle = '#f5f5f5'
      ctx.font = '12px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(item.label, x + 25, y)
    })

    // Convert to buffer
    const buffer = canvas.toBuffer('image/png')
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename=trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.png`
      },
    })
  } catch (error) {
    console.error('Server-side export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate calendar image' },
      { status: 500 }
    )
  }
}