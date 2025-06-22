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
  const drawCalendarOnCanvas = (): HTMLCanvasElement => {
    // Get user settings and injection records
    const settings = storage.getUserSettings()
    const records = storage.getInjectionRecords()
    
    if (!settings) {
      throw new Error('No settings found')
    }

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
    const ctx = canvas.getContext('2d')
    if (!ctx) {
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

    // Set up canvas styles
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw header
    ctx.fillStyle = '#f5f5f5'
    ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`TRT Tracker - ${currentProtocol} Protocol`, canvasWidth / 2, padding + 30)
    
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillStyle = '#888888'
    ctx.fillText(`Generated on ${format(new Date(), 'PPP')}`, canvasWidth / 2, padding + 55)

    // Draw calendars for each month
    let yOffset = headerHeight + padding
    const startMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    
    for (let monthOffset = 0; monthOffset < numMonths; monthOffset++) {
      const monthDate = new Date(startMonth)
      monthDate.setMonth(startMonth.getMonth() + monthOffset)
      
      // Month header
      ctx.fillStyle = '#f5f5f5'
      ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.textAlign = 'left'
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      ctx.fillText(monthName, padding, yOffset)
      
      // Calculate days in month
      const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      const daysInMonth = lastDay.getDate()
      const startDayOfWeek = firstDay.getDay()
      
      // Draw day headers
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillStyle = '#888888'
      ctx.textAlign = 'center'
      
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
            ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            ctx.fillStyle = isToday ? '#fbbf24' : '#f5f5f5'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            ctx.fillText(currentDay.toString(), x + (cellSize / 2), y + 5)
            
            // Injection indicator
            if (isInjectionDay) {
              const indicatorY = y + cellSize - 15
              ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              
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
    
    ctx.fillStyle = '#f5f5f5'
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Legend', padding + 20, legendY + 25)
    
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
    
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    
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
    
    return canvas
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
    setIsExporting(true)
    try {
      // Check if we're in the browser
      if (typeof window === 'undefined') {
        throw new Error('Export functionality is only available in the browser')
      }

      // Draw calendar using Canvas API
      const canvas = drawCalendarOnCanvas()
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png', 1.0)

      // Download the image
      const link = document.createElement('a')
      link.download = `trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Export PNG error:', error)
      // Try fallback export method
      if (confirm('The export failed. Would you like to try copying as text instead?')) {
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
      const canvas = drawCalendarOnCanvas()
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      
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
    } catch (error) {
      console.error('Export PDF error:', error)
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

  const handleEmailCalendar = async () => {
    setIsExporting(true)
    try {
      // Check if we're in the browser
      if (typeof window === 'undefined') {
        throw new Error('Export functionality is only available in the browser')
      }

      // Draw calendar using Canvas API
      const canvas = drawCalendarOnCanvas()
      
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
    } catch (error) {
      console.error('Export email error:', error)
      if (confirm('The email export failed. Would you like to copy the calendar as text instead?')) {
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