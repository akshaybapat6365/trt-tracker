'use client';

import React, { useState, useEffect } from 'react';
import { InjectionRecord, UserSettings } from '@/lib/types';
import { calculateDose, formatDose, getNextInjectionDates } from '@/lib/calculations';
import { storage } from '@/lib/storage';

interface MonthlyCalendarProps {
  settings: UserSettings;
  onDateClick?: (date: Date) => void;
}

export default function MonthlyCalendar({ settings, onDateClick }: MonthlyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState<InjectionRecord[]>([]);
  const [injectionDates, setInjectionDates] = useState<Date[]>([]);

  useEffect(() => {
    setRecords(storage.getInjectionRecords());
    // Calculate injection dates for the next year
    const dates = getNextInjectionDates(settings.startDate, settings.protocol, 365);
    setInjectionDates(dates);
  }, [settings]);

  const calculation = calculateDose(settings);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isInjectionDay = (date: Date) => {
    return injectionDates.some(d => 
      d.getDate() === date.getDate() &&
      d.getMonth() === date.getMonth() &&
      d.getFullYear() === date.getFullYear()
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

  const changeMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isInjection = isInjectionDay(date);
      const record = getRecordForDate(date);
      const today = isToday(date);
      const past = isPast(date);

      days.push(
        <div
          key={day}
          className={`
            calendar-cell group
            ${today ? 'ring-2 ring-purple-500/50' : ''}
            ${isInjection ? 'calendar-cell-active' : ''}
          `}
          onClick={() => onDateClick?.(date)}
        >
          <div className="flex justify-between items-start mb-2">
            <span className={`text-sm font-medium ${today ? 'gradient-text' : ''}`}>
              {day}
            </span>
            {isInjection && (
              <div className={`
                injection-dot
                ${record && record.missed ? 'injection-dot-missed' : ''}
                ${!record && !past ? 'injection-dot-future' : ''}
                ${!record && past ? 'animate-pulse' : ''}
              `} />
            )}
          </div>
          
          {isInjection && (
            <div className="space-y-1">
              <div className="text-xs text-white/50">
                {formatDose(calculation.mgPerInjection, 'mg')}
              </div>
              {record && !record.missed && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-green-400">Done</span>
                </div>
              )}
              {record && record.missed && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-xs text-red-400">Missed</span>
                </div>
              )}
              {!record && past && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-xs text-yellow-400">Log</span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const monthYear = currentMonth.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="w-full">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => changeMonth(-1)}
          className="p-3 glass rounded-xl gradient-border-hover glow transition-smooth"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-3xl font-bold gradient-text">{monthYear}</h2>
        
        <button
          onClick={() => changeMonth(1)}
          className="p-3 glass rounded-xl gradient-border-hover glow transition-smooth"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm text-white/40 font-medium py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {renderCalendar()}
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-3 glass px-4 py-2 rounded-lg">
          <div className="injection-dot" />
          <span className="text-white/70">Injection Day</span>
        </div>
        <div className="flex items-center gap-3 glass px-4 py-2 rounded-lg">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-white/70">Completed</span>
        </div>
        <div className="flex items-center gap-3 glass px-4 py-2 rounded-lg">
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-white/70">Missed</span>
        </div>
        <div className="flex items-center gap-3 glass px-4 py-2 rounded-lg">
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-white/70">Needs Logging</span>
        </div>
      </div>
    </div>
  );
}