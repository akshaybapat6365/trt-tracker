'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Download, FileImage, FileText, Mail, ChevronDown, Copy } from 'lucide-react'
import { format } from 'date-fns'
import { storage } from '@/lib/storage'
import { getAllInjectionDates } from '@/lib/calculations'

interface ExportMenuProps {
  currentProtocol: string
}

export default function ExportMenu({ currentProtocol }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Create a canvas-based calendar drawing function
  const drawCalendarOnCanvas = async (): Promise<HTMLCanvasElement> => {
    console.log('[ExportMenu] Starting canvas draw');
    // Get user settings and injection records
    const settings = storage.getUserSettings()
    const records = storage.getInjectionRecords()
    
    if (!settings) {
      console.error('[ExportMenu] No settings found')
      throw new Error('No settings found')
    }
    
    console.log('[ExportMenu] Settings loaded:', { protocol: settings.protocol, startDate: settings.startDate })

    // Get current date and calculate injection dates for the next 3 months
    const currentDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 3)
    
    const injectionDates = getAllInjectionDates(
      settings.protocolStartDate || settings.startDate,
      settings.protocol,
      endDate
    )

    // Create canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      console.error('[ExportMenu] Failed to get canvas context')
      throw new Error('Could not get canvas context')
    }

    // Canvas settings
    const canvasWidth = 800
    const padding = 40
    const monthSpacing = 50
    const cellSize = 40
    const cellPadding = 2
    
    // Calculate required height based on number of months
    const numMonths = 3
    const monthHeight = 350 // Approximate height per month
    const headerHeight = 100
    const legendHeight = 120
    const canvasHeight = headerHeight + (monthHeight * numMonths) + (monthSpacing * (numMonths - 1)) + legendHeight + (padding * 2)
    
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    
    console.log('[ExportMenu] Canvas dimensions:', { width: canvas.width, height: canvas.height })
    
    // Validate canvas dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      console.error('[ExportMenu] Invalid canvas dimensions')
      throw new Error('Canvas has invalid dimensions')
    }

    // Set up canvas styles
    try {
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    } catch (error) {
      console.error('[ExportMenu] Failed to fill canvas background:', error)
      throw error
    }
    
    // Draw header
    try {
      ctx.fillStyle = '#f5f5f5'
      ctx.font = '28px sans-serif'  // Simplified font
      ctx.textAlign = 'center'
      ctx.fillText(`TRT Tracker - ${currentProtocol} Protocol`, canvasWidth / 2, padding + 30)
    } catch (error) {
      console.error('[ExportMenu] Failed to draw header:', error)
      // Continue without header if font fails
    }
    
    try {
      ctx.font = '14px sans-serif'  // Simplified font
      ctx.fillStyle = '#888888'
      ctx.fillText(`Generated on ${format(new Date(), 'PPP')}`, canvasWidth / 2, padding + 55)
    } catch (error) {
      console.error('[ExportMenu] Failed to draw date:', error)
    }

    // Draw calendars for each month
    let yOffset = headerHeight + padding
    const startMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    
    for (let monthOffset = 0; monthOffset < numMonths; monthOffset++) {
      const monthDate = new Date(startMonth)
      monthDate.setMonth(startMonth.getMonth() + monthOffset)
      
      // Month header
      try {
        ctx.fillStyle = '#f5f5f5'
        ctx.font = '20px sans-serif'  // Simplified font
        ctx.textAlign = 'left'
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        ctx.fillText(monthName, padding, yOffset)
      } catch (error) {
        console.error('[ExportMenu] Failed to draw month header:', error)
      }
      
      // Calculate days in month
      const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      const daysInMonth = lastDay.getDate()
      const startDayOfWeek = firstDay.getDay()
      
      // Draw day headers
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      try {
        ctx.font = '12px sans-serif'  // Simplified font
        ctx.fillStyle = '#888888'
        ctx.textAlign = 'center'
      } catch (error) {
        console.error('[ExportMenu] Failed to set day header font:', error)
      }
      
      const calendarY = yOffset + 30
      for (let i = 0; i < 7; i++) {
        const x = padding + (i * (cellSize + cellPadding)) + (cellSize / 2)
        ctx.fillText(dayNames[i], x, calendarY)
      }
      
      // Draw calendar grid
      let currentDay = 1
      const cellY = calendarY + 20
      
      for (let week = 0; week < 6; week++) {
        if (currentDay > daysInMonth) break
        
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
          const x = padding + (dayOfWeek * (cellSize + cellPadding))
          const y = cellY + (week * (cellSize + cellPadding))
          
          // Draw cell background
          if (week === 0 && dayOfWeek < startDayOfWeek) {
            // Empty cell before month starts
            ctx.fillStyle = '#1a1a1a'
          } else if (currentDay <= daysInMonth) {
            const cellDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), currentDay)
            const isInjectionDay = injectionDates.some(d => 
              d.getDate() === cellDate.getDate() &&
              d.getMonth() === cellDate.getMonth() &&
              d.getFullYear() === cellDate.getFullYear()
            )
            const record = records.find(r => 
              r.date.toDateString() === cellDate.toDateString()
            )
            const isToday = cellDate.toDateString() === currentDate.toDateString()
            
            // Cell background
            ctx.fillStyle = isInjectionDay ? '#3a3a3a' : '#2a2a2a'
            ctx.fillRect(x, y, cellSize, cellSize)
            
            // Cell border
            ctx.strokeStyle = '#3a3a3a'
            ctx.lineWidth = 1
            ctx.strokeRect(x, y, cellSize, cellSize)
            
            // Day number
            try {
              ctx.font = '14px sans-serif'  // Simplified font
              ctx.fillStyle = isToday ? '#fbbf24' : '#f5f5f5'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'top'
              ctx.fillText(currentDay.toString(), x + (cellSize / 2), y + 5)
            } catch (error) {
              console.error('[ExportMenu] Failed to draw day number:', error)
            }
            
            // Injection indicator
            if (isInjectionDay) {
              const indicatorY = y + cellSize - 15
              try {
                ctx.font = '10px sans-serif'  // Simplified font
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
              } catch (error) {
                console.error('[ExportMenu] Failed to set indicator font:', error)
              }
              
              if (record && !record.missed) {
                // Done
                ctx.fillStyle = '#10b981'
                ctx.fillRect(x + 5, indicatorY - 7, cellSize - 10, 14)
                ctx.fillStyle = '#ffffff'
                ctx.fillText('✓ Done', x + (cellSize / 2), indicatorY)
              } else if (record && record.missed) {
                // Missed
                ctx.fillStyle = '#ef4444'
                ctx.fillRect(x + 5, indicatorY - 7, cellSize - 10, 14)
                ctx.fillStyle = '#ffffff'
                ctx.fillText('✗ Missed', x + (cellSize / 2), indicatorY)
              } else if (cellDate < currentDate) {
                // Needs logging
                ctx.fillStyle = '#f59e0b'
                ctx.fillRect(x + 5, indicatorY - 7, cellSize - 10, 14)
                ctx.fillStyle = '#000000'
                ctx.fillText('⚠ Log', x + (cellSize / 2), indicatorY)
              } else {
                // Scheduled
                ctx.fillStyle = '#fbbf24'
                ctx.fillRect(x + 5, indicatorY - 7, cellSize - 10, 14)
                ctx.fillStyle = '#000000'
                ctx.fillText('Scheduled', x + (cellSize / 2), indicatorY)
              }
            }
            
            currentDay++
          } else {
            // Empty cell after month ends
            ctx.fillStyle = '#1a1a1a'
            ctx.fillRect(x, y, cellSize, cellSize)
          }
        }
      }
      
      yOffset += monthHeight + monthSpacing
    }
    
    // Draw legend
    const legendY = canvas.height - legendHeight - padding
    ctx.fillStyle = '#2a2a2a'
    ctx.fillRect(padding, legendY, canvasWidth - (padding * 2), legendHeight - 20)
    
    try {
      ctx.fillStyle = '#f5f5f5'
      ctx.font = '16px sans-serif'  // Simplified font
      ctx.textAlign = 'left'
      ctx.fillText('Legend', padding + 20, legendY + 25)
    } catch (error) {
      console.error('[ExportMenu] Failed to draw legend title:', error)
    }
    
    // Legend items
    const legendItems = [
      { color: '#fbbf24', textColor: '#000000', label: 'Scheduled', description: 'Upcoming injection' },
      { color: '#10b981', textColor: '#ffffff', label: '✓ Done', description: 'Completed' },
      { color: '#ef4444', textColor: '#ffffff', label: '✗ Missed', description: 'Missed dose' },
      { color: '#f59e0b', textColor: '#000000', label: '⚠ Log', description: 'Needs logging' }
    ]
    
    const legendStartX = padding + 20
    const legendItemY = legendY + 50
    const legendItemWidth = 160
    
    try {
      ctx.font = '11px sans-serif'  // Simplified font
    } catch (error) {
      console.error('[ExportMenu] Failed to set legend font:', error)
    }
    
    legendItems.forEach((item, index) => {
      const x = legendStartX + (index % 2) * (legendItemWidth * 2)
      const y = legendItemY + Math.floor(index / 2) * 30
      
      // Color box
      ctx.fillStyle = item.color
      ctx.fillRect(x, y - 8, 60, 16)
      
      // Label
      ctx.fillStyle = item.textColor
      ctx.textAlign = 'center'
      ctx.fillText(item.label, x + 30, y)
      
      // Description
      ctx.fillStyle = '#888888'
      ctx.textAlign = 'left'
      ctx.fillText(item.description, x + 70, y)
    })
    
    // Wait for next frame to ensure rendering completes
    await new Promise(resolve => requestAnimationFrame(resolve))
    
    // Final validation
    try {
      const testDataUrl = canvas.toDataURL('image/png', 1.0)
      if (!testDataUrl || testDataUrl === 'data:,' || testDataUrl.length < 100) {
        console.error('[ExportMenu] Canvas appears empty after drawing')
        throw new Error('Canvas drawing produced no visible content')
      }
      console.log('[ExportMenu] Canvas drawing complete, data URL length:', testDataUrl.length)
      
      // In development, also log a small preview
      if (process.env.NODE_ENV === 'development') {
        console.log('[ExportMenu] Canvas preview URL (first 200 chars):', testDataUrl.substring(0, 200) + '...')
      }
    } catch (validationError) {
      console.error('[ExportMenu] Canvas validation failed:', validationError)
      
      // Try to save what we have for debugging
      if (process.env.NODE_ENV === 'development') {
        try {
          const debugDataUrl = canvas.toDataURL('image/png', 0.1)
          console.log('[ExportMenu] Debug canvas state:', debugDataUrl.substring(0, 100))
        } catch (debugError) {
          console.error('[ExportMenu] Could not save debug state:', debugError)
        }
      }
      
      throw validationError
    }
    
    return canvas
  }

  // Server-side export fallback
  const handleServerSideExport = async () => {
    console.log('[ExportMenu] Starting server-side export')
    try {
      const settings = storage.getUserSettings()
      const records = storage.getInjectionRecords()
      
      if (!settings) {
        throw new Error('No settings found')
      }

      // Get injection dates
      const currentDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 3)
      
      const injectionDates = getAllInjectionDates(
        settings.protocolStartDate || new Date(),
        settings.protocol,
        endDate
      )

      // Make API request
      const response = await fetch('/api/export-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocol: settings.protocol,
          injectionDates: injectionDates.map(d => d.toISOString()),
          records: records.map(r => ({
            date: r.date.toISOString(),
            missed: r.missed,
            dose: r.dose,
          })),
          currentDate: currentDate.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Server export failed')
      }

      // Download the image
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      
      console.log('[ExportMenu] Server-side export successful')
    } catch (error) {
      console.error('[ExportMenu] Server-side export error:', error)
      alert('Export failed. Please try the "Copy as Text" option instead.')
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  // Create a text-based calendar for copying
  const createTextCalendar = () => {
    const settings = storage.getUserSettings()
    const records = storage.getInjectionRecords()
    
    if (!settings) {
      return 'No settings found'
    }

    // Get injection dates for the next 3 months
    const currentDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 3)
    
    const injectionDates = getAllInjectionDates(
      settings.protocolStartDate || settings.startDate,
      settings.protocol,
      endDate
    )

    let text = `TRT TRACKER - ${settings.protocol} PROTOCOL\n`
    text += `Generated on ${format(new Date(), 'PPP')}\n`
    text += `${'='.repeat(50)}\n\n`

    // Group injection dates by month
    const datesByMonth = new Map<string, Date[]>()
    injectionDates.forEach(date => {
      const monthKey = format(date, 'MMMM yyyy')
      if (!datesByMonth.has(monthKey)) {
        datesByMonth.set(monthKey, [])
      }
      datesByMonth.get(monthKey)!.push(date)
    })

    // Output each month
    datesByMonth.forEach((dates, monthKey) => {
      text += `${monthKey}\n${'-'.repeat(monthKey.length)}\n`
      
      dates.sort((a, b) => a.getTime() - b.getTime())
      dates.forEach(date => {
        const record = records.find(r => r.date.toDateString() === date.toDateString())
        const status = record ? (record.missed ? '[MISSED]' : '[DONE]') : 
                      (date < currentDate ? '[PENDING]' : '[SCHEDULED]')
        
        text += `${format(date, 'EEE, MMM d')} - ${status}\n`
      })
      text += '\n'
    })

    text += `\nLEGEND:\n`
    text += `[SCHEDULED] - Upcoming injection\n`
    text += `[DONE] - Completed injection\n`
    text += `[MISSED] - Missed injection\n`
    text += `[PENDING] - Past injection that needs logging\n`

    return text
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleExportPNG = async () => {
    console.log('[ExportMenu] Starting PNG export')
    setIsExporting(true)
    try {
      // Check if we're in the browser
      if (typeof window === 'undefined') {
        throw new Error('Export functionality is only available in the browser')
      }

      // Test Canvas API first
      try {
        const testCanvas = document.createElement('canvas')
        testCanvas.width = 100
        testCanvas.height = 100
        const testCtx = testCanvas.getContext('2d')
        if (!testCtx) {
          throw new Error('Canvas API not available')
        }
        testCtx.fillStyle = 'red'
        testCtx.fillRect(0, 0, 100, 100)
        const testDataUrl = testCanvas.toDataURL('image/png')
        if (!testDataUrl || testDataUrl === 'data:,') {
          throw new Error('Canvas toDataURL not working')
        }
        console.log('[ExportMenu] Canvas API test passed')
      } catch (testError) {
        console.error('[ExportMenu] Canvas API test failed:', testError)
        // Try server-side export
        console.log('[ExportMenu] Trying server-side export')
        await handleServerSideExport()
        return
      }

      // Draw calendar using Canvas API
      console.log('[ExportMenu] Drawing calendar on canvas')
      const canvas = await drawCalendarOnCanvas()
      
      console.log('[ExportMenu] Canvas drawn, checking dimensions:', { width: canvas.width, height: canvas.height })
      
      // Validate canvas before converting
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has invalid dimensions')
      }
      
      // Convert canvas to data URL
      console.log('[ExportMenu] Converting canvas to data URL')
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      
      console.log('[ExportMenu] Data URL generated, length:', dataUrl.length)
      
      if (!dataUrl || dataUrl === 'data:,' || dataUrl.length < 100) {
        throw new Error('Failed to generate valid image data')
      }

      // Download the image
      console.log('[ExportMenu] Creating download link')
      const link = document.createElement('a')
      link.download = `trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      console.log('[ExportMenu] PNG export successful')
    } catch (error) {
      console.error('[ExportMenu] Export PNG error:', error)
      // Try fallback export method
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[ExportMenu] Full error details:', { error, message: errorMessage, stack: error instanceof Error ? error.stack : 'No stack' })
      
      if (confirm(`Export failed: ${errorMessage}\n\nWould you like to try one of these alternatives?\n1. Copy as text (recommended)\n2. Try SVG export\n\nClick OK for text copy, Cancel to try SVG.`)) {
        handleCopyAsText()
      } else {
        // Try SVG export as alternative
        handleExportSVG()
      }
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  const handleCopyAsText = () => {
    try {
      const textCalendar = createTextCalendar()
      navigator.clipboard.writeText(textCalendar).then(() => {
        alert('Calendar copied to clipboard as text!')
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = textCalendar
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert('Calendar copied to clipboard as text!')
      })
    } catch (error) {
      console.error('Copy as text error:', error)
      alert('Failed to copy calendar to clipboard')
    }
    setIsOpen(false)
  }

  const handleExportPDF = async () => {
    console.log('[ExportMenu] Starting PDF export')
    setIsExporting(true)
    try {
      // Check if we're in the browser
      if (typeof window === 'undefined') {
        throw new Error('Export functionality is only available in the browser')
      }

      // Dynamic import of jsPDF
      let jsPDF
      try {
        const pdfModule = await import('jspdf')
        jsPDF = pdfModule.default || pdfModule
        
        // Verify the import was successful
        if (typeof jsPDF !== 'function') {
          throw new Error('jsPDF is not a function')
        }
      } catch (importError) {
        console.error('Failed to import jsPDF:', importError)
        throw new Error('Failed to load PDF library. Please refresh and try again.')
      }

      // Draw calendar using Canvas API
      console.log('[ExportMenu] Drawing calendar for PDF')
      const canvas = await drawCalendarOnCanvas()
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      
      if (!dataUrl || dataUrl === 'data:,' || dataUrl.length < 100) {
        throw new Error('Failed to generate valid image data for PDF')
      }
      
      // Calculate PDF dimensions to maintain aspect ratio
      const pdfWidth = 210 // A4 portrait width in mm
      const pdfHeight = (pdfWidth * canvas.height) / canvas.width

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
      console.log('[ExportMenu] PDF export successful')
    } catch (error) {
      console.error('[ExportMenu] Export PDF error:', error)
      if (confirm('The PDF export failed. Would you like to try copying as text instead?')) {
        handleCopyAsText()
      } else if (error instanceof Error) {
        alert(`Failed to export calendar: ${error.message}`)
      } else {
        alert('Failed to export calendar. Please try again.')
      }
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  // SVG-based export as fallback
  const handleExportSVG = () => {
    console.log('[ExportMenu] Starting SVG export')
    setIsExporting(true)
    try {
      const settings = storage.getUserSettings()
      const records = storage.getInjectionRecords()
      
      if (!settings) {
        throw new Error('No settings found')
      }

      // Get injection dates for the next 3 months
      const currentDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 3)
      
      const injectionDates = getAllInjectionDates(
        settings.protocolStartDate || settings.startDate,
        settings.protocol,
        endDate
      )

      // Create SVG
      const svgWidth = 800
      const svgHeight = 1200
      
      let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`
      
      // Background
      svg += `<rect width="${svgWidth}" height="${svgHeight}" fill="#1a1a1a"/>`
      
      // Header
      svg += `<text x="${svgWidth/2}" y="40" fill="#f5f5f5" font-size="28" font-family="sans-serif" text-anchor="middle">TRT Tracker - ${currentProtocol} Protocol</text>`
      svg += `<text x="${svgWidth/2}" y="65" fill="#888888" font-size="14" font-family="sans-serif" text-anchor="middle">Generated on ${format(new Date(), 'PPP')}</text>`
      
      // Simple calendar representation
      let yOffset = 100
      const startMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      
      for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
        const monthDate = new Date(startMonth)
        monthDate.setMonth(startMonth.getMonth() + monthOffset)
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        
        svg += `<text x="40" y="${yOffset}" fill="#f5f5f5" font-size="20" font-family="sans-serif">${monthName}</text>`
        yOffset += 30
        
        // List injection dates for this month
        const monthInjections = injectionDates.filter(d => 
          d.getMonth() === monthDate.getMonth() && 
          d.getFullYear() === monthDate.getFullYear()
        )
        
        monthInjections.forEach(date => {
          const record = records.find(r => r.date.toDateString() === date.toDateString())
          let status = 'Scheduled'
          let color = '#fbbf24'
          
          if (record && !record.missed) {
            status = 'Done'
            color = '#10b981'
          } else if (record && record.missed) {
            status = 'Missed'
            color = '#ef4444'
          } else if (date < currentDate) {
            status = 'Needs Log'
            color = '#f59e0b'
          }
          
          svg += `<text x="60" y="${yOffset}" fill="${color}" font-size="14" font-family="sans-serif">${format(date, 'EEE, MMM d')} - ${status}</text>`
          yOffset += 20
        })
        
        yOffset += 20
      }
      
      svg += `</svg>`
      
      // Convert SVG to blob and download
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.svg`
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log('[ExportMenu] SVG export successful')
      alert('Calendar exported as SVG successfully!')
    } catch (error) {
      console.error('[ExportMenu] SVG export error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`SVG export failed: ${errorMessage}\n\nPlease try copying as text instead.`)
      handleCopyAsText()
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  // HTML table export as another fallback
  const handleExportHTML = () => {
    console.log('[ExportMenu] Starting HTML export')
    setIsExporting(true)
    try {
      const settings = storage.getUserSettings()
      const records = storage.getInjectionRecords()
      
      if (!settings) {
        throw new Error('No settings found')
      }

      // Get injection dates for the next 3 months
      const currentDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 3)
      
      const injectionDates = getAllInjectionDates(
        settings.protocolStartDate || settings.startDate,
        settings.protocol,
        endDate
      )

      // Create HTML
      let html = `<!DOCTYPE html>
<html>
<head>
<title>TRT Calendar - ${currentProtocol} Protocol</title>
<style>
body { font-family: sans-serif; background: #1a1a1a; color: #f5f5f5; padding: 20px; }
h1 { text-align: center; color: #fbbf24; }
h2 { color: #f5f5f5; margin-top: 30px; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; }
th, td { border: 1px solid #3a3a3a; padding: 10px; text-align: left; }
th { background: #2a2a2a; }
.done { background: #10b981; color: white; }
.missed { background: #ef4444; color: white; }
.pending { background: #f59e0b; color: black; }
.scheduled { background: #fbbf24; color: black; }
</style>
</head>
<body>
<h1>TRT Tracker - ${currentProtocol} Protocol</h1>
<p style="text-align: center; color: #888;">Generated on ${format(new Date(), 'PPP')}</p>
`

      // Group by month
      const datesByMonth = new Map<string, Date[]>()
      injectionDates.forEach(date => {
        const monthKey = format(date, 'MMMM yyyy')
        if (!datesByMonth.has(monthKey)) {
          datesByMonth.set(monthKey, [])
        }
        datesByMonth.get(monthKey)!.push(date)
      })

      // Create table for each month
      datesByMonth.forEach((dates, monthKey) => {
        html += `<h2>${monthKey}</h2>
<table>
<tr><th>Date</th><th>Day</th><th>Status</th></tr>
`
        
        dates.sort((a, b) => a.getTime() - b.getTime())
        dates.forEach(date => {
          const record = records.find(r => r.date.toDateString() === date.toDateString())
          let status = 'Scheduled'
          let className = 'scheduled'
          
          if (record && !record.missed) {
            status = 'Done'
            className = 'done'
          } else if (record && record.missed) {
            status = 'Missed'
            className = 'missed'
          } else if (date < currentDate) {
            status = 'Needs Log'
            className = 'pending'
          }
          
          html += `<tr>
<td>${format(date, 'MMM d, yyyy')}</td>
<td>${format(date, 'EEEE')}</td>
<td class="${className}">${status}</td>
</tr>
`
        })
        
        html += `</table>
`
      })

      html += `</body>
</html>`

      // Download HTML file
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.html`
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log('[ExportMenu] HTML export successful')
      alert('Calendar exported as HTML successfully! You can open this file in any web browser.')
    } catch (error) {
      console.error('[ExportMenu] HTML export error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`HTML export failed: ${errorMessage}`)
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  const handleEmailCalendar = async () => {
    console.log('[ExportMenu] Starting email export')
    setIsExporting(true)
    try {
      // Check if we're in the browser
      if (typeof window === 'undefined') {
        throw new Error('Export functionality is only available in the browser')
      }

      // Draw calendar using Canvas API
      console.log('[ExportMenu] Drawing calendar for email')
      const canvas = await drawCalendarOnCanvas()
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to generate image blob'))
          }
        }, 'image/png', 1.0)
      })

      // Create a temporary link to download the image first
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)

      // Then open email client with text calendar in body
      const textCalendar = createTextCalendar()
      const subject = `TRT Calendar - ${currentProtocol}`
      const body = `${textCalendar}\n\nNote: A calendar image has been downloaded to your device. Please attach it to this email.`
      
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.location.href = mailtoLink
      console.log('[ExportMenu] Email export initiated')
    } catch (error) {
      console.error('[ExportMenu] Export email error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (confirm(`Email export failed: ${errorMessage}\n\nWould you like to copy the calendar as text instead?`)) {
        handleCopyAsText()
      }
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  return (
    <div ref={dropdownRef} className="relative" data-export-button>
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative px-6 py-3 bg-zinc-950 border border-amber-500/30 rounded-xl
                   hover:border-amber-500/40 transition-all duration-500 overflow-hidden
                   hover:scale-105 transform-gpu"
        aria-label="Export calendar"
      >
        {/* Gold glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 
                        translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        
        <div className="relative flex items-center gap-2">
          <Download className="w-4 h-4 text-amber-500/80 group-hover:text-amber-500 transition-colors" />
          <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
            Export
          </span>
          <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 transform origin-top-right transition-all duration-300 animate-slideDown">
          <div className="bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
            {/* Glass morphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            
            {/* Grain texture overlay */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
                 style={{
                   backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                 }}
            />
            
            <div className="relative p-2">
              {/* PNG Export */}
              <button
                onClick={handleExportPNG}
                disabled={isExporting}
                className="w-full group relative px-4 py-3 rounded-lg
                         hover:bg-zinc-900/50 transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-3"
              >
                <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  <FileImage className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-zinc-200">Export as PNG</p>
                  <p className="text-xs text-zinc-500">High-quality image</p>
                </div>
              </button>
              
              {/* PDF Export */}
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="w-full group relative px-4 py-3 rounded-lg
                         hover:bg-zinc-900/50 transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-3"
              >
                <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  <FileText className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-zinc-200">Export as PDF</p>
                  <p className="text-xs text-zinc-500">Printable document</p>
                </div>
              </button>
              
              {/* Email Export */}
              <button
                onClick={handleEmailCalendar}
                disabled={isExporting}
                className="w-full group relative px-4 py-3 rounded-lg
                         hover:bg-zinc-900/50 transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-3"
              >
                <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  <Mail className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-zinc-200">Email Calendar</p>
                  <p className="text-xs text-zinc-500">Download & email</p>
                </div>
              </button>
              
              {/* Divider */}
              <div className="my-2 border-t border-zinc-800/50" />
              
              {/* Copy as Text */}
              <button
                onClick={handleCopyAsText}
                disabled={isExporting}
                className="w-full group relative px-4 py-3 rounded-lg
                         hover:bg-zinc-900/50 transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-3"
              >
                <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  <Copy className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-zinc-200">Copy as Text</p>
                  <p className="text-xs text-zinc-500">Simple text format</p>
                </div>
              </button>
              
              {/* HTML Export */}
              <button
                onClick={handleExportHTML}
                disabled={isExporting}
                className="w-full group relative px-4 py-3 rounded-lg
                         hover:bg-zinc-900/50 transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-3"
              >
                <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  <FileText className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-zinc-200">Export as HTML</p>
                  <p className="text-xs text-zinc-500">Open in browser</p>
                </div>
              </button>
              
              {/* Test Canvas Export - Hidden by default, uncomment to show */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => {
                    // Simple test to verify Canvas API works
                    try {
                      const canvas = document.createElement('canvas')
                      canvas.width = 200
                      canvas.height = 200
                      const ctx = canvas.getContext('2d')
                      if (!ctx) throw new Error('No context')
                      
                      // Draw a simple red square
                      ctx.fillStyle = 'red'
                      ctx.fillRect(50, 50, 100, 100)
                      
                      // Draw some text
                      ctx.fillStyle = 'white'
                      ctx.font = '20px Arial'
                      ctx.fillText('TEST', 75, 110)
                      
                      const dataUrl = canvas.toDataURL('image/png')
                      const link = document.createElement('a')
                      link.download = 'canvas-test.png'
                      link.href = dataUrl
                      link.click()
                      
                      alert('Test canvas exported successfully!')
                    } catch (error) {
                      alert(`Canvas test failed: ${error}`)
                    }
                  }}
                  className="w-full group relative px-4 py-3 rounded-lg
                           hover:bg-zinc-900/50 transition-all duration-300
                           flex items-center gap-3"
                >
                  <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                    <FileImage className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-zinc-200">Test Canvas</p>
                    <p className="text-xs text-zinc-500">Debug only</p>
                  </div>
                </button>
              )}
            </div>
            
            {/* Loading State */}
            {isExporting && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                  <p className="text-xs text-zinc-400">Exporting...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}