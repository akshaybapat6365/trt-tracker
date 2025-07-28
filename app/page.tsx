import { get } from '@vercel/edge-config'
import ClientPage from './ClientPage'
import { UserSettings, InjectionRecord } from '@/lib/types'

interface TRTData {
  settings: UserSettings | null
  records: InjectionRecord[]
}

// Utility: robust date parsing with fallbacks
function safeParseDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date && !isNaN(value as unknown as number)) return value
  const str = String(value)
  const ts = Date.parse(str)
  return isNaN(ts) ? null : new Date(ts)
}

function isValidSettings(obj: any): obj is UserSettings {
  if (!obj) return false
  // Basic integrity checks
  return typeof obj.protocol === 'string' &&
    typeof obj.concentration === 'number' &&
    !!safeParseDate(obj.startDate) &&
    !!safeParseDate(obj.protocolStartDate)
}

function isValidRecord(obj: any): obj is InjectionRecord {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.dose === 'number' &&
    typeof obj.missed === 'boolean' &&
    typeof obj.rescheduled === 'boolean' &&
    !!safeParseDate(obj.date)
}

async function getData(): Promise<TRTData> {
  try {
    console.log('Fetching from Edge Config...')
    // Fetch data from Edge Config
    const data = await get<TRTData>('trtData')
    console.log('Edge Config data:', data)
    
    if (!data) {
      console.log('No data found in Edge Config')
      // Return default empty state if no data exists
      return {
        settings: null,
        records: []
      }
    }

    // Validate and transform data defensively
    const parsedSettings = isValidSettings(data.settings)
      ? {
          ...data.settings,
          startDate: safeParseDate(data.settings!.startDate)!,
          protocolStartDate: safeParseDate(data.settings!.protocolStartDate)!
        }
      : null

    const parsedRecords: InjectionRecord[] = Array.isArray(data.records)
      ? data.records
          .filter(isValidRecord)
          .map(r => ({ ...r, date: safeParseDate(r.date)! }))
      : []

    const cleanData: TRTData = { settings: parsedSettings, records: parsedRecords }
    console.log('Parsed data:', cleanData)
    return cleanData
  } catch (error) {
    console.error('Failed to fetch data from Edge Config:', error)
    return {
      settings: null,
      records: []
    }
  }
}

export default async function Page() {
  const initialData = await getData()
  
  return <ClientPage initialData={initialData} />
}
