'use client';

import React, { useState } from 'react';
import { InjectionRecord, UserSettings } from '@/lib/types';

interface MissedDoseHandlerProps {
  missedRecord: InjectionRecord;
  settings: UserSettings;
  onComplete: (updatedRecord: InjectionRecord, newSettings?: UserSettings) => void;
  onCancel: () => void;
}

export default function MissedDoseHandler({
  missedRecord,
  settings,
  onComplete,
  onCancel,
}: MissedDoseHandlerProps) {
  const [rescheduleOption, setRescheduleOption] = useState<'skip' | 'shift' | 'maintain'>('skip');
  const [notes, setNotes] = useState('');

  const handleReschedule = () => {
    // Update the missed record with notes
    const updatedRecord: InjectionRecord = {
      ...missedRecord,
      missed: true,
      rescheduled: true,
      notes,
    };
    // If shifting schedule, update the start date in settings
    if (rescheduleOption === 'shift') {
      const nextDate = new Date(missedRecord.date);
      nextDate.setDate(nextDate.getDate() + 1); // Start from next day after missed dose
      
      const newSettings: UserSettings = {
        ...settings,
        startDate: nextDate,
      };
      onComplete(updatedRecord, newSettings);
    } else {
      onComplete(updatedRecord);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Handle Missed Dose</h3>
      
      <div className="text-sm text-muted-foreground">
        <p>Dose scheduled for: {missedRecord.date.toLocaleDateString()}</p>
        <p>Amount: {missedRecord.dose} mg</p>
      </div>

      <div className="space-y-3">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="radio"
            name="reschedule"
            value="skip"
            checked={rescheduleOption === 'skip'}
            onChange={(e) => setRescheduleOption(e.target.value as 'skip' | 'shift' | 'maintain')}
            className="mt-1"
          />
          <div>
            <p className="font-medium">Skip this dose</p>
            <p className="text-sm text-muted-foreground">
              Continue with the regular schedule, skipping only this injection
            </p>
          </div>
        </label>

        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="radio"
            name="reschedule"
            value="shift"
            checked={rescheduleOption === 'shift'}
            onChange={(e) => setRescheduleOption(e.target.value as 'skip' | 'shift' | 'maintain')}
            className="mt-1"
          />
          <div>
            <p className="font-medium">Shift entire schedule</p>
            <p className="text-sm text-muted-foreground">
              Reschedule all future injections starting from tomorrow
            </p>
          </div>
        </label>

        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="radio"
            name="reschedule"
            value="maintain"
            checked={rescheduleOption === 'maintain'}
            onChange={(e) => setRescheduleOption(e.target.value as 'skip' | 'shift' | 'maintain')}
            className="mt-1"
          />
          <div>
            <p className="font-medium">Maintain original schedule</p>
            <p className="text-sm text-muted-foreground">
              Keep the existing schedule unchanged, mark as missed only
            </p>
          </div>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about why this dose was missed..."
          className="w-full px-3 py-2 bg-accent border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleReschedule}
          className="button-primary flex-1"
        >
          Confirm
        </button>
        <button
          onClick={onCancel}
          className="button-secondary flex-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}