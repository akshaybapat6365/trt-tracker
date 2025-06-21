export type Protocol = 'EOD' | 'E2D' | 'E3D';

export interface InjectionRecord {
  id: string;
  date: Date;
  dose: number;
  missed: boolean;
  rescheduled: boolean;
  notes?: string;
}

export interface SyringeConfiguration {
  volume: number; // in mL
  units: number; // total units on syringe
  deadSpace: number; // in mL
}

export interface UserSettings {
  protocol: Protocol;
  concentration: number; // mg/mL
  syringe: SyringeConfiguration;
  syringeFillAmount: number; // How much to fill syringe (0-1, e.g., 0.3 for 30%)
  startDate: Date;
  reminderTime: string; // HH:MM format
  enableNotifications: boolean;
}

export interface DoseCalculation {
  volumePerInjection: number; // in mL
  unitsPerInjection: number; // syringe units
  injectionsPerWeek: number;
  mgPerInjection: number;
}

export interface ProtocolSchedule {
  protocol: Protocol;
  nextInjectionDates: Date[];
  frequency: string;
  description: string;
}