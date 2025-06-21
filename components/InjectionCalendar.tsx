'use client';

import React, { useState, useEffect } from 'react';
import { InjectionRecord, Protocol, UserSettings } from '@/lib/types';
import { storage } from '@/lib/storage';
import { getNextInjectionDates, formatDose } from '@/lib/calculations';
import MissedDoseHandler from './MissedDoseHandler';

interface InjectionCalendarProps {
  protocol: Protocol;
  startDate: Date;
  dose: number;
  settings: UserSettings;
  onSettingsUpdate: (settings: UserSettings) => void;
}

export default function InjectionCalendar({ protocol, startDate, dose, settings }: InjectionCalendarProps) {
  const [records, setRecords] = useState<InjectionRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showMissedDoseHandler, setShowMissedDoseHandler] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<InjectionRecord | null>(null);

  useEffect(() => {
    setRecords(storage.getInjectionRecords());
  }, []);

  const nextDates = getNextInjectionDates(startDate, protocol, 30);

  const recordInjection = (date: Date, missed: boolean = false) => {
    const record: InjectionRecord = {
      id: `${date.getTime()}-${Math.random()}`,
      date,
      dose: missed ? 0 : dose,
      missed,
      rescheduled: false,
    };

    if (missed) {
      setSelectedRecord(record);
      setShowMissedDoseHandler(true);
      setShowRecordModal(false);
    } else {
      storage.saveInjectionRecord(record);
      setRecords(storage.getInjectionRecords());
      setShowRecordModal(false);
    }
  };

  const handleMissedDoseComplete = () => {
    setRecords(storage.getInjectionRecords());
    setShowMissedDoseHandler(false);
    setSelectedRecord(null);
  };

  const isRecorded = (date: Date) => {
    return records.some(r => 
      r.date.toDateString() === date.toDateString()
    );
  };

  const getRecordForDate = (date: Date) => {
    return records.find(r => 
      r.date.toDateString() === date.toDateString()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Injection Schedule</h2>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {nextDates.map((date, index) => {
          const record = getRecordForDate(date);
          const recorded = isRecorded(date);
          const past = isPast(date);
          const today = isToday(date);

          return (
            <div
              key={index}
              className={`
                p-3 rounded-md border transition-all cursor-pointer
                ${today ? 'border-white bg-accent' : 'border-border'}
                ${recorded && !record?.missed ? 'bg-green-900/20 border-green-800' : ''}
                ${recorded && record?.missed ? 'bg-red-900/20 border-red-800' : ''}
                ${!recorded && past ? 'bg-yellow-900/20 border-yellow-800' : ''}
                hover:bg-accent/50
              `}
              onClick={() => {
                setSelectedDate(date);
                setShowRecordModal(true);
              }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    {date.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                    {today && <span className="ml-2 text-xs text-muted-foreground">(Today)</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDose(dose, 'mg')}
                  </p>
                </div>
                <div className="text-sm">
                  {recorded && !record?.missed && (
                    <span className="text-green-400">✓ Completed</span>
                  )}
                  {recorded && record?.missed && (
                    <span className="text-red-400">✗ Missed</span>
                  )}
                  {!recorded && past && (
                    <span className="text-yellow-400">⚠ Pending</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showRecordModal && selectedDate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="card max-w-md w-full m-4">
            <h3 className="text-lg font-semibold mb-4">
              Record Injection - {selectedDate.toLocaleDateString()}
            </h3>
            
            <div className="space-y-4">
              <button
                onClick={() => recordInjection(selectedDate, false)}
                className="w-full button-primary"
              >
                Mark as Completed
              </button>
              
              <button
                onClick={() => recordInjection(selectedDate, true)}
                className="w-full button-secondary"
              >
                Mark as Missed
              </button>
              
              <button
                onClick={() => setShowRecordModal(false)}
                className="w-full text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showMissedDoseHandler && selectedRecord && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="card max-w-md w-full m-4">
            <MissedDoseHandler
              missedRecord={selectedRecord}
              settings={settings}
              onComplete={handleMissedDoseComplete}
              onCancel={() => {
                setShowMissedDoseHandler(false);
                setSelectedRecord(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}