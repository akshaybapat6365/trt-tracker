'use client';

import React, { useState, useEffect } from 'react';
import { ProtocolSettings, SyringeConfiguration } from '@/lib/types';
import { calculateDose, calculateWeeklyDose, formatDose } from '@/lib/calculations';
import { X } from 'lucide-react';

interface DoseCalculatorProps {
  settings: ProtocolSettings;
  onSettingsUpdate: (settings: ProtocolSettings) => void;
  onClose?: () => void;
}

export default function DoseCalculator({ settings, onSettingsUpdate, onClose }: DoseCalculatorProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [fillInput, setFillInput] = useState('');
  const [calculation, setCalculation] = useState(calculateDose(settings));

  useEffect(() => {
    const fillValue = localSettings.syringeFillAmount;
    if (fillValue) {
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
    const cleanInput = input.trim().toLowerCase();
    
    if (cleanInput.includes('/')) {
      const [numerator, denominator] = cleanInput.split('/').map(n => parseFloat(n));
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return numerator / denominator;
      }
    }
    
    if (cleanInput.includes('%')) {
      const percentage = parseFloat(cleanInput.replace('%', ''));
      if (!isNaN(percentage)) {
        return percentage / 100;
      }
    }
    
    if (cleanInput.includes('.')) {
      const decimal = parseFloat(cleanInput);
      if (!isNaN(decimal) && decimal >= 0 && decimal <= 1) {
        return decimal;
      }
    }
    
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
    <div className="bg-zinc-950/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden animate-springIn">
      {/* Glass morphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      
      {/* Grain texture overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
           }}
      />
      
      {/* Header */}
      <div className="relative p-6 border-b border-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-light text-zinc-100 tracking-wide">Dose Calculator</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 
                       text-zinc-500 hover:text-zinc-300 transition-all duration-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="relative p-6 space-y-6">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-zinc-500">
              Concentration (mg/mL)
            </label>
            <select
              value={localSettings.concentration}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                concentration: parseFloat(e.target.value)
              })}
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl
                       text-zinc-200 focus:border-amber-500/30 focus:outline-none
                       transition-all duration-300"
            >
              <option value="100">100 mg/mL</option>
              <option value="200">200 mg/mL</option>
              <option value="250">250 mg/mL</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-zinc-500">
              Syringe Type
            </label>
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
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl
                       text-zinc-200 focus:border-amber-500/30 focus:outline-none
                       transition-all duration-300"
            >
              {commonSyringes.map((s) => (
                <option key={`${s.volume}-${s.units}`} value={`${s.volume}-${s.units}`}>
                  {s.volume}mL / {s.units} units
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-zinc-500">
              Syringe Fill Amount
            </label>
            <input
              type="text"
              value={fillInput}
              onChange={(e) => handleFillChange(e.target.value)}
              placeholder="e.g., 3/10 or 30% or 0.3ml"
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl
                       text-zinc-200 placeholder-zinc-600 focus:border-amber-500/30 
                       focus:outline-none transition-all duration-300"
            />
            <p className="text-xs text-zinc-600">
              Enter as fraction (3/10), percentage (30%), or volume (0.3ml)
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-zinc-500">
              Start Date
            </label>
            <input
              type="date"
              value={localSettings.startDate ? localSettings.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                startDate: e.target.value ? new Date(e.target.value) : new Date()
              })}
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl
                       text-zinc-200 focus:border-amber-500/30 focus:outline-none
                       transition-all duration-300"
            />
            <p className="text-xs text-zinc-600">
              The start date for this specific protocol.
            </p>
          </div>

          <div className="pt-6 border-t border-zinc-900">
            <h3 className="text-sm uppercase tracking-wider text-zinc-500 mb-4">
              Calculated Doses
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500">Per Injection</span>
                  <span className="text-lg font-light text-amber-500">
                    {formatDose(calculation.mgPerInjection, 'mg')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500">Volume</span>
                  <span className="font-light text-zinc-200">{formatDose(calculation.volumePerInjection, 'mL')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500">Syringe Units</span>
                  <span className="font-light text-zinc-200">{formatDose(calculation.unitsPerInjection, 'units')}</span>
                </div>
              </div>
              
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500">Weekly Total</span>
                  <span className="text-lg font-light text-amber-500">
                    {formatDose(weeklyDose, 'mg')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500">Injections/Week</span>
                  <span className="font-light text-zinc-200">{calculation.injectionsPerWeek.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full group relative px-6 py-4 bg-amber-500/10 border border-amber-500/30 rounded-xl
                     hover:bg-amber-500/20 hover:border-amber-500/50 transition-all duration-500
                     overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/20 to-amber-500/0 
                            translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            
            <span className="relative text-amber-500 font-medium">Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}