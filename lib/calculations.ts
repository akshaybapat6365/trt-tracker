import { Protocol, UserSettings, DoseCalculation, ProtocolSchedule } from './types';

export function calculateDose(settings: UserSettings): DoseCalculation {
  const { protocol, weeklyDose, concentration, syringe } = settings;
  
  // Calculate injections per week based on protocol
  const injectionsPerWeek = getInjectionsPerWeek(protocol);
  
  // Calculate mg per injection
  const mgPerInjection = weeklyDose / injectionsPerWeek;
  
  // Calculate volume per injection (mL)
  const volumePerInjection = mgPerInjection / concentration;
  
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

export function getInjectionsPerWeek(protocol: Protocol): number {
  switch (protocol) {
    case 'EOD':
      return 3.5; // Every other day averages to 3.5 per week
    case 'E2D':
      return 3.5; // Every 2 days
    case 'E3D':
      return 2.33; // Every 3 days averages to ~2.33 per week
    default:
      return 3.5;
  }
}

export function getNextInjectionDates(startDate: Date, protocol: Protocol, count: number = 10): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  
  const daysToAdd = getDaysToAdd(protocol);
  
  for (let i = 0; i < count; i++) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + daysToAdd);
  }
  
  return dates;
}

function getDaysToAdd(protocol: Protocol): number {
  switch (protocol) {
    case 'EOD':
      return 2;
    case 'E2D':
      return 2;
    case 'E3D':
      return 3;
    default:
      return 2;
  }
}

export function getProtocolInfo(protocol: Protocol): ProtocolSchedule {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const schedules: Record<Protocol, { frequency: string; description: string }> = {
    EOD: {
      frequency: 'Every Other Day',
      description: 'Inject every 2 days for stable hormone levels',
    },
    E2D: {
      frequency: 'Every 2 Days',
      description: 'Same as EOD - inject every 2 days',
    },
    E3D: {
      frequency: 'Every 3 Days',
      description: 'Inject twice per week with 3-day intervals',
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