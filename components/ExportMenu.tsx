'use client'

import React, { useState } from 'react'
import { Download, FileImage, FileText, Mail, X } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { format } from 'date-fns'

interface ExportMenuProps {
  currentProtocol: string
}

export default function ExportMenu({ currentProtocol }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExportPNG = async () => {
    setIsExporting(true)
    try {
      const calendarElement = document.getElementById('calendar-container')
      if (!calendarElement) return

      const canvas = await html2canvas(calendarElement, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const link = document.createElement('a')
      link.download = `trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      console.error('Export PNG error:', error)
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

      const canvas = await html2canvas(calendarElement, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`trt-calendar-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    } catch (error) {
      console.error('Export PDF error:', error)
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  const handleEmailCalendar = () => {
    const subject = `TRT Calendar - ${currentProtocol}`
    const body = `My TRT Protocol: ${currentProtocol}\n\nCalendar exported on ${format(new Date(), 'PPP')}\n\nView the attached calendar for injection schedule.`
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoLink
    setIsOpen(false)
  }

  return (
    <>
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="group relative px-6 py-3 bg-black border border-amber-500/20 rounded-xl
                   hover:border-amber-500/40 transition-all duration-500 overflow-hidden"
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
        </div>
      </button>

      {/* Export Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-md transform transition-all duration-500 scale-100 opacity-100">
            <div className="bg-zinc-950 border border-amber-500/20 rounded-2xl shadow-2xl shadow-amber-500/5 overflow-hidden">
              {/* Grain texture overlay */}
              <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
                   style={{
                     backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                   }}
              />
              
              {/* Header */}
              <div className="relative p-6 border-b border-zinc-900">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-light text-zinc-100 tracking-wide">Export Calendar</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 
                             text-zinc-500 hover:text-zinc-300 transition-all duration-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Export Options */}
              <div className="relative p-6 space-y-3">
                {/* PNG Export */}
                <button
                  onClick={handleExportPNG}
                  disabled={isExporting}
                  className="w-full group relative p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl
                           hover:bg-zinc-900/50 hover:border-amber-500/30 transition-all duration-500
                           disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 
                                  translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  
                  <div className="relative flex items-center gap-4">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <FileImage className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-zinc-200">Export as PNG</p>
                      <p className="text-sm text-zinc-500">High-quality image format</p>
                    </div>
                  </div>
                </button>
                
                {/* PDF Export */}
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="w-full group relative p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl
                           hover:bg-zinc-900/50 hover:border-amber-500/30 transition-all duration-500
                           disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 
                                  translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  
                  <div className="relative flex items-center gap-4">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <FileText className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-zinc-200">Export as PDF</p>
                      <p className="text-sm text-zinc-500">Portable document format</p>
                    </div>
                  </div>
                </button>
                
                {/* Email Export */}
                <button
                  onClick={handleEmailCalendar}
                  disabled={isExporting}
                  className="w-full group relative p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl
                           hover:bg-zinc-900/50 hover:border-amber-500/30 transition-all duration-500
                           disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 
                                  translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  
                  <div className="relative flex items-center gap-4">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <Mail className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-zinc-200">Email Calendar</p>
                      <p className="text-sm text-zinc-500">Send via email client</p>
                    </div>
                  </div>
                </button>
              </div>
              
              {/* Loading State */}
              {isExporting && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                    <p className="text-sm text-zinc-400">Exporting...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}