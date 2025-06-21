'use client';

import React, { useState } from 'react';
import { InjectionRecord } from '@/lib/types';
import { storage } from '@/lib/storage';
import { formatDose } from '@/lib/calculations';

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
    <div className="modal-backdrop animate-fade-in">
      <div className="glass-strong rounded-2xl max-w-md w-full p-8 animate-slide-in">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold gradient-text">Record Injection</h3>
            <p className="text-sm text-white/50 mt-2">
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
            className="p-2 glass rounded-lg gradient-border-hover transition-smooth"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="glass-strong rounded-xl p-6 text-center gradient-border">
            <p className="text-sm text-white/60 mb-2">Dose Amount</p>
            <p className="text-3xl font-bold gradient-text">{formatDose(dose, 'mg')}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-white/70 mb-2">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this injection..."
            className="input w-full resize-none"
            rows={3}
          />
        </div>

        <div className="space-y-3">
          <button
            onClick={() => recordInjection(false)}
            className="w-full glass gradient-border-hover py-3 rounded-lg font-medium transition-smooth group"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Mark as Completed</span>
            </span>
          </button>
          
          <button
            onClick={() => recordInjection(true)}
            className="w-full glass gradient-border-hover py-3 rounded-lg font-medium transition-smooth group"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Mark as Missed</span>
            </span>
          </button>
          
          <button
            onClick={onClose}
            className="w-full text-white/50 hover:text-white py-3 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}