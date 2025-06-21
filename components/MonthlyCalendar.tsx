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
            h-24 border border-zinc-800 p-2 cursor-pointer
            transition-all duration-200 relative
            ${today ? 'ring-2 ring-white' : ''}
            ${isInjection ? 'bg-zinc-900' : ''}
            hover:bg-zinc-800
          `}
          onClick={() => onDateClick?.(date)}
        >
          <div className="text-sm font-medium mb-1">{day}</div>
          
          {isInjection && (
            <div className="text-xs space-y-1">
              <div className="text-zinc-400">
                {formatDose(calculation.mgPerInjection, 'mg')}
              </div>
              {record && !record.missed && (
                <div className="text-green-500">✓</div>
              )}
              {record && record.missed && (
                <div className="text-red-500">✗</div>
              )}
              {!record && past && (
                <div className="text-yellow-500">!</div>
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
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-2xl font-semibold">{monthYear}</h2>
        
        <button
          onClick={() => changeMonth(1)}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-px mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm text-zinc-500 font-medium py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-zinc-800">
        {renderCalendar()}
      </div>

      {/* Legend */}
      <div className="mt-6 flex gap-6 text-sm text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-zinc-900 border border-zinc-800"></div>
          <span>Injection Day</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-500">✗</span>
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-500">!</span>
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
}