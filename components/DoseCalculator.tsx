'use client';

import React, { useState, useEffect } from 'react';
import { UserSettings, SyringeConfiguration } from '@/lib/types';
import { calculateDose, calculateWeeklyDose, formatDose } from '@/lib/calculations';

interface DoseCalculatorProps {
  settings: UserSettings;
  onSettingsUpdate: (settings: UserSettings) => void;
  onClose?: () => void;
}

export default function DoseCalculator({ settings, onSettingsUpdate, onClose }: DoseCalculatorProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [fillInput, setFillInput] = useState('');
  const [calculation, setCalculation] = useState(calculateDose(settings));

  useEffect(() => {
    // Initialize fill input from settings
    const fillValue = localSettings.syringeFillAmount;
    if (fillValue) {
      // Convert to readable format
      if (fillValue === 0.3) setFillInput('3/10');
      else if (fillValue === 0.5) setFillInput('5/10');
      else setFillInput(`${(fillValue * 100).toFixed(0)}%`);
    }
  }, [localSettings.syringeFillAmount]);

  useEffect(() => {
    const newCalculation = calculateDose(localSettings);
    setCalculation(newCalculation);
  }, [localSettings]);

  const commonSyringes: SyringeConfiguration[] = [
    { volume: 1, units: 100, deadSpace: 0.05 },
    { volume: 0.5, units: 50, deadSpace: 0.03 },
    { volume: 0.3, units: 30, deadSpace: 0.02 },
  ];

  const parseFillAmount = (input: string): number => {
    // Remove spaces
    const cleanInput = input.trim().toLowerCase();
    
    // Handle fraction format (e.g., "3/10")
    if (cleanInput.includes('/')) {
      const [numerator, denominator] = cleanInput.split('/').map(n => parseFloat(n));
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return numerator / denominator;
      }
    }
    
    // Handle percentage format (e.g., "30%")
    if (cleanInput.includes('%')) {
      const percentage = parseFloat(cleanInput.replace('%', ''));
      if (!isNaN(percentage)) {
        return percentage / 100;
      }
    }
    
    // Handle decimal format (e.g., "0.3")
    if (cleanInput.includes('.')) {
      const decimal = parseFloat(cleanInput);
      if (!isNaN(decimal) && decimal >= 0 && decimal <= 1) {
        return decimal;
      }
    }
    
    // Handle ml format (e.g., "0.3ml")
    if (cleanInput.includes('ml')) {
      const ml = parseFloat(cleanInput.replace('ml', ''));
      if (!isNaN(ml) && localSettings.syringe.volume > 0) {
        return ml / localSettings.syringe.volume;
      }
    }
    
    return 0;
  };

  const handleFillChange = (value: string) => {
    setFillInput(value);
    const fillAmount = parseFillAmount(value);
    if (fillAmount > 0 && fillAmount <= 1) {
      setLocalSettings({
        ...localSettings,
        syringeFillAmount: fillAmount
      });
    }
  };

  const handleSave = () => {
    onSettingsUpdate(localSettings);
    onClose?.();
  };

  const weeklyDose = calculateWeeklyDose(localSettings);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold gradient-text">Dose Calculator</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 glass rounded-lg gradient-border-hover transition-smooth"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/70">Concentration (mg/mL)</label>
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

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/70">Syringe Type</label>
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

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/70">Syringe Fill Amount</label>
          <input
            type="text"
            value={fillInput}
            onChange={(e) => handleFillChange(e.target.value)}
            placeholder="e.g., 3/10 or 30% or 0.3ml"
            className="input w-full"
          />
          <p className="text-xs text-white/40">
            Enter as fraction (3/10), percentage (30%), or volume (0.3ml)
          </p>
        </div>

        <div className="pt-6 border-t border-white/10">
          <h3 className="font-medium mb-4 text-white/90">Calculated Doses</h3>
          <div className="space-y-4">
            <div className="glass rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/60">Per Injection</span>
                <span className="text-lg font-semibold gradient-text">
                  {formatDose(calculation.mgPerInjection, 'mg')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/60">Volume</span>
                <span className="font-medium">{formatDose(calculation.volumePerInjection, 'mL')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/60">Syringe Units</span>
                <span className="font-medium">{formatDose(calculation.unitsPerInjection, 'units')}</span>
              </div>
            </div>
            
            <div className="glass-strong rounded-lg p-4 space-y-3 gradient-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/60">Weekly Total</span>
                <span className="text-lg font-semibold gradient-text">
                  {formatDose(weeklyDose, 'mg')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/60">Injections/Week</span>
                <span className="font-medium">{calculation.injectionsPerWeek.toFixed(1)}</span>
              </div>
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