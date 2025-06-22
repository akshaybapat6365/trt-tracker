import { get } from '@vercel/edge-config'
import ClientPage from './ClientPage'
import { UserSettings, InjectionRecord } from '@/lib/types'

interface TRTData {
  settings: UserSettings | null
  records: InjectionRecord[]
}

async function getData(): Promise<TRTData> {
  try {
    // Fetch data from Edge Config
    const data = await get<TRTData>('trtData')
    
    if (!data) {
      // Return default empty state if no data exists
      return {
        settings: null,
        records: []
      }
    }

    // Parse dates from the stored data
    if (data.settings) {
      data.settings.startDate = new Date(data.settings.startDate as unknown as string)
      data.settings.protocolStartDate = new Date(data.settings.protocolStartDate as unknown as string)
    }
    
    if (data.records) {
      data.records = data.records.map(record => ({
        ...record,
        date: new Date(record.date as unknown as string)
      }))
    }

    return data
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