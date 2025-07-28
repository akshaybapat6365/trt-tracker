'use client';

import React, { useState, useEffect, useRef } from 'react';
import MonthlyCalendar from '@/components/MonthlyCalendar';
import DoseCalculator from '@/components/DoseCalculator';
import MinimalProtocolSelector from '@/components/MinimalProtocolSelector';
import RecordInjectionModal from '@/components/RecordInjectionModal';
import ExportMenu from '@/components/ExportMenu';
import InjectionChart from '@/components/InjectionChart';
import { UserSettings, Protocol, InjectionRecord } from '@/lib/types';
import { calculateDose, calculateWeeklyDose, formatDose } from '@/lib/calculations';
import { Settings } from 'lucide-react';

// Default settings as a function to prevent date reuse issues
const getDefaultSettings = (): UserSettings => ({
  protocol: 'E2D',
  concentration: 200,
  syringe: { volume: 1, units: 100, deadSpace: 0.05 },
  syringeFillAmount: 0.3,
  startDate: new Date(),
  protocolStartDate: new Date(),
  reminderTime: '08:00',
  enableNotifications: true,
});

// Helper function to safely parse dates
const safeParseDate = (dateValue: any): Date => {
  if (dateValue instanceof Date) return new Date(dateValue);
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date(); // Fallback to current date if invalid
};

interface ClientPageProps {
  initialData: {
    settings: UserSettings | null;
    records: InjectionRecord[];
  };
}

