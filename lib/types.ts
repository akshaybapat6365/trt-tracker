export type Protocol = 'Daily' | 'E2D' | 'E3D' | 'Weekly';

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

// New: Represents the settings for a single protocol
export interface ProtocolSettings {
  protocol: Protocol;
  concentration: number; // mg/mL
  syringe: SyringeConfiguration;
  syringeFillAmount: number; // How much to fill syringe (0-1, e.g., 0.3 for 30%)
  startDate: Date; // The date this specific protocol started
  protocolColor: string; // A color to identify this protocol on the chart
}

// Updated: UserSettings now contains a history of protocols
export interface UserSettings {
  treatmentStartDate: Date; // The very first day of TRT
  protocols: ProtocolSettings[];
  reminderTime: string; // HH:MM format
  enableNotifications: boolean;
  notificationPermission: 'default' | 'granted' | 'denied';
  theme: 'classic' | 'constellation';
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