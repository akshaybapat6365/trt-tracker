'use client';

import React, { useState } from 'react';
import { InjectionRecord } from '@/lib/types';
import { formatDose } from '@/lib/calculations';
import { X, Check, AlertCircle } from 'lucide-react';

interface RecordInjectionModalProps {
  date: Date;
  dose: number;
  onClose: () => void;
  onComplete: (record: InjectionRecord) => void;
}

export default function RecordInjectionModal({ date, dose, onClose, onComplete }: RecordInjectionModalProps) {
  const [notes, setNotes] = useState('');

  const recordInjection = (missed: boolean = false) => {
    const record: InjectionRecord = {
      id: `${date.getTime()}-${Math.random()}`,
      date,
      dose: missed ? 0 : dose,
      missed,
      rescheduled: false,
      notes: notes || undefined,
    };

    // Pass the record to the parent component
    // The parent will handle saving to Edge Config
    onComplete(record);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md animate-springIn">
        <div className="bg-zinc-950/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden">
          {/* Glass morphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
          
          {/* Grain texture overlay */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
               style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
               }}
          />
          
          {/* Header */}
          <div className="relative p-6 border-b border-zinc-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-light text-zinc-100 tracking-wide">Record Injection</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  {date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 
                         text-zinc-500 hover:text-zinc-300 transition-all duration-300
                         hover:scale-110 transform-gpu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-6">
            <div className="mb-6">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center animate-pulseGlow">
                <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Dose Amount</p>
                <p className="text-3xl font-extralight text-amber-500">{formatDose(dose, 'mg')}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this injection..."
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl
                         text-zinc-200 placeholder-zinc-600 focus:border-amber-500/30 
                         focus:outline-none transition-all duration-300 resize-none
                         hover:bg-zinc-900/70 focus:shadow-[0_0_0_2px_rgba(255,219,26,0.1)]"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={() => recordInjection(false)}
                className="w-full px-6 py-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl
                         text-emerald-500 font-medium hover:bg-emerald-500/20 hover:border-emerald-500/40
                         transition-all duration-500 group relative overflow-hidden
                         hover:scale-[1.02] transform-gpu btn-glow"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 
                              translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <div className="relative flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  <span>Complete</span>
                </div>
              </button>
              
              <button
                onClick={() => recordInjection(true)}
                className="w-full px-6 py-4 bg-red-500/10 border border-red-500/30 rounded-xl
                         text-red-500 font-medium hover:bg-red-500/20 hover:border-red-500/40
                         transition-all duration-500 group relative overflow-hidden
                         hover:scale-[1.02] transform-gpu"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 
                              translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <div className="relative flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>Missed</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}