export default function ClientPage({ initialData }: ClientPageProps) {
  console.log('ClientPage initializing with data:', initialData);
  
  // Simplified settings initialization
  const [settings, setSettings] = useState<UserSettings>(() => {
    if (!initialData.settings) {
      console.log('No saved settings found, using defaults');
      return getDefaultSettings();
    }
    
    try {
      // Create a clean settings object with properly parsed dates
      const savedSettings = initialData.settings;
      console.log('Found saved settings:', savedSettings);
      
      const mergedSettings = {
        ...getDefaultSettings(), // Start with defaults for any missing fields
        ...savedSettings, // Override with saved values
        // Explicitly handle dates to avoid serialization issues
        startDate: safeParseDate(savedSettings.startDate),
        protocolStartDate: safeParseDate(savedSettings.protocolStartDate)
      };
      
      console.log('Initialized settings with dates:', {
        startDate: mergedSettings.startDate.toISOString(),
        protocolStartDate: mergedSettings.protocolStartDate.toISOString()
      });
      
      return mergedSettings;
    } catch (error) {
      console.error('Error initializing settings:', error);
      return getDefaultSettings();
    }
  });
  
  // Simplified record initialization with safe date parsing
  const [injectionRecords, setInjectionRecords] = useState<InjectionRecord[]>(() => {
    try {
      if (!initialData.records || !Array.isArray(initialData.records)) {
        console.log('No valid records found');
        return [];
      }
      
      console.log(`Processing ${initialData.records.length} saved records`);
      
      // Parse dates in records and filter out any invalid ones
      return initialData.records
        .filter(record => record && record.id && record.date)
        .map(record => ({
          ...record,
          date: safeParseDate(record.date)
        }));
    } catch (error) {
      console.error('Error initializing records:', error);
      return [];
    }
  });
  
  const [showDoseCalculator, setShowDoseCalculator] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  // Simplified data saving with better error handling
  const saveToCloud = async (newSettings: UserSettings, newRecords: InjectionRecord[]) => {
    if (isSaving) {
      console.log('Save already in progress, skipping');
      return;
    }
    
    try {
      setIsSaving(true);
      console.log('Starting save to Edge Config');
      
      // Simple validation
      if (!newSettings || !newSettings.protocol) {
        throw new Error('Invalid settings data');
      }
      
      // Prepare data for saving - simplify serialization
      const dataToSave = {
        settings: {
          ...newSettings,
          // Only convert dates to strings
          startDate: newSettings.startDate.toISOString(),
          protocolStartDate: newSettings.protocolStartDate.toISOString(),
        },
        records: newRecords.map(record => ({
          ...record,
          date: record.date.toISOString()
        }))
      };
      
      console.log('Sending data to API:', {
        settingsProtocol: dataToSave.settings.protocol,
        recordCount: dataToSave.records.length,
        protocolStartDate: dataToSave.settings.protocolStartDate
      });
      
      const response = await fetch('/api/update-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error response:', response.status, errorData);
        throw new Error(`Server error: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Save successful:', data);
      
      // Update UI
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to save data:', error);
      alert(`Failed to save your data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

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

  // Improved settings update to preserve important data
  const handleSettingsUpdate = async (newSettings: UserSettings) => {
    console.log('Updating settings', {
      current: settings.protocol,
      new: newSettings.protocol
    });
    
    // Ensure we preserve the protocol start date unless explicitly changed
    const updatedSettings = {
      ...newSettings,
      protocolStartDate: newSettings.protocolStartDate && 
                         newSettings.protocolStartDate.getTime() !== settings.protocolStartDate.getTime() 
        ? newSettings.protocolStartDate  // Use new date if explicitly changed
        : settings.protocolStartDate     // Keep existing date otherwise
    };
    
    console.log('Settings update - preserving dates:', {
      protocolStartDate: updatedSettings.protocolStartDate.toISOString()
    });
    
    setSettings(updatedSettings);
    await saveToCloud(updatedSettings, injectionRecords);
    setShowDoseCalculator(false);
  };

  // Fixed protocol change logic to preserve history and dates
  const handleProtocolChange = async (protocol: Protocol) => {
    console.log('Changing protocol', { from: settings.protocol, to: protocol });
    
    // Only update the protocol field, preserve everything else
    const newSettings = { 
      ...settings,
      protocol,
    };
    
    // Log the preserved dates
    console.log('Protocol change - preserving dates:', {
      startDate: newSettings.startDate.toISOString(),
      protocolStartDate: newSettings.protocolStartDate.toISOString()
    });
    
    setSettings(newSettings);
    await saveToCloud(newSettings, injectionRecords);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleRecordComplete = async (newRecord: InjectionRecord) => {
    console.log('Recording injection:', newRecord);
    
    const updatedRecords = [...injectionRecords];
    const existingIndex = updatedRecords.findIndex(r => r.id === newRecord.id);
    
    if (existingIndex >= 0) {
      updatedRecords[existingIndex] = newRecord;
    } else {
      updatedRecords.push(newRecord);
    }
    
    console.log(`Updated records (${updatedRecords.length} total)`);
    setInjectionRecords(updatedRecords);
    await saveToCloud(settings, updatedRecords);
    setSelectedDate(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleProtocolStartDateChange = async (date: Date) => {
    console.log('Changing protocol start date:', date.toISOString());
    const newSettings = { ...settings, protocolStartDate: date };
    setSettings(newSettings);
    await saveToCloud(newSettings, injectionRecords);
    setRefreshKey(prev => prev + 1);
  };

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
          <div className="glass-card rounded-2xl px-8 py-5 fade-in shadow-premium">
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
                             hover:border-amber-500/40 transition-all duration-500 overflow-hidden
                             hover:scale-105 transform-gpu btn-glow"
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
        <div id="calendar-container" className="card-premium p-8 fade-in-up shadow-premium-hover" style={{ animationDelay: '0.2s' }}>
          <MonthlyCalendar 
            key={refreshKey}
            settings={settings}
            records={injectionRecords}
            onDateClick={handleDateClick}
            onProtocolStartDateChange={handleProtocolStartDateChange}
          />
        </div>
        
        {/* Injection History Chart */}
        {injectionRecords.length > 0 && (
          <div className="mt-8 fade-in-up" style={{ animationDelay: '0.4s' }}>
            <InjectionChart records={injectionRecords} />
          </div>
        )}
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
