'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import DoseCalculator from '@/components/DoseCalculator';
import MinimalProtocolSelector from '@/components/MinimalProtocolSelector';
import RecordInjectionModal from '@/components/RecordInjectionModal';
import ConstellationCanvas from '@/components/ConstellationCanvas';

const ExportMenu = dynamic(() => import('@/components/ExportMenu'), { ssr: false });
const MonthlyCalendar = dynamic(() => import('@/components/MonthlyCalendar'), { ssr: false });
const InjectionChart = dynamic(() => import('@/components/InjectionChart'), { ssr: false });
import { UserSettings, Protocol, InjectionRecord, ProtocolSettings } from '@/lib/types';
import { TRTDataSchema } from '@/lib/schemas';
import { calculateDose, calculateWeeklyDose, formatDose } from '@/lib/calculations';
import { Settings, PlusCircle, Layout, Star } from 'lucide-react';
import download from 'downloadjs';
import { motion, AnimatePresence } from 'framer-motion';

// Default settings as a function to prevent date reuse issues
const getDefaultSettings = (): UserSettings => ({
  treatmentStartDate: new Date(),
  protocols: [
    {
      protocol: 'E2D',
      concentration: 200,
      syringe: { volume: 1, units: 100, deadSpace: 0.05 },
      syringeFillAmount: 0.3,
      startDate: new Date(),
      protocolColor: '#FFC107',
    },
  ],
  reminderTime: '08:00',
  enableNotifications: true,
  notificationPermission: 'default',
  theme: 'constellation',
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

// Helper to generate a random color for new protocols
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};


interface ClientPageProps {
  initialData: {
    settings: UserSettings | null;
    records: InjectionRecord[];
  };
}

export default function ClientPage({ initialData }: ClientPageProps) {
  console.log('ClientPage initializing with data:', initialData);

  const [settings, setSettings] = useState<UserSettings>(() => {
    if (!initialData.settings) {
      console.log('No saved settings found, using defaults');
      return getDefaultSettings();
    }
    // Data from page.tsx is already parsed and migrated
    return initialData.settings;
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

  // Helper to get the current protocol
  const getCurrentProtocol = (): ProtocolSettings => {
    // The last protocol in the array is the current one
    return settings.protocols[settings.protocols.length - 1];
  };

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
      if (!newSettings || !newSettings.protocols || newSettings.protocols.length === 0) {
        throw new Error('Invalid settings data');
      }
      
      // Prepare data for saving - simplify serialization
      const dataToSave = {
        settings: {
          ...newSettings,
          treatmentStartDate: newSettings.treatmentStartDate.toISOString(),
          protocols: newSettings.protocols.map(p => ({
            ...p,
            startDate: p.startDate.toISOString(),
          })),
        },
        records: newRecords.map(record => ({
          ...record,
          date: record.date.toISOString()
        }))
      };
      
      console.log('Sending data to API:', {
        protocolsCount: dataToSave.settings.protocols.length,
        recordCount: dataToSave.records.length,
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

  // Updated to handle ProtocolSettings
  const handleSettingsUpdate = async (updatedProtocolSettings: ProtocolSettings) => {
    console.log('Updating current protocol settings');
    
    const newSettings = { ...settings };
    newSettings.protocols[newSettings.protocols.length - 1] = updatedProtocolSettings;
    
    setSettings(newSettings);
    await saveToCloud(newSettings, injectionRecords);
    setShowDoseCalculator(false);
  };

  const handleReminderTimeChange = async (time: string) => {
    const newSettings = { ...settings, reminderTime: time };
    setSettings(newSettings);
    await saveToCloud(newSettings, injectionRecords);
  };

  const handleNotificationPermissionRequest = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      const newSettings = { ...settings, notificationPermission: permission };
      setSettings(newSettings);
      await saveToCloud(newSettings, injectionRecords);
    }
  };

  useEffect(() => {
    if (settings.notificationPermission === 'granted' && settings.enableNotifications) {
      // Logic to schedule notifications will go here.
      // This is a complex task that requires calculating future injection dates
      // and setting up timers. For now, we'll just log a message.
      console.log('Notifications are enabled. Scheduling reminders...');
    }
  }, [settings.notificationPermission, settings.enableNotifications]);

  // Updated to add a new protocol to the history
  const handleProtocolChange = async (protocol: Protocol) => {
    console.log('Changing protocol, adding new entry to history');
    
    const currentProtocol = getCurrentProtocol();
    const newProtocol: ProtocolSettings = {
      ...currentProtocol,
      protocol: protocol,
      startDate: new Date(), // New protocol starts now
      protocolColor: getRandomColor(),
    };

    const newSettings = {
      ...settings,
      protocols: [...settings.protocols, newProtocol],
    };
    
    setSettings(newSettings);
    await saveToCloud(newSettings, injectionRecords);
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

  const handleThemeChange = async () => {
    const newTheme = settings.theme === 'classic' ? 'constellation' : 'classic';
    const newSettings = { ...settings, theme: newTheme };
    setSettings(newSettings);
    await saveToCloud(newSettings, injectionRecords);
  };

  const handleExportData = () => {
    const dataToExport = {
      settings,
      records: injectionRecords,
    };
    const json = JSON.stringify(dataToExport, null, 2);
    download(json, `trt-tracker-backup-${new Date().toISOString()}.json`, 'application/json');
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('File is not a valid text file.');
        }
        const jsonData = JSON.parse(text);
        const parsedData = TRTDataSchema.safeParse(jsonData);

        if (!parsedData.success) {
          throw new Error(`Invalid data format: ${parsedData.error.message}`);
        }

        const newSettings = parsedData.data.settings || getDefaultSettings();
        const newRecords = parsedData.data.records || [];

        setSettings(newSettings);
        setInjectionRecords(newRecords.map(r => ({...r, date: new Date(r.date)}))); // Re-hydrate dates
        await saveToCloud(newSettings, newRecords);
        alert('Data imported successfully!');
      } catch (error) {
        console.error('Failed to import data:', error);
        alert(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  };

  const currentProtocol = getCurrentProtocol();
  const calculation = calculateDose(currentProtocol);
  const weeklyDose = calculateWeeklyDose(currentProtocol);

  return (
    <div className="min-h-screen bg-zinc-950 relative">
      {/* Grain texture overlay */}
      <div className="grain-overlay" />
      
      {/* Cursor glow */}
      <div ref={cursorRef} className="cursor-glow" />
      
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-6">
        <div className="container mx-auto max-w-7xl">
          <div className="rounded-2xl px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-10">
                <h1 className="text-3xl font-light tracking-tight text-zinc-100">
                  TRT <span className="text-sky-400">Constellation</span>
                </h1>
                <MinimalProtocolSelector
                  currentProtocol={currentProtocol.protocol}
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
                    currentProtocol={currentProtocol.protocol}
                    onExportData={handleExportData}
                    onImportData={handleImportData}
                  />
                  
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="group relative px-6 py-3 bg-sky-500/10 border border-sky-500/30 rounded-xl
                             hover:border-sky-500/40 transition-all duration-500 overflow-hidden
                             hover:scale-105 transform-gpu"
                    aria-label="Log Injection"
                  >
                    <div className="relative flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-sky-400/80 group-hover:text-sky-400 transition-colors" />
                      <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
                        Log Injection
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={handleThemeChange}
                    className="group relative px-6 py-3 bg-zinc-900/50 border border-zinc-700 rounded-xl
                             hover:border-zinc-600 transition-all duration-500 overflow-hidden
                             hover:scale-105 transform-gpu"
                    aria-label="Change Theme"
                  >
                    <div className="relative flex items-center gap-2">
                      {settings.theme === 'classic' ? <Star className="w-4 h-4 text-zinc-400/80 group-hover:text-zinc-300 transition-colors" /> : <Layout className="w-4 h-4 text-zinc-400/80 group-hover:text-zinc-300 transition-colors" />}
                      <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
                        {settings.theme === 'classic' ? 'Constellation' : 'Classic'}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => setShowDoseCalculator(true)}
                    className="group relative px-6 py-3 bg-zinc-900/50 border border-zinc-700 rounded-xl
                             hover:border-zinc-600 transition-all duration-500 overflow-hidden
                             hover:scale-105 transform-gpu"
                    aria-label="Settings"
                  >
                    <div className="relative flex items-center gap-2">
                      <Settings className="w-4 h-4 text-zinc-400/80 group-hover:text-zinc-300 transition-colors" />
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
      {settings.theme === 'constellation' ? (
        <main className="fixed inset-0 z-0">
          <ConstellationCanvas records={injectionRecords} protocols={settings.protocols} />
        </main>
      ) : (
        <main className="container mx-auto px-4 pb-12 max-w-7xl">
          <div id="calendar-container" className="card-premium p-8 fade-in-up" style={{ animationDelay: '0.2s' }}>
            <MonthlyCalendar
              key={refreshKey}
              settings={currentProtocol}
              records={injectionRecords}
              onDateClick={(date) => setSelectedDate(date)}
              onProtocolStartDateChange={() => { /* This needs to be implemented if we keep this view */ }}
            />
          </div>

          {injectionRecords.length > 0 && (
            <div className="mt-8 fade-in-up" style={{ animationDelay: '0.4s' }}>
              <InjectionChart records={injectionRecords} protocols={settings.protocols} />
            </div>
          )}
        </main>
      )}

      {/* Dose Calculator Modal */}
      <AnimatePresence>
        {showDoseCalculator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-lg"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dose-calculator-title"
            >
              <DoseCalculator
                settings={currentProtocol}
                onSettingsUpdate={handleSettingsUpdate}
                onClose={() => setShowDoseCalculator(false)}
                onNotificationPermissionRequest={handleNotificationPermissionRequest}
                notificationPermission={settings.notificationPermission}
                reminderTime={settings.reminderTime}
                onReminderTimeChange={handleReminderTimeChange}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Record Injection Modal */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-md"
              role="dialog"
              aria-modal="true"
              aria-labelledby="record-injection-title"
            >
              <RecordInjectionModal
                date={selectedDate}
                dose={calculation.mgPerInjection}
                onClose={() => setSelectedDate(null)}
                onComplete={handleRecordComplete}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
