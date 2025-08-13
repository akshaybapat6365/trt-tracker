import { z } from 'zod';

export const InjectionRecordSchema = z.object({
  id: z.string(),
  date: z.coerce.date(),
  dose: z.number(),
  missed: z.boolean(),
  rescheduled: z.boolean(),
  notes: z.string().optional(),
});

export const SyringeConfigurationSchema = z.object({
  volume: z.number(),
  units: z.number(),
  deadSpace: z.number(),
});

export const ProtocolSettingsSchema = z.object({
  protocol: z.enum(['Daily', 'E2D', 'E3D', 'Weekly']),
  concentration: z.number(),
  syringe: SyringeConfigurationSchema,
  syringeFillAmount: z.number(),
  startDate: z.coerce.date(),
  protocolColor: z.string(),
});

export const UserSettingsSchema = z.object({
  treatmentStartDate: z.coerce.date(),
  protocols: z.array(ProtocolSettingsSchema),
  reminderTime: z.string(),
  enableNotifications: z.boolean(),
  notificationPermission: z.enum(['default', 'granted', 'denied']),
});

// Schema for the old UserSettings format for migration
export const OldUserSettingsSchema = z.object({
  protocol: z.enum(['Daily', 'E2D', 'E3D', 'Weekly']),
  concentration: z.number(),
  syringe: SyringeConfigurationSchema,
  syringeFillAmount: z.number(),
  startDate: z.coerce.date(),
  protocolStartDate: z.coerce.date(),
  reminderTime: z.string(),
  enableNotifications: z.boolean(),
  notificationPermission: z.enum(['default', 'granted', 'denied']).optional(),
});

export const TRTDataSchema = z.object({
  settings: UserSettingsSchema.nullable(),
  records: z.array(InjectionRecordSchema),
});

// A schema that can parse both old and new settings
export const AnyTRTDataSchema = z.object({
    settings: z.union([OldUserSettingsSchema, UserSettingsSchema]).nullable(),
    records: z.array(z.any()), // Keep records as any for now to handle malformed data gracefully
});
