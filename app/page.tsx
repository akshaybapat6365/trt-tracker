'use client';

import React, { useState, useEffect } from 'react';
import MonthlyCalendar from '@/components/MonthlyCalendar';
import DoseCalculator from '@/components/DoseCalculator';
import MinimalProtocolSelector from '@/components/MinimalProtocolSelector';
import RecordInjectionModal from '@/components/RecordInjectionModal';
import { UserSettings, Protocol } from '@/lib/types';
import { storage } from '@/lib/storage';
import { calculateDose, calculateWeeklyDose, formatDose } from '@/lib/calculations';

const defaultSettings: UserSettings = {
  protocol: 'E2D',
  concentration: 200,
  syringe: { volume: 1, units: 100, deadSpace: 0.05 },
  syringeFillAmount: 0.3,
  startDate: new Date(),
  reminderTime: '08:00',
  enableNotifications: true,
};

export default function Home() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [showDoseCalculator, setShowDoseCalculator] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const savedSettings = storage.getUserSettings();
    if (savedSettings) {
      setSettings(savedSettings);
    }
    setIsLoading(false);
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
    setRefreshKey(prev => prev + 1); // Force calendar refresh
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-full p-8 animate-pulse-glow">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const calculation = calculateDose(settings);
  const weeklyDose = calculateWeeklyDose(settings);

  return (
    <div className="min-h-screen">
      {/* Floating Header */}
      <header className="sticky top-0 z-40 px-4 py-4">
        <div className="container mx-auto max-w-7xl">
          <div className="glass-strong rounded-2xl px-6 py-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <h1 className="text-2xl font-bold gradient-text">TRT Tracker</h1>
                <MinimalProtocolSelector
                  currentProtocol={settings.protocol}
                  onProtocolChange={handleProtocolChange}
                />
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-sm space-y-1">
                  <div className="text-white/60">Per injection</div>
                  <div className="text-lg font-semibold gradient-text">
                    {formatDose(calculation.mgPerInjection, 'mg')}
                  </div>
                </div>
                
                <div className="w-px h-10 bg-white/10" />
                
                <div className="text-sm space-y-1">
                  <div className="text-white/60">Weekly total</div>
                  <div className="text-lg font-semibold gradient-text">
                    {formatDose(weeklyDose, 'mg')}
                  </div>
                </div>
                
                <button
                  onClick={() => setShowDoseCalculator(true)}
                  className="ml-4 p-3 glass rounded-xl gradient-border-hover glow transition-smooth"
                  aria-label="Dose Calculator"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-8 max-w-7xl">
        <div className="card-strong rounded-2xl p-8 animate-fade-in stagger-2">
          <MonthlyCalendar 
            key={refreshKey}
            settings={settings} 
            onDateClick={handleDateClick}
          />
        </div>
      </main>

      {/* Dose Calculator Modal */}
      {showDoseCalculator && (
        <div className="modal-backdrop animate-fade-in">
          <div className="glass-strong rounded-2xl max-w-md w-full p-8 animate-slide-in">
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

      {/* Floating Footer */}
      <footer className="px-4 py-8">
        <div className="container mx-auto max-w-7xl text-center">
          <p className="text-sm text-white/40 animate-fade-in stagger-3">
            Always consult with your healthcare provider before making changes to your protocol
          </p>
        </div>
      </footer>
    </div>
  );
}