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
  weeklyDose: number; // in mg
  concentration: number; // mg/mL
  syringe: SyringeConfiguration;
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