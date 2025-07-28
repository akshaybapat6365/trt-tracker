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
    // -------- Simplified parsing --------
    let parsedSettings: UserSettings | null = null
    if (data.settings) {
      parsedSettings = {
        ...data.settings,
        startDate: safeParseDate(data.settings.startDate) || new Date(),
        protocolStartDate: safeParseDate(data.settings.protocolStartDate) || new Date()
      }
    }

    const parsedRecords: InjectionRecord[] = Array.isArray(data.records)
      ? data.records
          .filter(r => r && r.date)               // require a date to exist
          .map(r => ({
            ...r,
            date: safeParseDate(r.date) || new Date()
          }))
      : []

    const cleanData: TRTData = { settings: parsedSettings, records: parsedRecords }
    console.log('Loaded TRT data:', {
      settings: !!cleanData.settings,
      recordCount: cleanData.records.length
    })

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
