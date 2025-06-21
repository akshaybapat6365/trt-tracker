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
  const protocols: Protocol[] = ['EOD', 'E2D', 'E3D'];

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Injection Protocol</h2>
      
      <div className="space-y-3">
        {protocols.map((protocol) => {
          const info = getProtocolInfo(protocol);
          const isActive = currentProtocol === protocol;
          
          return (
            <button
              key={protocol}
              onClick={() => onProtocolChange(protocol)}
              className={`
                w-full p-4 rounded-md border text-left transition-all
                ${isActive 
                  ? 'border-white bg-accent' 
                  : 'border-border hover:bg-accent/50'
                }
              `}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{protocol}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {info.frequency}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {info.description}
                  </p>
                </div>
                {isActive && (
                  <div className="text-sm">
                    <span className="text-green-400">Active</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <h3 className="text-sm font-medium mb-2">Protocol Comparison</h3>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p><strong>EOD/E2D:</strong> Most stable hormone levels, frequent injections</p>
          <p><strong>E3D:</strong> Less frequent, slight hormone fluctuation</p>
        </div>
      </div>
    </div>
  );
}