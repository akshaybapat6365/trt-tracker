'use client';

import React, { useState, useEffect } from 'react';
import { InjectionRecord, UserSettings } from '@/lib/types';
import { calculateDose, formatDose, getAllInjectionDates } from '@/lib/calculations';
import { storage } from '@/lib/storage';
import { ChevronLeft, ChevronRight, Check, X, AlertTriangle, Calendar, Sparkles } from 'lucide-react';

interface MonthlyCalendarProps {
  settings: UserSettings;
  onDateClick?: (date: Date) => void;
  onProtocolStartDateChange?: (date: Date) => void;
}

export default function MonthlyCalendar({ settings, onDateClick, onProtocolStartDateChange }: MonthlyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState<InjectionRecord[]>([]);
  const [injectionDates, setInjectionDates] = useState<Date[]>([]);
  const [isStartDateMode, setIsStartDateMode] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  useEffect(() => {
    setRecords(storage.getInjectionRecords());
    // Calculate all injection dates from protocol start date to 1 year in the future
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    const dates = getAllInjectionDates(
      settings.protocolStartDate || settings.startDate, 
      settings.protocol, 
      endDate
    );
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

  const isProtocolStartDate = (date: Date) => {
    if (!settings.protocolStartDate) return false;
    return date.toDateString() === new Date(settings.protocolStartDate).toDateString();
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
      days.push(<div key={`empty-${i}`} className="h-28" />);
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
            relative h-28 p-3 bg-zinc-950 border border-zinc-900 rounded-xl
            transition-all duration-500 ease-out
            cursor-pointer group overflow-hidden
            ${today ? 'ring-2 ring-amber-500/50 bg-zinc-900/30' : ''}
            ${isInjection && !isStartDateMode ? 'border-amber-500/20' : ''}
            ${isProtocolStartDate(date) ? 'ring-2 ring-emerald-500/50 bg-emerald-950/20 border-emerald-500/30' : ''}
            ${isStartDateMode ? 'hover:border-emerald-500/50 hover:bg-emerald-950/10 hover:scale-105' : 'hover:border-amber-500/30 hover:bg-zinc-900/50 hover:scale-102'}
            ${hoveredDate && hoveredDate.toDateString() === date.toDateString() ? 'scale-105' : ''}
            transform-gpu
          `}
          onClick={() => {
            if (isStartDateMode) {
              onProtocolStartDateChange?.(date);
              setIsStartDateMode(false);
            } else if (isInjection) {
              onDateClick?.(date);
            }
          }}
          onMouseEnter={() => setHoveredDate(date)}
          onMouseLeave={() => setHoveredDate(null)}
          style={{
            animation: 'floatSubtle 6s ease-in-out infinite',
            animationDelay: `${(day % 7) * 0.1}s`
          }}
        >
          {/* Hover glow effect */}
          <div className={`absolute inset-0 transition-all duration-700 ${
            isStartDateMode 
              ? 'bg-gradient-to-br from-emerald-500/0 via-emerald-500/15 to-emerald-500/0' 
              : 'bg-gradient-to-br from-amber-500/0 via-amber-500/10 to-amber-500/0'
          } opacity-0 group-hover:opacity-100`} />
          
          {/* Glass morphism effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-xl" />
          
          {/* Protocol start date animation */}
          {isProtocolStartDate(date) && (
            <div className="absolute inset-0 overflow-hidden rounded-xl">
              <div className="absolute inset-0 bg-emerald-500/20 animate-pulse" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Sparkles className="w-6 h-6 text-emerald-400 animate-spin-slow" />
              </div>
            </div>
          )}
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <span className={`text-sm font-light ${today ? 'text-amber-500' : 'text-zinc-400'}`}>
                {day}
              </span>
              {isInjection && (
                <div className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${record && record.missed ? 'bg-red-500 shadow-red-500/50' : ''}
                  ${record && !record.missed ? 'bg-emerald-500 shadow-emerald-500/50' : ''}
                  ${!record && !past ? 'bg-amber-500/40 border border-amber-500' : ''}
                  ${!record && past ? 'bg-yellow-500 animate-pulse shadow-yellow-500/50' : ''}
                  shadow-lg
                `} />
              )}
            </div>
            
            {isInjection && (
              <div className="space-y-1">
                <div className="text-xs text-zinc-500 font-light">
                  {formatDose(calculation.mgPerInjection, 'mg')}
                </div>
                {record && !record.missed && (
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-500 font-light">Done</span>
                  </div>
                )}
                {record && record.missed && (
                  <div className="flex items-center gap-1">
                    <X className="w-3 h-3 text-red-500" />
                    <span className="text-xs text-red-500 font-light">Missed</span>
                  </div>
                )}
                {!record && past && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-yellow-500 font-light">Log</span>
                  </div>
                )}
              </div>
            )}
          </div>
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
      {/* Start Date Mode Toggle */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsStartDateMode(!isStartDateMode)}
          className={`
            group relative px-5 py-2.5 rounded-xl transition-all duration-500
            ${isStartDateMode 
              ? 'bg-emerald-950/30 border border-emerald-500/50 shadow-emerald-500/20 shadow-lg' 
              : 'bg-zinc-950 border border-zinc-800/50 hover:border-emerald-500/30'}
          `}
        >
          <div className="flex items-center gap-2">
            <Calendar className={`w-4 h-4 transition-colors duration-300 ${
              isStartDateMode ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-emerald-400'
            }`} />
            <span className={`text-sm font-light transition-colors duration-300 ${
              isStartDateMode ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-300'
            }`}>
              {isStartDateMode ? 'Click a date to set start' : 'Set Protocol Start Date'}
            </span>
          </div>
          {isStartDateMode && (
            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 animate-shimmer" />
            </div>
          )}
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-10">
        <button
          onClick={() => changeMonth(-1)}
          className="group p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl
                     hover:border-amber-500/30 hover:bg-zinc-900 transition-all duration-300"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-zinc-400 group-hover:text-amber-500 transition-colors" />
        </button>
        
        <h2 className="text-4xl font-extralight text-zinc-100 tracking-wide">
          {monthYear}
        </h2>
        
        <button
          onClick={() => changeMonth(1)}
          className="group p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl
                     hover:border-amber-500/30 hover:bg-zinc-900 transition-all duration-300"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-amber-500 transition-colors" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-3 mb-6">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-zinc-600 tracking-wider py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3">
        {renderCalendar()}
      </div>

      {/* Legend */}
      <div className="mt-10 flex flex-wrap gap-4">
        <div className="flex items-center gap-3 px-5 py-3 bg-zinc-950 border border-zinc-900/50 rounded-xl hover:border-zinc-800 transition-all duration-300">
          <div className="w-2 h-2 rounded-full bg-amber-500/30 border border-amber-500" />
          <span className="text-xs font-light text-zinc-500 uppercase tracking-wider">Scheduled</span>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-zinc-950 border border-zinc-900/50 rounded-xl hover:border-zinc-800 transition-all duration-300">
          <Check className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-light text-zinc-500 uppercase tracking-wider">Completed</span>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-zinc-950 border border-zinc-900/50 rounded-xl hover:border-zinc-800 transition-all duration-300">
          <X className="w-4 h-4 text-red-500" />
          <span className="text-xs font-light text-zinc-500 uppercase tracking-wider">Missed</span>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-zinc-950 border border-zinc-900/50 rounded-xl hover:border-zinc-800 transition-all duration-300">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-light text-zinc-500 uppercase tracking-wider">Needs Logging</span>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-zinc-950 border border-emerald-900/50 rounded-xl hover:border-emerald-800 transition-all duration-300">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-light text-zinc-500 uppercase tracking-wider">Protocol Start</span>
        </div>
      </div>
    </div>
  );
}