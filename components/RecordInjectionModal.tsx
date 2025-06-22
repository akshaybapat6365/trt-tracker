'use client';

import React, { useState } from 'react';
import { InjectionRecord } from '@/lib/types';
import { storage } from '@/lib/storage';
import { formatDose } from '@/lib/calculations';
import { X, Check, AlertCircle } from 'lucide-react';

interface RecordInjectionModalProps {
  date: Date;
  dose: number;
  onClose: () => void;
  onComplete: () => void;
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

    storage.saveInjectionRecord(record);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md transform transition-all duration-500 scale-100 opacity-100">
        <div className="bg-zinc-950 border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden">
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
                         text-zinc-500 hover:text-zinc-300 transition-all duration-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-6">
            <div className="mb-6">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center">
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
                         focus:outline-none transition-all duration-300 resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={() => recordInjection(false)}
                className="w-full group relative p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl
                         hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300
                         overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 
                                translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                <span className="relative flex items-center justify-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Mark as Completed</span>
                </span>
              </button>
              
              <button
                onClick={() => recordInjection(true)}
                className="w-full group relative p-4 bg-red-500/10 border border-red-500/30 rounded-xl
                         hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300
                         overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 
                                translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                <span className="relative flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-500 font-medium">Mark as Missed</span>
                </span>
              </button>
              
              <button
                onClick={onClose}
                className="w-full text-zinc-600 hover:text-zinc-400 py-3 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}