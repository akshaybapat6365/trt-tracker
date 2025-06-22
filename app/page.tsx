'use client';

import React, { useState, useEffect, useRef } from 'react';
import MonthlyCalendar from '@/components/MonthlyCalendar';
import DoseCalculator from '@/components/DoseCalculator';
import MinimalProtocolSelector from '@/components/MinimalProtocolSelector';
import RecordInjectionModal from '@/components/RecordInjectionModal';
import ExportMenu from '@/components/ExportMenu';
import { UserSettings, Protocol } from '@/lib/types';
import { storage } from '@/lib/storage';
import { calculateDose, calculateWeeklyDose, formatDose } from '@/lib/calculations';
import { Settings } from 'lucide-react';

const defaultSettings: UserSettings = {
  protocol: 'E2D',
  concentration: 200,
  syringe: { volume: 1, units: 100, deadSpace: 0.05 },
  syringeFillAmount: 0.3,
  startDate: new Date(),
  protocolStartDate: new Date(),
  reminderTime: '08:00',
  enableNotifications: true,
};

export default function Home() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [showDoseCalculator, setShowDoseCalculator] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedSettings = storage.getUserSettings();
    if (savedSettings) {
      setSettings(savedSettings);
    }
    setIsLoading(false);
  }, []);

  // Premium cursor glow effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSettingsUpdate = (newSettings: UserSettings) => {
    setSettings(newSettings);
    storage.saveUserSettings(newSettings);
    setShowDoseCalculator(false);
  };

  const handleProtocolChange = (protocol: Protocol) => {
    const newSettings = { ...settings, protocol };
    handleSettingsUpdate(newSettings);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleRecordComplete = () => {
    setSelectedDate(null);
    setRefreshKey(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="loading-premium" />
      </div>
    );
  }

  const calculation = calculateDose(settings);
  const weeklyDose = calculateWeeklyDose(settings);

  return (
    <div className="min-h-screen bg-zinc-950 relative">
      {/* Grain texture overlay */}
      <div className="grain-overlay" />
      
      {/* Cursor glow */}
      <div ref={cursorRef} className="cursor-glow" />
      
      {/* Premium Header */}
      <header className="sticky top-0 z-40 px-4 py-6">
        <div className="container mx-auto max-w-7xl">
          <div className="bg-charcoal/80 backdrop-blur-xl border border-zinc-900 rounded-2xl px-8 py-5 fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-10">
                <h1 className="text-3xl font-light tracking-tight text-zinc-100">
                  TRT <span className="text-amber-500">Tracker</span>
                </h1>
                <MinimalProtocolSelector
                  currentProtocol={settings.protocol}
                  onProtocolChange={handleProtocolChange}
                />
              </div>
              
              <div className="flex items-center gap-8">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wider text-zinc-500">Per Injection</div>
                  <div className="text-xl font-light text-zinc-100">
                    {formatDose(calculation.mgPerInjection, 'mg')}
                  </div>
                </div>
                
                <div className="w-px h-12 bg-zinc-800" />
                
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wider text-zinc-500">Weekly Total</div>
                  <div className="text-xl font-light text-zinc-100">
                    {formatDose(weeklyDose, 'mg')}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 ml-4">
                  <ExportMenu 
                    currentProtocol={settings.protocol}
                  />
                  
                  <button
                    onClick={() => setShowDoseCalculator(true)}
                    className="group relative px-6 py-3 bg-zinc-950 border border-amber-500/30 rounded-xl
                             hover:border-amber-500/40 transition-all duration-500 overflow-hidden"
                    aria-label="Settings"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 
                                    translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    
                    <div className="relative flex items-center gap-2">
                      <Settings className="w-4 h-4 text-amber-500/80 group-hover:text-amber-500 transition-colors" />
                      <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
                        Settings
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12 max-w-7xl">
        <div id="calendar-container" className="card-premium p-8 fade-in-up" style={{ animationDelay: '0.2s' }}>
          <MonthlyCalendar 
            key={refreshKey}
            settings={settings} 
            onDateClick={handleDateClick}
          />
        </div>
      </main>

      {/* Dose Calculator Modal */}
      {showDoseCalculator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop fade-in">
          <div className="relative w-full max-w-lg transform scale-100 opacity-100 transition-all duration-500">
            <DoseCalculator
              settings={settings}
              onSettingsUpdate={handleSettingsUpdate}
              onClose={() => setShowDoseCalculator(false)}
            />
          </div>
        </div>
      )}

      {/* Record Injection Modal */}
      {selectedDate && (
        <RecordInjectionModal
          date={selectedDate}
          dose={calculation.mgPerInjection}
          onClose={() => setSelectedDate(null)}
          onComplete={handleRecordComplete}
        />
      )}

      {/* Premium Footer */}
      <footer className="px-4 py-12">
        <div className="container mx-auto max-w-7xl text-center">
          <p className="text-xs uppercase tracking-wider text-zinc-600 fade-in" style={{ animationDelay: '0.4s' }}>
            Always consult with your healthcare provider
          </p>
        </div>
      </footer>
    </div>
  );
}