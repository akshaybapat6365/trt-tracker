'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Download, FileImage, FileText, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { toPng, toJpeg } from 'html-to-image'
import download from 'downloadjs'
import { jsPDF } from 'jspdf'

interface ExportMenuProps {
  currentProtocol?: string
}

export default function ExportMenu({}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Test function to verify html-to-image works
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.testExport = async () => {
        console.log('Running test export...')
        const el = document.getElementById('calendar-container')
        if (el) {
          try {
            const dataUrl = await toPng(el)
            console.log('Test export successful, data URL length:', dataUrl.length)
            console.log('First 100 chars:', dataUrl.substring(0, 100))
          } catch (err) {
            console.error('Test export failed:', err)
          }
        } else {
          console.error('Test export: calendar-container not found')
        }
      }
      
      // Add global error handler to catch any unhandled errors
      window.addEventListener('error', (event) => {
        if (event.message && event.message.includes('html-to-image')) {
          console.error('html-to-image error caught:', event)
        }
      })
      
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.toString().includes('html-to-image')) {
          console.error('html-to-image promise rejection:', event.reason)
        }
      })
    }
  }, [])

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

  const handleExport = useCallback(async (type: 'png' | 'jpeg' | 'pdf') => {
    console.log('Export initiated:', type)
    console.log('Browser info:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    })
    console.log('Looking for calendar-container element...')
    
    const trackerElement = document.getElementById('calendar-container')
    console.log('Tracker element found:', !!trackerElement)
    
    if (!trackerElement) {
      console.error('Tracker element not found')
      console.log('All element IDs on page:', Array.from(document.querySelectorAll('[id]')).map(el => el.id))
      alert('Export failed: Calendar container not found')
      return
    }

    console.log('Tracker element dimensions:', {
      width: trackerElement.offsetWidth,
      height: trackerElement.offsetHeight,
      visible: trackerElement.offsetWidth > 0 && trackerElement.offsetHeight > 0
    })

    setIsExporting(true)
    
    // Temporarily disable animations for cleaner export
    const originalStyles = trackerElement.style.cssText
    trackerElement.style.cssText += '; animation: none !important; transition: none !important;'
    
    // Also disable animations on all child elements
    const allElements = trackerElement.querySelectorAll('*')
    const originalChildStyles = Array.from(allElements).map(el => (el as HTMLElement).style.cssText)
    allElements.forEach(el => {
      (el as HTMLElement).style.cssText += '; animation: none !important; transition: none !important;'
    })
    
    // Wait a frame for styles to apply
    await new Promise(resolve => requestAnimationFrame(resolve))
    
    try {
      console.log('Starting export process...')
      const options = {
        cacheBust: true,
        pixelRatio: 2, // Fixed pixel ratio for consistency
        backgroundColor: '#0a0a0a',
        filter: (node: Element) => {
          // Exclude export controls
          const shouldInclude = !node.hasAttribute('data-export-control')
          if (!shouldInclude) {
            console.log('Filtering out node:', node)
          }
          return shouldInclude
        },
        useCORS: true, // Handle external images
        includeQueryParams: true,
        // Additional options for better compatibility
        canvasWidth: trackerElement.offsetWidth * 2,
        canvasHeight: trackerElement.offsetHeight * 2,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      }

      console.log('Export options:', options)
      
      // Check for any images or external resources that might cause issues
      const images = trackerElement.querySelectorAll('img')
      console.log('Found images:', images.length)
      images.forEach((img, i) => {
        console.log(`Image ${i}: src=${img.src}, complete=${img.complete}`)
      })

      if (type === 'pdf') {
        console.log('Generating PNG for PDF...')
        const dataUrl = await toPng(trackerElement, options)
        console.log('PNG generated, data URL length:', dataUrl.length)
        
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [trackerElement.offsetWidth, trackerElement.offsetHeight]
        })
        pdf.addImage(dataUrl, 'PNG', 0, 0, trackerElement.offsetWidth, trackerElement.offsetHeight)
        pdf.save(`trt-snapshot-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
        console.log('PDF saved successfully')
      } else {
        console.log(`Generating ${type.toUpperCase()}...`)
        const dataUrl = type === 'png' 
          ? await toPng(trackerElement, options)
          : await toJpeg(trackerElement, { ...options, quality: 0.95 })
        console.log(`${type.toUpperCase()} generated, data URL length:`, dataUrl.length)
        
        // Try download, fallback to window.open if blocked
        try {
          download(dataUrl, `trt-snapshot-${format(new Date(), 'yyyy-MM-dd')}.${type}`)
          console.log(`${type.toUpperCase()} download initiated`)
        } catch (downloadError) {
          console.log('Download blocked, trying window.open...', downloadError)
          window.open(dataUrl, '_blank')
        }
      }
    } catch (error) {
      console.error('Export failed with error:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      
      // Try a simpler approach as fallback
      console.log('Attempting fallback export method...')
      try {
        const simpleOptions = {
          backgroundColor: '#0a0a0a',
          pixelRatio: 1,
        }
        
        if (type === 'png') {
          const dataUrl = await toPng(trackerElement, simpleOptions)
          download(dataUrl, `trt-snapshot-${format(new Date(), 'yyyy-MM-dd')}.png`)
          console.log('Fallback export successful')
        } else {
          alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try PNG format.`)
        }
      } catch (fallbackError) {
        console.error('Fallback export also failed:', fallbackError)
        alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } finally {
      // Restore original styles
      trackerElement.style.cssText = originalStyles
      allElements.forEach((el, i) => {
        (el as HTMLElement).style.cssText = originalChildStyles[i]
      })
      
      setIsExporting(false)
      setIsOpen(false)
      console.log('Export process completed')
    }
  }, [])

  const handleExportPNG = () => handleExport('png')
  const handleExportPDF = () => handleExport('pdf')

  return (
    <div ref={dropdownRef} className="relative" data-export-control>
      <button
        onClick={() => {
          console.log('Export button clicked, current state:', isOpen)
          setIsOpen(!isOpen)
        }}
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
        <div className="absolute top-full right-0 mt-2 w-64 transform origin-top-right transition-all duration-300 animate-slideDown" data-export-control>
          <div className="bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            
            <div className="relative p-2">
              <button
                onClick={() => {
                  console.log('PNG export button clicked')
                  handleExportPNG()
                }}
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
                  <p className="text-sm font-medium text-zinc-200">Save as PNG</p>
                  <p className="text-xs text-zinc-500">High-quality image</p>
                </div>
              </button>

              <button
                onClick={() => {
                  console.log('JPEG export button clicked')
                  handleExport('jpeg')
                }}
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
                  <p className="text-sm font-medium text-zinc-200">Save as JPEG</p>
                  <p className="text-xs text-zinc-500">Compressed image</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  console.log('PDF export button clicked')
                  handleExportPDF()
                }}
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
                  <p className="text-sm font-medium text-zinc-200">Save as PDF</p>
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