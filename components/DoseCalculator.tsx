'use client';

import React, { useState, useEffect } from 'react';
import { UserSettings, SyringeConfiguration } from '@/lib/types';
import { calculateDose, formatDose } from '@/lib/calculations';

interface DoseCalculatorProps {
  settings: UserSettings;
  onSettingsUpdate: (settings: UserSettings) => void;
}

export default function DoseCalculator({ settings, onSettingsUpdate }: DoseCalculatorProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [calculation, setCalculation] = useState(calculateDose(settings));

  useEffect(() => {
    const newCalculation = calculateDose(localSettings);
    setCalculation(newCalculation);
  }, [localSettings]);

  const commonSyringes: SyringeConfiguration[] = [
    { volume: 1, units: 100, deadSpace: 0.05 },
    { volume: 0.5, units: 50, deadSpace: 0.03 },
    { volume: 0.3, units: 30, deadSpace: 0.02 },
  ];

  const handleSave = () => {
    onSettingsUpdate(localSettings);
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Dose Calculator</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Weekly Dose (mg)</label>
          <input
            type="number"
            value={localSettings.weeklyDose}
            onChange={(e) => setLocalSettings({
              ...localSettings,
              weeklyDose: parseFloat(e.target.value) || 0
            })}
            className="input w-full"
            step="5"
            min="0"
            max="500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Concentration (mg/mL)</label>
          <select
            value={localSettings.concentration}
            onChange={(e) => setLocalSettings({
              ...localSettings,
              concentration: parseFloat(e.target.value)
            })}
            className="input w-full"
          >
            <option value="100">100 mg/mL</option>
            <option value="200">200 mg/mL</option>
            <option value="250">250 mg/mL</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Syringe Type</label>
          <select
            value={`${localSettings.syringe.volume}-${localSettings.syringe.units}`}
            onChange={(e) => {
              const syringe = commonSyringes.find(
                s => `${s.volume}-${s.units}` === e.target.value
              );
              if (syringe) {
                setLocalSettings({ ...localSettings, syringe });
              }
            }}
            className="input w-full"
          >
            {commonSyringes.map((s) => (
              <option key={`${s.volume}-${s.units}`} value={`${s.volume}-${s.units}`}>
                {s.volume}mL / {s.units} units
              </option>
            ))}
          </select>
        </div>

        <div className="pt-4 border-t border-border">
          <h3 className="font-medium mb-2">Calculated Dose per Injection:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span>{formatDose(calculation.mgPerInjection, 'mg')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volume:</span>
              <span>{formatDose(calculation.volumePerInjection, 'mL')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Syringe Units:</span>
              <span>{formatDose(calculation.unitsPerInjection, 'units')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Injections/Week:</span>
              <span>{calculation.injectionsPerWeek.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="button-primary w-full"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}