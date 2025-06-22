'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Download, FileImage, FileText, ChevronDown } from 'lucide-react'
import { format, startOfMonth, getDaysInMonth } from 'date-fns'
import { jsPDF } from 'jspdf'
import { getAllInjectionDates, formatDose, calculateDose } from '@/lib/calculations'
import { storage } from '@/lib/storage'

interface ExportMenuProps {
  currentProtocol?: string
}

export default function ExportMenu({}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const drawCalendarOnCanvas = () => {
    // Create canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    // Set dimensions
    const width = 800
    const height = 700
    canvas.width = width
    canvas.height = height

    // Fill background
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, width, height)

    // Get data from localStorage
    const settingsStr = localStorage.getItem('trt-settings')
    const settings = settingsStr ? JSON.parse(settingsStr) : null
    
    if (!settings) {
      ctx.fillStyle = '#ffffff'
      ctx.font = '20px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('No TRT settings found', width / 2, height / 2)
      return canvas
    }
    
    const protocol = settings.protocol || 'E3D'

    // Get injection dates and records
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1) // Get dates for current month
    const injectionDates = getAllInjectionDates(
      new Date(settings.protocolStartDate || settings.startDate),
      protocol,
      endDate
    )
    
    const records = storage.getInjectionRecords()
    const calculation = calculateDose(settings)

    // Title
    ctx.fillStyle = '#ffffff'
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`TRT Tracker - ${protocol}`, width / 2, 40)

    // Month
    const now = new Date()
    const monthYear = format(now, 'MMMM yyyy')
    ctx.font = '18px Arial'
    ctx.fillText(monthYear, width / 2, 80)

    // Calendar grid
    const cellWidth = 100
    const cellHeight = 70
    const startX = 50
    const startY = 120
    
    // Day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    ctx.font = '14px Arial'
    ctx.fillStyle = '#888888'
    days.forEach((day, i) => {
      ctx.textAlign = 'center'
      ctx.fillText(day, startX + (i * cellWidth) + cellWidth/2, startY - 10)
    })

    // Calendar days
    const firstDay = startOfMonth(now)
    const daysInMonth = getDaysInMonth(now)
    const startDayOfWeek = firstDay.getDay()

    // Helper function to check if a date is an injection day
    const isInjectionDay = (date: Date) => {
      return injectionDates.some(d => 
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
      )
    }

    // Helper function to get record for date
    const getRecordForDate = (date: Date) => {
      return records.find(r => 
        new Date(r.date).toDateString() === date.toDateString()
      )
    }

    // Draw grid
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 1
    
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        const x = startX + (day * cellWidth)
        const y = startY + (week * cellHeight)
        
        // Draw cell
        ctx.strokeRect(x, y, cellWidth, cellHeight)
        
        // Calculate day number
        const dayNum = week * 7 + day - startDayOfWeek + 1
        
        if (dayNum > 0 && dayNum <= daysInMonth) {
          const currentDate = new Date(now.getFullYear(), now.getMonth(), dayNum)
          const isInjection = isInjectionDay(currentDate)
          const record = getRecordForDate(currentDate)
          const isToday = currentDate.toDateString() === new Date().toDateString()
          
          // Highlight today
          if (isToday) {
            ctx.fillStyle = '#fbbf2433'
            ctx.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4)
          }
          
          // Day number
          ctx.fillStyle = isToday ? '#fbbf24' : '#ffffff'
          ctx.font = '16px Arial'
          ctx.textAlign = 'left'
          ctx.fillText(dayNum.toString(), x + 10, y + 25)
          
          // Injection info
          if (isInjection) {
            // Background for injection day
            if (record && record.missed) {
              ctx.fillStyle = '#ef4444'
            } else if (record && !record.missed) {
              ctx.fillStyle = '#10b981'
            } else if (currentDate < new Date()) {
              ctx.fillStyle = '#f59e0b'
            } else {
              ctx.fillStyle = '#fbbf24'
            }
            
            ctx.fillRect(x + 5, y + cellHeight - 25, cellWidth - 10, 20)
            
            // Text
            ctx.fillStyle = '#000000'
            ctx.font = '12px Arial'
            ctx.textAlign = 'center'
            
            if (record && record.missed) {
              ctx.fillText('Missed', x + cellWidth/2, y + cellHeight - 10)
            } else if (record && !record.missed) {
              ctx.fillText('Done', x + cellWidth/2, y + cellHeight - 10)
            } else if (currentDate < new Date()) {
              ctx.fillText('Log', x + cellWidth/2, y + cellHeight - 10)
            } else {
              ctx.fillText(formatDose(calculation.mgPerInjection, 'mg'), x + cellWidth/2, y + cellHeight - 10)
            }
          }
        }
      }
    }

    // Legend
    ctx.fillStyle = '#888888'
    ctx.font = '12px Arial'
    ctx.textAlign = 'left'
    const legendY = height - 60
    
    // Legend items
    const legendItems = [
      { color: '#fbbf24', text: 'Scheduled' },
      { color: '#10b981', text: 'Completed' },
      { color: '#ef4444', text: 'Missed' },
      { color: '#f59e0b', text: 'Needs Logging' }
    ]
    
    legendItems.forEach((item, index) => {
      const legendX = 50 + (index * 180)
      ctx.fillStyle = item.color
      ctx.fillRect(legendX, legendY, 15, 15)
      ctx.fillStyle = '#888888'
      ctx.fillText(item.text, legendX + 20, legendY + 12)
    })

    return canvas
  }

  const handleExportPNG = async () => {
    setIsExporting(true)
    try {
      const canvas = drawCalendarOnCanvas()
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Failed to create image')
        
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.png`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
      }, 'image/png')
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export calendar')
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const canvas = drawCalendarOnCanvas()
      const imgData = canvas.toDataURL('image/png')
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export calendar')
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  return (
    <div ref={dropdownRef} className="relative" data-export-button>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative px-6 py-3 bg-zinc-950 border border-amber-500/30 rounded-xl
                   hover:border-amber-500/40 transition-all duration-500 overflow-hidden
                   hover:scale-105 transform-gpu"
        aria-label="Export calendar"
      >
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

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 transform origin-top-right transition-all duration-300 animate-slideDown">
          <div className="bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            
            <div className="relative p-2">
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
                  <p className="text-xs text-zinc-500">Download calendar image</p>
                </div>
              </button>
              
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
                  <p className="text-xs text-zinc-500">Download calendar PDF</p>
                </div>
              </button>
            </div>
            
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