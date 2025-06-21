'use client';

import React from 'react';
import { Protocol } from '@/lib/types';

interface MinimalProtocolSelectorProps {
  currentProtocol: Protocol;
  onProtocolChange: (protocol: Protocol) => void;
}

export default function MinimalProtocolSelector({ currentProtocol, onProtocolChange }: MinimalProtocolSelectorProps) {
  const protocols: { value: Protocol; label: string }[] = [
    { value: 'EOD', label: 'Every Other Day' },
    { value: 'E2D', label: 'Every 2 Days' },
    { value: 'E3D', label: 'Every 3 Days' },
  ];

  return (
    <select
      value={currentProtocol}
      onChange={(e) => onProtocolChange(e.target.value as Protocol)}
      className="bg-transparent border border-zinc-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white"
    >
      {protocols.map((protocol) => (
        <option key={protocol.value} value={protocol.value} className="bg-black">
          {protocol.label}
        </option>
      ))}
    </select>
  );
}