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



  // Create a simplified, export-friendly version of the calendar
  const createExportableCalendar = () => {
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

    // Create a simple HTML structure
    const container = document.createElement('div')
    container.style.cssText = `
      width: 800px;
      padding: 40px;
      background-color: #1a1a1a;
      color: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `

    // Add header
    const header = document.createElement('div')
    header.style.cssText = `
      text-align: center;
      margin-bottom: 30px;
    `
    header.innerHTML = `
      <h1 style="font-size: 28px; font-weight: 300; margin: 0; color: #f5f5f5;">
        TRT Tracker - ${currentProtocol} Protocol
      </h1>
      <p style="font-size: 14px; color: #888; margin-top: 10px;">
        Generated on ${format(new Date(), 'PPP')}
      </p>
    `
    container.appendChild(header)

    // Create calendar for each month
    const startMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const monthDate = new Date(startMonth)
      monthDate.setMonth(startMonth.getMonth() + monthOffset)
      
      const monthContainer = document.createElement('div')
      monthContainer.style.cssText = `
        margin-bottom: 40px;
        page-break-inside: avoid;
      `

      // Month header
      const monthHeader = document.createElement('h2')
      monthHeader.style.cssText = `
        font-size: 20px;
        font-weight: 400;
        margin-bottom: 15px;
        color: #f5f5f5;
      `
      monthHeader.textContent = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      monthContainer.appendChild(monthHeader)

      // Create table
      const table = document.createElement('table')
      table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        background-color: #2a2a2a;
        border: 1px solid #3a3a3a;
      `

      // Add day headers
      const headerRow = document.createElement('tr')
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      dayNames.forEach(day => {
        const th = document.createElement('th')
        th.style.cssText = `
          padding: 10px;
          text-align: center;
          font-weight: 500;
          font-size: 12px;
          color: #888;
          border: 1px solid #3a3a3a;
        `
        th.textContent = day
        headerRow.appendChild(th)
      })
      table.appendChild(headerRow)

      // Calculate days in month
      const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      const daysInMonth = lastDay.getDate()
      const startDayOfWeek = firstDay.getDay()

      // Create calendar rows
      let currentDay = 1
      for (let week = 0; week < 6; week++) {
        if (currentDay > daysInMonth) break

        const row = document.createElement('tr')
        
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
          const cell = document.createElement('td')
          cell.style.cssText = `
            padding: 15px 10px;
            text-align: center;
            border: 1px solid #3a3a3a;
            height: 60px;
            vertical-align: top;
            position: relative;
          `

          if (week === 0 && dayOfWeek < startDayOfWeek) {
            // Empty cell before month starts
            cell.style.backgroundColor = '#1a1a1a'
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

            // Day number
            const dayNumber = document.createElement('div')
            dayNumber.style.cssText = `
              font-size: 14px;
              color: ${isToday ? '#fbbf24' : '#f5f5f5'};
              margin-bottom: 5px;
            `
            dayNumber.textContent = currentDay.toString()
            cell.appendChild(dayNumber)

            // Injection indicator
            if (isInjectionDay) {
              cell.style.backgroundColor = '#3a3a3a'
              
              const indicator = document.createElement('div')
              indicator.style.cssText = `
                font-size: 11px;
                padding: 2px 6px;
                border-radius: 4px;
                display: inline-block;
              `

              if (record && !record.missed) {
                indicator.style.backgroundColor = '#10b981'
                indicator.style.color = '#ffffff'
                indicator.textContent = '✓ Done'
              } else if (record && record.missed) {
                indicator.style.backgroundColor = '#ef4444'
                indicator.style.color = '#ffffff'
                indicator.textContent = '✗ Missed'
              } else if (cellDate < currentDate) {
                indicator.style.backgroundColor = '#f59e0b'
                indicator.style.color = '#000000'
                indicator.textContent = '⚠ Log'
              } else {
                indicator.style.backgroundColor = '#fbbf24'
                indicator.style.color = '#000000'
                indicator.textContent = 'Scheduled'
              }
              
              cell.appendChild(indicator)
            }

            currentDay++
          } else {
            // Empty cell after month ends
            cell.style.backgroundColor = '#1a1a1a'
          }

          row.appendChild(cell)
        }
        
        table.appendChild(row)
      }

      monthContainer.appendChild(table)
      container.appendChild(monthContainer)
    }

    // Add legend
    const legend = document.createElement('div')
    legend.style.cssText = `
      margin-top: 30px;
      padding: 20px;
      background-color: #2a2a2a;
      border-radius: 8px;
    `
    legend.innerHTML = `
      <h3 style="font-size: 16px; margin-bottom: 15px; color: #f5f5f5;">Legend</h3>
      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 60px; padding: 4px 8px; background-color: #fbbf24; color: #000; border-radius: 4px; font-size: 11px; text-align: center;">Scheduled</span>
          <span style="color: #888; font-size: 12px;">Upcoming injection</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 60px; padding: 4px 8px; background-color: #10b981; color: #fff; border-radius: 4px; font-size: 11px; text-align: center;">✓ Done</span>
          <span style="color: #888; font-size: 12px;">Completed</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 60px; padding: 4px 8px; background-color: #ef4444; color: #fff; border-radius: 4px; font-size: 11px; text-align: center;">✗ Missed</span>
          <span style="color: #888; font-size: 12px;">Missed dose</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 60px; padding: 4px 8px; background-color: #f59e0b; color: #000; border-radius: 4px; font-size: 11px; text-align: center;">⚠ Log</span>
          <span style="color: #888; font-size: 12px;">Needs logging</span>
        </div>
      </div>
    `
    container.appendChild(legend)

    return container
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

      // Dynamic import of dom-to-image-more
      let domtoimage
      try {
        const domtoimageModule = await import('dom-to-image-more')
        domtoimage = domtoimageModule.default || domtoimageModule
      } catch (importError) {
        console.error('Failed to import dom-to-image-more:', importError)
        throw new Error('Failed to load export library. Please refresh and try again.')
      }

      // First try to capture the actual calendar element
      const calendarContainer = document.querySelector('.calendar-container')
      let dataUrl = null
      
      if (calendarContainer) {
        try {
          // Try capturing the actual calendar with better CSS handling
          dataUrl = await domtoimage.toPng(calendarContainer as HTMLElement, {
            quality: 1.0,
            bgcolor: '#1a1a1a',
            width: (calendarContainer as HTMLElement).offsetWidth,
            height: (calendarContainer as HTMLElement).offsetHeight,
            style: {
              transform: 'scale(1)',
              transformOrigin: 'top left'
            }
          })
        } catch (actualCalendarError) {
          console.warn('Failed to capture actual calendar, falling back to simplified version:', actualCalendarError)
        }
      }

      // If actual calendar capture failed, fall back to simplified version
      if (!dataUrl) {
        // Create the simplified calendar element
        const exportElement = createExportableCalendar()

        // Create a temporary container off-screen
        const tempContainer = document.createElement('div')
        tempContainer.style.cssText = `
          position: fixed !important;
          left: -9999px !important;
          top: 0 !important;
          z-index: -1000 !important;
        `
        document.body.appendChild(tempContainer)
        tempContainer.appendChild(exportElement)

        // Wait for render
        await new Promise(resolve => setTimeout(resolve, 100))

        // Capture the simplified calendar
        dataUrl = await domtoimage.toPng(exportElement, {
          quality: 1.0,
          bgcolor: '#1a1a1a',
          width: 800,
          height: exportElement.offsetHeight
        })

        // Clean up
        document.body.removeChild(tempContainer)
      }

      // Download the image
      const link = document.createElement('a')
      link.download = `trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Export PNG error:', error)
      // Try fallback export method
      if (confirm('The standard export failed. Would you like to try copying as text instead?')) {
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

      // Dynamic import of dom-to-image-more and jsPDF
      let domtoimage, jsPDF
      try {
        const domtoimageModule = await import('dom-to-image-more')
        domtoimage = domtoimageModule.default || domtoimageModule
        
        const pdfModule = await import('jspdf')
        jsPDF = pdfModule.default || pdfModule
        
        // Verify the imports were successful
        if (typeof jsPDF !== 'function') {
          throw new Error('jsPDF is not a function')
        }
      } catch (importError) {
        console.error('Failed to import export libraries:', importError)
        throw new Error('Failed to load export libraries. Please refresh and try again.')
      }

      // First try to capture the actual calendar element
      const calendarContainer = document.querySelector('.calendar-container')
      let dataUrl = null
      let width = 800
      let height = 600
      
      if (calendarContainer) {
        try {
          // Try capturing the actual calendar with better CSS handling
          width = (calendarContainer as HTMLElement).offsetWidth
          height = (calendarContainer as HTMLElement).offsetHeight
          dataUrl = await domtoimage.toPng(calendarContainer as HTMLElement, {
            quality: 1.0,
            bgcolor: '#1a1a1a',
            width: width,
            height: height,
            style: {
              transform: 'scale(1)',
              transformOrigin: 'top left'
            }
          })
        } catch (actualCalendarError) {
          console.warn('Failed to capture actual calendar, falling back to simplified version:', actualCalendarError)
        }
      }

      // If actual calendar capture failed, fall back to simplified version
      if (!dataUrl) {
        // Create the simplified calendar element
        const exportElement = createExportableCalendar()

        // Create a temporary container off-screen
        const tempContainer = document.createElement('div')
        tempContainer.style.cssText = `
          position: fixed !important;
          left: -9999px !important;
          top: 0 !important;
          z-index: -1000 !important;
        `
        document.body.appendChild(tempContainer)
        tempContainer.appendChild(exportElement)

        // Wait for render
        await new Promise(resolve => setTimeout(resolve, 100))

        width = 800
        height = exportElement.offsetHeight
        
        // Capture the simplified calendar
        dataUrl = await domtoimage.toPng(exportElement, {
          quality: 1.0,
          bgcolor: '#1a1a1a',
          width: width,
          height: height
        })

        // Clean up
        document.body.removeChild(tempContainer)
      }
      
      // Calculate PDF dimensions to maintain aspect ratio
      const pdfWidth = 210 // A4 portrait width in mm
      const pdfHeight = (pdfWidth * height) / width

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

      // Dynamic import of dom-to-image-more
      let domtoimage
      try {
        const domtoimageModule = await import('dom-to-image-more')
        domtoimage = domtoimageModule.default || domtoimageModule
      } catch (importError) {
        console.error('Failed to import dom-to-image-more:', importError)
        throw new Error('Failed to load export library. Please refresh and try again.')
      }

      // First try to capture the actual calendar element
      const calendarContainer = document.querySelector('.calendar-container')
      let blob = null
      
      if (calendarContainer) {
        try {
          // Try capturing the actual calendar with better CSS handling
          blob = await domtoimage.toBlob(calendarContainer as HTMLElement, {
            quality: 1.0,
            bgcolor: '#1a1a1a',
            width: (calendarContainer as HTMLElement).offsetWidth,
            height: (calendarContainer as HTMLElement).offsetHeight,
            style: {
              transform: 'scale(1)',
              transformOrigin: 'top left'
            }
          })
        } catch (actualCalendarError) {
          console.warn('Failed to capture actual calendar, falling back to simplified version:', actualCalendarError)
        }
      }

      // If actual calendar capture failed, fall back to simplified version
      if (!blob) {
        // Create the simplified calendar element
        const exportElement = createExportableCalendar()

        // Create a temporary container off-screen
        const tempContainer = document.createElement('div')
        tempContainer.style.cssText = `
          position: fixed !important;
          left: -9999px !important;
          top: 0 !important;
          z-index: -1000 !important;
        `
        document.body.appendChild(tempContainer)
        tempContainer.appendChild(exportElement)

        // Wait for render
        await new Promise(resolve => setTimeout(resolve, 100))

        // Capture the simplified calendar as blob
        blob = await domtoimage.toBlob(exportElement, {
          quality: 1.0,
          bgcolor: '#1a1a1a',
          width: 800,
          height: exportElement.offsetHeight
        })

        // Clean up
        document.body.removeChild(tempContainer)
      }

      if (!blob) {
        throw new Error('Failed to generate image blob')
      }

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