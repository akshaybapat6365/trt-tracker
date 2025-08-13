import { get } from '@vercel/edge-config';
import ClientPage from './ClientPage';
import { UserSettings, InjectionRecord, ProtocolSettings } from '@/lib/types';

interface TRTData {
  settings: UserSettings | null;
  records: InjectionRecord[];
}

// Utility: robust date parsing with fallbacks
function safeParseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value as unknown as number)) return value;
  const str = String(value);
  const ts = Date.parse(str);
  return isNaN(ts) ? null : new Date(ts);
}

// Data migration function
function migrateSettings(oldSettings: any): UserSettings {
  const treatmentStartDate = safeParseDate(oldSettings.protocolStartDate) || safeParseDate(oldSettings.startDate) || new Date();

  const firstProtocol: ProtocolSettings = {
    protocol: oldSettings.protocol || 'E2D',
    concentration: oldSettings.concentration || 200,
    syringe: oldSettings.syringe || { volume: 1, units: 100, deadSpace: 0.05 },
    syringeFillAmount: oldSettings.syringeFillAmount || 0.3,
    startDate: treatmentStartDate,
    protocolColor: '#FFC107', // Default color
  };

  return {
    treatmentStartDate,
    protocols: [firstProtocol],
    reminderTime: oldSettings.reminderTime || '08:00',
    enableNotifications: oldSettings.enableNotifications !== undefined ? oldSettings.enableNotifications : true,
  };
}


async function getData(): Promise<TRTData> {
  try {
    console.log('Fetching from Edge Config...');
    const data = await get<any>('trtData'); // Fetch as 'any' to handle old and new structure
    console.log('Edge Config data:', data);

    if (!data) {
      console.log('No data found in Edge Config');
      return { settings: null, records: [] };
    }

    let parsedSettings: UserSettings | null = null;
    if (data.settings) {
      // Check if data needs migration
      if (!data.settings.protocols) {
        console.log('Old settings format detected, migrating...');
        parsedSettings = migrateSettings(data.settings);
      } else {
        // New format, just parse dates
        parsedSettings = {
          ...data.settings,
          treatmentStartDate: safeParseDate(data.settings.treatmentStartDate) || new Date(),
          protocols: data.settings.protocols.map((p: any) => ({
            ...p,
            startDate: safeParseDate(p.startDate) || new Date(),
          })),
        };
      }
    }

    const parsedRecords: InjectionRecord[] = Array.isArray(data.records)
      ? data.records
          .filter(r => r && r.date)
          .map(r => ({
            ...r,
            date: safeParseDate(r.date) || new Date(),
          }))
      : [];

    const cleanData: TRTData = { settings: parsedSettings, records: parsedRecords };
    console.log('Loaded TRT data:', {
      settings: !!cleanData.settings,
      recordCount: cleanData.records.length,
    });

    return cleanData;
  } catch (error) {
    console.error('Failed to fetch data from Edge Config:', error);
    return { settings: null, records: [] };
  }
}


export default async function Page() {
  const initialData = await getData();
  return <ClientPage initialData={initialData} />;
}
