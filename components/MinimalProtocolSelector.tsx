'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Protocol } from '@/lib/types';
import { ChevronDown } from 'lucide-react';

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
        className="group px-5 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl
                   hover:border-amber-500/30 hover:bg-zinc-900 transition-all duration-300
                   flex items-center gap-3"
      >
        <div className="text-left">
          <div className="text-sm font-medium text-zinc-200">{currentProtocolInfo?.label}</div>
          <div className="text-xs text-zinc-500">{currentProtocolInfo?.description}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 
                        rounded-xl shadow-2xl overflow-hidden animate-slideDown z-50">
          {/* Glass morphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
          
          {/* Grain texture overlay */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
               style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
               }}
          />
          
          <div className="relative">
            {protocols.map((protocol, index) => (
              <button
                key={protocol.value}
                onClick={() => {
                  onProtocolChange(protocol.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-5 py-4 text-left transition-all duration-300 relative group
                  ${currentProtocol === protocol.value 
                    ? 'bg-amber-500/10 border-l-2 border-amber-500' 
                    : 'hover:bg-zinc-900/50 border-l-2 border-transparent'
                  }
                  ${index !== protocols.length - 1 ? 'border-b border-zinc-900' : ''}
                `}
              >
                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 
                                opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-zinc-200">{protocol.label}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{protocol.description}</div>
                  </div>
                  {currentProtocol === protocol.value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-amber-500/50 shadow-lg" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}