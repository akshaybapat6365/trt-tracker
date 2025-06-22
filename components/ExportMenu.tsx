'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Download, FileImage, FileText, ChevronDown } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { domToPng } from 'modern-screenshot'
import { jsPDF } from 'jspdf'

interface ExportMenuProps {
  currentProtocol?: string
}

interface StoredData {
  injections: Array<{
    date: string
    dose: string
    time: string
    notes: string
  }>
  selectedDays: string[]
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

  const createSimpleCalendarHTML = () => {
    // Get current date and stored data
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    // Get data from localStorage
    const storedData = localStorage.getItem('trtData')
    const data: StoredData = storedData ? JSON.parse(storedData) : { injections: [], selectedDays: [] }
    
    // Create injection map for quick lookup
    const injectionMap = new Map()
    data.injections.forEach(injection => {
      injectionMap.set(injection.date, injection)
    })

    // Build HTML
    let html = `
      <div style="
        width: 800px;
        padding: 40px;
        background-color: #0a0a0a;
        color: #ffffff;
        font-family: Arial, sans-serif;
      ">
        <h1 style="
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 30px;
          color: #f59e0b;
        ">
          TRT Calendar - ${format(now, 'MMMM yyyy')}
        </h1>
        
        <table style="
          width: 100%;
          border-collapse: collapse;
          background-color: #18181b;
          border: 1px solid #3f3f46;
        ">
          <thead>
            <tr>
    `

    // Add day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    dayNames.forEach(day => {
      html += `
        <th style="
          padding: 12px;
          text-align: center;
          font-size: 14px;
          font-weight: normal;
          color: #a1a1aa;
          border-bottom: 1px solid #3f3f46;
        ">${day}</th>
      `
    })

    html += `
          </tr>
        </thead>
        <tbody>
    `

    // Add calendar days
    let weekRow = '<tr>'
    const firstDayOfWeek = getDay(monthStart)
    
    // Add empty cells for days before month start
    for (let i = 0; i < firstDayOfWeek; i++) {
      weekRow += '<td style="padding: 8px; border: 1px solid #3f3f46;"></td>'
    }

    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const injection = injectionMap.get(dateStr)
      const isSelected = data.selectedDays.includes(String(day.getDate()))
      const dayOfWeek = getDay(day)

      let cellStyle = `
        padding: 8px;
        border: 1px solid #3f3f46;
        text-align: center;
        vertical-align: top;
        height: 80px;
        position: relative;
      `

      if (injection) {
        cellStyle += `background-color: #1e293b;`
      } else if (isSelected) {
        cellStyle += `background-color: #27272a;`
      }

      weekRow += `<td style="${cellStyle}">`
      
      // Day number
      weekRow += `<div style="
        font-size: 14px;
        font-weight: ${injection ? 'bold' : 'normal'};
        color: ${injection ? '#f59e0b' : '#ffffff'};
        margin-bottom: 4px;
      ">${day.getDate()}</div>`

      // Injection info
      if (injection) {
        weekRow += `
          <div style="
            font-size: 11px;
            color: #fbbf24;
            margin-top: 4px;
          ">
            ${injection.dose}mg
          </div>
        `
        if (injection.time) {
          weekRow += `
            <div style="
              font-size: 10px;
              color: #a1a1aa;
              margin-top: 2px;
            ">
              ${injection.time}
            </div>
          `
        }
      }

      weekRow += '</td>'

      // Start new row after Saturday
      if (dayOfWeek === 6) {
        html += weekRow + '</tr>'
        weekRow = '<tr>'
      }
    })

    // Close any incomplete week row
    if (weekRow !== '<tr>') {
      // Fill remaining cells
      const lastDayOfWeek = getDay(monthEnd)
      for (let i = lastDayOfWeek + 1; i < 7; i++) {
        weekRow += '<td style="padding: 8px; border: 1px solid #3f3f46;"></td>'
      }
      html += weekRow + '</tr>'
    }

    html += `
        </tbody>
      </table>
      
      <div style="
        margin-top: 30px;
        padding: 20px;
        background-color: #18181b;
        border: 1px solid #3f3f46;
        border-radius: 8px;
      ">
        <h3 style="
          font-size: 16px;
          font-weight: bold;
          color: #f59e0b;
          margin-bottom: 10px;
        ">Legend</h3>
        
        <div style="display: flex; gap: 20px; font-size: 14px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="
              width: 20px;
              height: 20px;
              background-color: #1e293b;
              border: 1px solid #f59e0b;
            "></div>
            <span style="color: #a1a1aa;">Injection Day</span>
          </div>
          
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="
              width: 20px;
              height: 20px;
              background-color: #27272a;
              border: 1px solid #3f3f46;
            "></div>
            <span style="color: #a1a1aa;">Scheduled Day</span>
          </div>
        </div>
      </div>
      
      <div style="
        margin-top: 20px;
        text-align: center;
        font-size: 12px;
        color: #71717a;
      ">
        Generated on ${format(new Date(), 'PPP')}
      </div>
    </div>
    `

    return html
  }

  const handleExportPNG = async () => {
    setIsExporting(true)
    try {
      // Create temporary container
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = createSimpleCalendarHTML()
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '0'
      document.body.appendChild(tempDiv)

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 100))

      // Capture the element
      const dataUrl = await domToPng(tempDiv.firstElementChild as HTMLElement, {
        scale: 2,
        backgroundColor: '#0a0a0a'
      })

      // Clean up
      document.body.removeChild(tempDiv)

      // Download
      const link = document.createElement('a')
      link.download = `trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Export PNG error:', error)
      alert('Failed to export calendar as PNG')
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      // Create temporary container
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = createSimpleCalendarHTML()
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '0'
      document.body.appendChild(tempDiv)

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 100))

      // Capture the element
      const dataUrl = await domToPng(tempDiv.firstElementChild as HTMLElement, {
        scale: 2,
        backgroundColor: '#0a0a0a'
      })

      // Clean up
      document.body.removeChild(tempDiv)

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: 'a4'
      })

      const img = new Image()
      img.src = dataUrl
      
      await new Promise((resolve) => {
        img.onload = resolve
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = img.width
      const imgHeight = img.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const width = imgWidth * ratio
      const height = imgHeight * ratio
      const x = (pdfWidth - width) / 2
      const y = (pdfHeight - height) / 2

      pdf.addImage(dataUrl, 'PNG', x, y, width, height)
      pdf.save(`trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    } catch (error) {
      console.error('Export PDF error:', error)
      alert('Failed to export calendar as PDF')
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
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
            
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
                 style={{
                   backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                 }}
            />
            
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
                  <p className="text-xs text-zinc-500">High-quality image</p>
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
                  <p className="text-xs text-zinc-500">Printable document</p>
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