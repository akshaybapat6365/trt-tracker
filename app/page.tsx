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
  protocol: 'EOD',
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
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  const calculation = calculateDose(settings);
  const weeklyDose = calculateWeeklyDose(settings);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Minimal Header */}
      <header className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-semibold">TRT Tracker</h1>
              <MinimalProtocolSelector
                currentProtocol={settings.protocol}
                onProtocolChange={handleProtocolChange}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-zinc-400">
                {formatDose(calculation.mgPerInjection, 'mg')} per injection
                <span className="mx-2">·</span>
                {formatDose(weeklyDose, 'mg')} weekly
              </div>
              
              <button
                onClick={() => setShowDoseCalculator(true)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
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
      </header>

      {/* Main Calendar */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <MonthlyCalendar 
          key={refreshKey}
          settings={settings} 
          onDateClick={handleDateClick}
        />
      </main>

      {/* Dose Calculator Modal */}
      {showDoseCalculator && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6">
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

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-800 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-zinc-500">
          Always consult with your healthcare provider before making changes to your protocol
        </div>
      </footer>
    </div>
  );
}