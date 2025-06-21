'use client';

import React from 'react';
import { Protocol } from '@/lib/types';
import { getProtocolInfo } from '@/lib/calculations';

interface ProtocolSwitcherProps {
  currentProtocol: Protocol;
  onProtocolChange: (protocol: Protocol) => void;
}

export default function ProtocolSwitcher({ 
  currentProtocol, 
  onProtocolChange 
}: ProtocolSwitcherProps) {
  const protocols: Protocol[] = ['Daily', 'E2D', 'E3D', 'Weekly'];

  return (
    <div className="card-strong rounded-2xl">
      <h2 className="text-2xl font-bold gradient-text mb-6">Injection Protocol</h2>
      
      <div className="space-y-3">
        {protocols.map((protocol) => {
          const info = getProtocolInfo(protocol);
          const isActive = currentProtocol === protocol;
          
          return (
            <button
              key={protocol}
              onClick={() => onProtocolChange(protocol)}
              className={`
                w-full p-4 rounded-xl text-left transition-smooth
                ${isActive 
                  ? 'glass-strong gradient-border' 
                  : 'glass gradient-border-hover'
                }
              `}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{protocol}</h3>
                  <p className="text-sm text-white/70 mt-1">
                    {info.frequency}
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    {info.description}
                  </p>
                </div>
                {isActive && (
                  <div className="text-sm">
                    <span className="gradient-text font-medium">Active</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-white/10">
        <h3 className="text-sm font-medium mb-3 text-white/80">Protocol Comparison</h3>
        <div className="space-y-2 text-xs text-white/60">
          <p><strong className="text-white/80">Daily:</strong> Most stable hormone levels, requires daily commitment</p>
          <p><strong className="text-white/80">E2D:</strong> Good balance of stability and convenience</p>
          <p><strong className="text-white/80">E3D:</strong> Less frequent, slight hormone fluctuation</p>
          <p><strong className="text-white/80">Weekly:</strong> Traditional approach, most convenient but less stable</p>
        </div>
      </div>
    </div>
  );
}