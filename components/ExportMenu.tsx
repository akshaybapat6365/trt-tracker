'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Download, FileImage, FileText, ChevronDown, Upload, DownloadCloud } from 'lucide-react'
import { format } from 'date-fns'
import { toPng, toJpeg } from 'html-to-image'
import download from 'downloadjs'
import { jsPDF } from 'jspdf'

interface ExportMenuProps {
  currentProtocol?: string
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ExportMenu({ onExportData, onImportData }: ExportMenuProps) {
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
    setIsExporting(true)
    const trackerElement = document.getElementById('calendar-container')

    if (!trackerElement) {
      alert('Export failed: Calendar element not found.')
      setIsExporting(false)
      return
    }

    const options = {
      cacheBust: true,
      pixelRatio: window.devicePixelRatio * 2,
      backgroundColor: '#0a0a0a',
      useCORS: true,
      filter: (node: Node) => {
        // *** THIS IS THE FIX ***
        // Only check for attributes and classes if the node is an Element
        if (node instanceof Element) {
          return !node.hasAttribute('data-export-control') &&
                 !Array.from(node.classList).some(c => c.includes('backdrop-blur'))
        }
        // Keep all other node types (like text nodes)
        return true;
      }
    }

    try {
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
        
        try {
          download(dataUrl, `trt-snapshot-${format(new Date(), 'yyyy-MM-dd')}.${type}`)
        } catch (error) {
          console.error('Download failed, opening in new tab:', error)
          window.open(dataUrl, '_blank')
        }
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert(`An error occurred while exporting the calendar: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }, [])

  return (
    <div ref={dropdownRef} className="relative" data-export-control>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative px-6 py-3 bg-zinc-950 border border-amber-500/30 rounded-xl hover:border-amber-500/40 transition-all duration-500 overflow-hidden hover:scale-105 transform-gpu"
        aria-label="Export calendar"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <div className="relative flex items-center gap-2">
          <Download className="w-4 h-4 text-amber-500/80 group-hover:text-amber-500 transition-colors" />
          <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
            Export
          </span>
          <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 transform origin-top-right transition-all duration-300 animate-slideDown" data-export-control>
          <div className="bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="relative p-2">
              <button
                onClick={() => handleExport('png')}
                disabled={isExporting}
                className="w-full group relative px-4 py-3 rounded-lg hover:bg-zinc-900/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
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
                className="w-full group relative px-4 py-3 rounded-lg hover:bg-zinc-900/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
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
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="w-full group relative px-4 py-3 rounded-lg hover:bg-zinc-900/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  <FileText className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-zinc-200">Save as PDF</p>
                  <p className="text-xs text-zinc-500">Printable document</p>
                </div>
              </button>

              <div className="my-2 border-t border-zinc-800" />

              <button
                onClick={onExportData}
                className="w-full group relative px-4 py-3 rounded-lg hover:bg-zinc-900/50 transition-all duration-300 flex items-center gap-3"
              >
                <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                  <DownloadCloud className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-zinc-200">Export All Data</p>
                  <p className="text-xs text-zinc-500">Save as JSON backup</p>
                </div>
              </button>
              <label
                htmlFor="import-data"
                className="w-full group relative px-4 py-3 rounded-lg hover:bg-zinc-900/50 transition-all duration-300 flex items-center gap-3 cursor-pointer"
              >
                <div className="p-2 bg-sky-500/10 rounded-lg group-hover:bg-sky-500/20 transition-colors">
                  <Upload className="w-4 h-4 text-sky-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-zinc-200">Import Data</p>
                  <p className="text-xs text-zinc-500">Load from JSON backup</p>
                </div>
                <input
                  type="file"
                  id="import-data"
                  accept=".json"
                  className="hidden"
                  onChange={onImportData}
                />
              </label>
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