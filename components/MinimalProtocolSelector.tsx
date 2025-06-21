'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Protocol } from '@/lib/types';

interface MinimalProtocolSelectorProps {
  currentProtocol: Protocol;
  onProtocolChange: (protocol: Protocol) => void;
}

export default function MinimalProtocolSelector({ currentProtocol, onProtocolChange }: MinimalProtocolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const protocols: { value: Protocol; label: string; description: string }[] = [
    { value: 'Daily', label: 'Daily', description: 'Every day' },
    { value: 'E2D', label: 'E2D', description: 'Every 2 days' },
    { value: 'E3D', label: 'E3D', description: 'Every 3 days' },
    { value: 'Weekly', label: 'Weekly', description: 'Once per week' },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentProtocolInfo = protocols.find(p => p.value === currentProtocol);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass gradient-border-hover px-4 py-2 rounded-lg flex items-center gap-2 transition-smooth"
      >
        <span className="text-sm font-medium">{currentProtocolInfo?.label}</span>
        <span className="text-xs text-white/50">{currentProtocolInfo?.description}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 glass-strong rounded-lg overflow-hidden animate-fade-in z-50">
          {protocols.map((protocol) => (
            <button
              key={protocol.value}
              onClick={() => {
                onProtocolChange(protocol.value);
                setIsOpen(false);
              }}
              className={`
                w-full px-4 py-3 text-left transition-smooth
                ${currentProtocol === protocol.value 
                  ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20' 
                  : 'hover:bg-white/[0.05]'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{protocol.label}</div>
                  <div className="text-xs text-white/50">{protocol.description}</div>
                </div>
                {currentProtocol === protocol.value && (
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}