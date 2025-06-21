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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">Record Injection</h3>
            <p className="text-sm text-zinc-400 mt-1">
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
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-zinc-800 rounded-lg p-4 text-center">
            <p className="text-sm text-zinc-400 mb-1">Dose Amount</p>
            <p className="text-2xl font-bold">{formatDose(dose, 'mg')}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this injection..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white resize-none"
            rows={3}
          />
        </div>

        <div className="space-y-3">
          <button
            onClick={() => recordInjection(false)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Mark as Completed
          </button>
          
          <button
            onClick={() => recordInjection(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Mark as Missed
          </button>
          
          <button
            onClick={onClose}
            className="w-full text-zinc-400 hover:text-white font-medium py-3 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}