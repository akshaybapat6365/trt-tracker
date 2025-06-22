'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Download, FileImage, FileText, Mail, ChevronDown } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { format } from 'date-fns'

interface ExportMenuProps {
  currentProtocol: string
}

export default function ExportMenu({ currentProtocol }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Helper function to prepare element for export
  const prepareElementForExport = (originalElement: HTMLElement) => {
    // Clone the element
    const clonedElement = originalElement.cloneNode(true) as HTMLElement
    
    // Apply base styles to the container
    clonedElement.style.cssText = `
      background-color: #1a1a1a !important;
      border: 1px solid #2a2a2a !important;
      border-radius: 16px !important;
      padding: 32px !important;
      position: relative !important;
      width: ${originalElement.offsetWidth}px !important;
      height: ${originalElement.offsetHeight}px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif !important;
    `

    // Apply specific styles to calendar elements
    const monthHeaders = clonedElement.querySelectorAll('h2, h3')
    monthHeaders.forEach((header) => {
      const el = header as HTMLElement
      el.style.color = '#f5f5f5'
      el.style.fontWeight = '300'
      el.style.letterSpacing = '-0.02em'
    })

    // Style calendar grid
    const calendarGrids = clonedElement.querySelectorAll('[class*="grid"]')
    calendarGrids.forEach((grid) => {
      const el = grid as HTMLElement
      if (el.classList.contains('grid-cols-7')) {
        el.style.display = 'grid'
        el.style.gridTemplateColumns = 'repeat(7, 1fr)'
        el.style.gap = '4px'
      }
    })

    // Style all day cells
    const dayCells = clonedElement.querySelectorAll('[class*="rounded"]')
    dayCells.forEach((cell) => {
      const el = cell as HTMLElement
      // Preserve background colors for injection days
      if (!el.style.backgroundColor || el.style.backgroundColor === 'transparent') {
        el.style.backgroundColor = '#2a2a2a'
      }
      el.style.borderRadius = '8px'
      el.style.padding = '8px'
      el.style.textAlign = 'center'
      el.style.minHeight = '40px'
      el.style.display = 'flex'
      el.style.flexDirection = 'column'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
    })

    // Remove all backdrop filters and other unsupported properties
    const allElements = clonedElement.querySelectorAll('*')
    allElements.forEach((el) => {
      const element = el as HTMLElement
      element.style.backdropFilter = 'none'
      // @ts-expect-error - webkit prefix for Safari compatibility
      element.style.webkitBackdropFilter = 'none'
      
      // Ensure text color is visible
      const computedStyle = window.getComputedStyle(el)
      if (!element.style.color || computedStyle.color === 'rgba(0, 0, 0, 0)' || computedStyle.color === 'transparent') {
        element.style.color = '#e8e8e8'
      }

      // Fix opacity issues
      if (computedStyle.opacity === '0') {
        element.style.opacity = '1'
      }
    })

    // Style injection day indicators
    const injectionIndicators = clonedElement.querySelectorAll('[class*="amber"], [class*="yellow"]')
    injectionIndicators.forEach((indicator) => {
      const el = indicator as HTMLElement
      if (el.classList.toString().includes('bg-amber') || el.classList.toString().includes('bg-yellow')) {
        el.style.backgroundColor = '#f59e0b'
        el.style.color = '#1a1a1a'
        el.style.fontWeight = '500'
      }
    })

    // Style icons
    const icons = clonedElement.querySelectorAll('svg')
    icons.forEach((icon) => {
      const el = icon as unknown as HTMLElement
      if (!el.style.color) {
        el.style.color = '#e8e8e8'
      }
      el.style.width = el.getAttribute('width') || '16px'
      el.style.height = el.getAttribute('height') || '16px'
    })

    return clonedElement
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
      const calendarElement = document.getElementById('calendar-container')
      if (!calendarElement) return

      // Use the helper function to prepare the element
      const clonedElement = prepareElementForExport(calendarElement)

      // Create a temporary container
      const tempContainer = document.createElement('div')
      tempContainer.style.cssText = `
        position: absolute !important;
        left: -9999px !important;
        top: 0 !important;
        width: ${calendarElement.offsetWidth}px !important;
        height: ${calendarElement.offsetHeight}px !important;
      `
      document.body.appendChild(tempContainer)
      tempContainer.appendChild(clonedElement)

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 100))

      // Temporarily hide the export button
      const exportButton = document.querySelector('[data-export-button]')
      if (exportButton) {
        (exportButton as HTMLElement).style.visibility = 'hidden'
      }

      const canvas = await html2canvas(clonedElement, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        width: calendarElement.offsetWidth,
        height: calendarElement.offsetHeight,
        onclone: (clonedDoc) => {
          // Additional style fixes in the cloned document
          const clonedCalendar = clonedDoc.getElementById('calendar-container')
          if (clonedCalendar) {
            clonedCalendar.style.backgroundColor = '#1a1a1a'
          }
        }
      })

      // Clean up
      document.body.removeChild(tempContainer)

      // Restore the export button
      if (exportButton) {
        (exportButton as HTMLElement).style.visibility = 'visible'
      }

      const link = document.createElement('a')
      link.download = `trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
    } catch (error) {
      console.error('Export PNG error:', error)
      alert('Failed to export calendar. Please try again.')
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const calendarElement = document.getElementById('calendar-container')
      if (!calendarElement) return

      // Use the helper function to prepare the element
      const clonedElement = prepareElementForExport(calendarElement)

      // Create a temporary container
      const tempContainer = document.createElement('div')
      tempContainer.style.cssText = `
        position: absolute !important;
        left: -9999px !important;
        top: 0 !important;
        width: ${calendarElement.offsetWidth}px !important;
        height: ${calendarElement.offsetHeight}px !important;
      `
      document.body.appendChild(tempContainer)
      tempContainer.appendChild(clonedElement)

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 100))

      // Temporarily hide the export button
      const exportButton = document.querySelector('[data-export-button]')
      if (exportButton) {
        (exportButton as HTMLElement).style.visibility = 'hidden'
      }

      const canvas = await html2canvas(clonedElement, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        width: calendarElement.offsetWidth,
        height: calendarElement.offsetHeight,
        onclone: (clonedDoc) => {
          // Additional style fixes in the cloned document
          const clonedCalendar = clonedDoc.getElementById('calendar-container')
          if (clonedCalendar) {
            clonedCalendar.style.backgroundColor = '#1a1a1a'
          }
        }
      })

      // Clean up
      document.body.removeChild(tempContainer)

      // Restore the export button
      if (exportButton) {
        (exportButton as HTMLElement).style.visibility = 'visible'
      }

      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // Calculate PDF dimensions to maintain aspect ratio
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const pdfWidth = imgWidth > imgHeight ? 297 : 210 // A4 landscape or portrait
      const pdfHeight = (pdfWidth * imgHeight) / imgWidth

      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    } catch (error) {
      console.error('Export PDF error:', error)
      alert('Failed to export calendar. Please try again.')
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  const handleEmailCalendar = async () => {
    setIsExporting(true)
    try {
      // First generate the PNG
      const calendarElement = document.getElementById('calendar-container')
      if (!calendarElement) return

      // Use the helper function to prepare the element
      const clonedElement = prepareElementForExport(calendarElement)

      // Create a temporary container
      const tempContainer = document.createElement('div')
      tempContainer.style.cssText = `
        position: absolute !important;
        left: -9999px !important;
        top: 0 !important;
        width: ${calendarElement.offsetWidth}px !important;
        height: ${calendarElement.offsetHeight}px !important;
      `
      document.body.appendChild(tempContainer)
      tempContainer.appendChild(clonedElement)

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = await html2canvas(clonedElement, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        width: calendarElement.offsetWidth,
        height: calendarElement.offsetHeight,
        onclone: (clonedDoc) => {
          // Additional style fixes in the cloned document
          const clonedCalendar = clonedDoc.getElementById('calendar-container')
          if (clonedCalendar) {
            clonedCalendar.style.backgroundColor = '#1a1a1a'
          }
        }
      })

      // Clean up
      document.body.removeChild(tempContainer)

      // Convert to blob
      canvas.toBlob((blob) => {
        if (!blob) return

        // Create a temporary link to download the image first
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.png`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)

        // Then open email client
        const subject = `TRT Calendar - ${currentProtocol}`
        const body = `My TRT Protocol: ${currentProtocol}\n\nCalendar exported on ${format(new Date(), 'PPP')}\n\nPlease see the attached calendar image for my injection schedule.`
        
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        window.location.href = mailtoLink
      }, 'image/png', 1.0)
    } catch (error) {
      console.error('Export email error:', error)
      alert('Failed to export calendar. Please try again.')
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