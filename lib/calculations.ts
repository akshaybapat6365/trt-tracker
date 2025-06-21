import { Protocol, UserSettings, DoseCalculation, ProtocolSchedule } from './types';

export function calculateDose(settings: UserSettings): DoseCalculation {
  const { protocol, concentration, syringe, syringeFillAmount } = settings;
  
  // Calculate injections per week based on protocol
  const injectionsPerWeek = getInjectionsPerWeek(protocol);
  
  // Calculate volume per injection based on syringe fill
  const volumePerInjection = syringe.volume * syringeFillAmount;
  
  // Calculate mg per injection
  const mgPerInjection = volumePerInjection * concentration;
  
  // Calculate units on syringe
  const unitsPerML = syringe.units / syringe.volume;
  const unitsPerInjection = volumePerInjection * unitsPerML;
  
  return {
    volumePerInjection,
    unitsPerInjection,
    injectionsPerWeek,
    mgPerInjection,
  };
}

export function calculateWeeklyDose(settings: UserSettings): number {
  const dose = calculateDose(settings);
  return dose.mgPerInjection * dose.injectionsPerWeek;
}

export function getInjectionsPerWeek(protocol: Protocol): number {
  switch (protocol) {
    case 'Daily':
      return 7; // Every day
    case 'E2D':
      return 3.5; // Every 2 days
    case 'E3D':
      return 2.33; // Every 3 days averages to ~2.33 per week
    case 'Weekly':
      return 1; // Once per week
    default:
      return 3.5;
  }
}

export function getNextInjectionDates(startDate: Date, protocol: Protocol, count: number = 10): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  const daysToAdd = getDaysToAdd(protocol);
  
  for (let i = 0; i < count; i++) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + daysToAdd);
  }
  
  return dates;
}

function getDaysToAdd(protocol: Protocol): number {
  switch (protocol) {
    case 'Daily':
      return 1;
    case 'E2D':
      return 2;
    case 'E3D':
      return 3;
    case 'Weekly':
      return 7;
    default:
      return 2;
  }
}

export function getProtocolInfo(protocol: Protocol): ProtocolSchedule {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const schedules: Record<Protocol, { frequency: string; description: string }> = {
    Daily: {
      frequency: 'Every Day',
      description: 'Daily injections for the most stable hormone levels',
    },
    E2D: {
      frequency: 'Every 2 Days',
      description: 'Inject every 2 days for stable levels',
    },
    E3D: {
      frequency: 'Every 3 Days',
      description: 'Inject twice per week with 3-day intervals',
    },
    Weekly: {
      frequency: 'Once Per Week',
      description: 'Traditional weekly injection protocol',
    },
  };
  
  return {
    protocol,
    nextInjectionDates: getNextInjectionDates(today, protocol),
    ...schedules[protocol],
  };
}

export function isInjectionDue(lastInjectionDate: Date, protocol: Protocol): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysSinceLastInjection = Math.floor(
    (today.getTime() - lastInjectionDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const daysRequired = getDaysToAdd(protocol);
  
  return daysSinceLastInjection >= daysRequired;
}

export function formatDose(dose: number, unit: 'mg' | 'mL' | 'units'): string {
  switch (unit) {
    case 'mg':
      return `${dose.toFixed(1)} mg`;
    case 'mL':
      return `${dose.toFixed(3)} mL`;
    case 'units':
      return `${Math.round(dose)} units`;
    default:
      return dose.toString();
  }
}

export function rescheduleFromDate(
  fromDate: Date, 
  protocol: Protocol, 
  count: number = 30
): Date[] {
  // Start rescheduling from the day after the missed dose
  const startDate = new Date(fromDate);
  startDate.setDate(startDate.getDate() + 1);
  
  return getNextInjectionDates(startDate, protocol, count);
}