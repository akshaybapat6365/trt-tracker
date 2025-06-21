'use client';

import React, { useState, useEffect } from 'react';
import InjectionCalendar from '@/components/InjectionCalendar';
import DoseCalculator from '@/components/DoseCalculator';
import ProtocolSwitcher from '@/components/ProtocolSwitcher';
import WeeklyAnalytics from '@/components/WeeklyAnalytics';
import { UserSettings, Protocol, InjectionRecord } from '@/lib/types';
import { storage } from '@/lib/storage';
import { calculateDose } from '@/lib/calculations';

const defaultSettings: UserSettings = {
  protocol: 'EOD',
  weeklyDose: 100,
  concentration: 200,
  syringe: { volume: 1, units: 100, deadSpace: 0.05 },
  startDate: new Date(),
  reminderTime: '08:00',
  enableNotifications: true,
};

export default function Home() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [injectionRecords, setInjectionRecords] = useState<InjectionRecord[]>([]);

  useEffect(() => {
    const savedSettings = storage.getUserSettings();
    if (savedSettings) {
      setSettings(savedSettings);
    }
    setInjectionRecords(storage.getInjectionRecords());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Refresh injection records periodically
    const interval = setInterval(() => {
      setInjectionRecords(storage.getInjectionRecords());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSettingsUpdate = (newSettings: UserSettings) => {
    setSettings(newSettings);
    storage.saveUserSettings(newSettings);
  };

  const handleProtocolChange = (protocol: Protocol) => {
    const newSettings = { ...settings, protocol };
    handleSettingsUpdate(newSettings);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const calculation = calculateDose(settings);

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">TRT Tracker</h1>
          <p className="text-muted-foreground">
            Track your testosterone replacement therapy protocol
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <InjectionCalendar 
              protocol={settings.protocol}
              startDate={settings.startDate}
              dose={calculation.mgPerInjection}
              settings={settings}
              onSettingsUpdate={handleSettingsUpdate}
            />
            
            <WeeklyAnalytics records={injectionRecords} />
            
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Protocol</p>
                  <p className="text-lg font-medium">{settings.protocol}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Weekly Dose</p>
                  <p className="text-lg font-medium">{settings.weeklyDose} mg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Per Injection</p>
                  <p className="text-lg font-medium">
                    {calculation.mgPerInjection.toFixed(1)} mg
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Volume</p>
                  <p className="text-lg font-medium">
                    {calculation.volumePerInjection.toFixed(3)} mL
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <ProtocolSwitcher
              currentProtocol={settings.protocol}
              onProtocolChange={handleProtocolChange}
            />
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="button-secondary w-full"
            >
              {showSettings ? 'Hide' : 'Show'} Dose Calculator
            </button>
            
            {showSettings && (
              <DoseCalculator
                settings={settings}
                onSettingsUpdate={handleSettingsUpdate}
              />
            )}
          </div>
        </div>

        <footer className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>TRT Tracker - Track your hormone replacement therapy</p>
          <p className="mt-2">
            Always consult with your healthcare provider before making changes to your protocol
          </p>
        </footer>
      </div>
    </div>
  );
}
