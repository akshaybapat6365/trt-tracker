import { InjectionRecord, UserSettings } from './types';

const STORAGE_KEYS = {
  USER_SETTINGS: 'trt_user_settings',
  INJECTION_RECORDS: 'trt_injection_records',
} as const;

export const storage = {
  // User Settings
  getUserSettings(): UserSettings | null {
    if (typeof window === 'undefined') return null;
    
    const settings = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    if (!settings) return null;
    
    const parsed = JSON.parse(settings);
    return {
      ...parsed,
      startDate: new Date(parsed.startDate),
    };
  },

  saveUserSettings(settings: UserSettings): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
  },

  // Injection Records
  getInjectionRecords(): InjectionRecord[] {
    if (typeof window === 'undefined') return [];
    
    const records = localStorage.getItem(STORAGE_KEYS.INJECTION_RECORDS);
    if (!records) return [];
    
    return JSON.parse(records).map((record: any) => ({
      ...record,
      date: new Date(record.date),
    }));
  },

  saveInjectionRecord(record: InjectionRecord): void {
    if (typeof window === 'undefined') return;
    
    const records = this.getInjectionRecords();
    const existingIndex = records.findIndex(r => r.id === record.id);
    
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }
    
    localStorage.setItem(STORAGE_KEYS.INJECTION_RECORDS, JSON.stringify(records));
  },

  deleteInjectionRecord(id: string): void {
    if (typeof window === 'undefined') return;
    
    const records = this.getInjectionRecords();
    const filtered = records.filter(r => r.id !== id);
    
    localStorage.setItem(STORAGE_KEYS.INJECTION_RECORDS, JSON.stringify(filtered));
  },

  // Clear all data
  clearAllData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(STORAGE_KEYS.USER_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.INJECTION_RECORDS);
  },
};