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
    const trackerElement = document.getElementById('calendar-container')
    if (!trackerElement) {
      console.error('Tracker element not found')
      return
    }

    setIsExporting(true)
    try {
      const options = {
        cacheBust: true,
        pixelRatio: window.devicePixelRatio * 2, // Crisp retina output
        backgroundColor: '#0a0a0a',
        filter: (node: Element) => {
          // Exclude export controls
          return !node.hasAttribute('data-export-control')
        },
        useCORS: true, // Handle external images
      }

      if (type === 'pdf') {
        const dataUrl = await toPng(trackerElement, options)
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [trackerElement.offsetWidth, trackerElement.offsetHeight]
        })
        pdf.addImage(dataUrl, 'PNG', 0, 0, trackerElement.offsetWidth, trackerElement.offsetHeight)
        pdf.save(`trt-snapshot-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
      } else {
        const dataUrl = type === 'png' 
          ? await toPng(trackerElement, options)
          : await toJpeg(trackerElement, { ...options, quality: 0.95 })
        download(dataUrl, `trt-snapshot.${type}`)
      }
    } catch (error) {
      console.error('Export failed:', error)
      // Silent fail - no alert to avoid disrupting UX
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }, [])

  const handleExportPNG = () => handleExport('png')
  const handleExportPDF = () => handleExport('pdf')

  return (
    <div ref={dropdownRef} className="relative" data-export-control>
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
        <div className="absolute top-full right-0 mt-2 w-64 transform origin-top-right transition-all duration-300 animate-slideDown" data-export-control>
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
                  <p className="text-sm font-medium text-zinc-200">Save as PNG</p>
                  <p className="text-xs text-zinc-500">High-quality image</p>
                </div>
              </button>

              <button
                onClick={() => handleExport('jpeg')}
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