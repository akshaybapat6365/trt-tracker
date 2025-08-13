import { get } from '@vercel/edge-config';
import ClientPage from './ClientPage';
import { UserSettings, InjectionRecord, ProtocolSettings } from '@/lib/types';
import { AnyTRTDataSchema, OldUserSettingsSchema, InjectionRecordSchema } from '@/lib/schemas';

interface TRTData {
  settings: UserSettings | null;
  records: InjectionRecord[];
}

// Data migration function
function migrateSettings(oldSettings: any): UserSettings {
  const treatmentStartDate = oldSettings.protocolStartDate || oldSettings.startDate || new Date();

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
    notificationPermission: 'default',
  };
}


async function getData(): Promise<TRTData> {
  try {
    console.log('Fetching from Edge Config...');
    const data = await get('trtData');
    console.log('Edge Config data:', data);

    if (!data) {
        console.log('No data found in Edge Config');
        return { settings: null, records: [] };
    }

    const parsed = AnyTRTDataSchema.safeParse(data);

    if (!parsed.success) {
      console.error('Zod validation failed:', parsed.error);
      return { settings: null, records: [] };
    }

    const rawData = parsed.data;
    let finalSettings: UserSettings | null = null;

    if (rawData.settings) {
      // Check if settings are in the old format
      if ('protocol' in rawData.settings) {
        console.log('Old settings format detected, migrating...');
        const oldSettings = OldUserSettingsSchema.parse(rawData.settings);
        finalSettings = migrateSettings(oldSettings);
      } else {
        finalSettings = rawData.settings as UserSettings;
      }
    }

    const finalRecords = (Array.isArray(rawData.records) ? rawData.records : [])
      .map(r => {
        const recordParse = InjectionRecordSchema.safeParse(r);
        return recordParse.success ? recordParse.data : null;
      })
      .filter((r): r is InjectionRecord => r !== null);


    return { settings: finalSettings, records: finalRecords };

  } catch (error) {
    console.error('Failed to fetch or parse data from Edge Config:', error);
    return { settings: null, records: [] };
  }
}


export default async function Page() {
  const initialData = await getData();
  return <ClientPage initialData={initialData} />;
}
