'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format } from 'date-fns'
import { InjectionRecord, ProtocolSettings } from '@/lib/types'

interface InjectionChartProps {
  records: InjectionRecord[]
  protocols: ProtocolSettings[]
}

export default function InjectionChart({ records, protocols }: InjectionChartProps) {
  // Function to find which protocol was active on a given date
  const getProtocolForDate = (date: Date): ProtocolSettings | undefined => {
    return protocols
      .slice()
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .find(p => new Date(date) >= new Date(p.startDate))
  }

  // Transform injection records into chart data
  const chartData = records
    .filter(record => !record.missed) // Only show completed injections
    .sort((a, b) => a.date.getTime() - b.date.getTime()) // Sort by date
    .map(record => {
      const protocol = getProtocolForDate(record.date)
      return {
        date: format(record.date, 'MMM dd'),
        fullDate: format(record.date, 'PPP'),
        dose: record.dose,
        notes: record.notes || '',
        protocolName: protocol ? protocol.protocol : 'Unknown',
        color: protocol ? protocol.protocolColor : '#8884d8',
      }
    })
    .slice(-30) // Show last 30 injections

  if (chartData.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-zinc-400">No injection data to display yet.</p>
        <p className="text-sm text-zinc-500 mt-2">Start logging your injections to see your history chart.</p>
      </div>
    )
  }

  // Custom tooltip component
  interface TooltipPayload {
    value: number
    payload: {
      fullDate: string
      notes: string
      protocolName: string
    }
  }
  
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-zinc-900/95 backdrop-blur-lg border border-zinc-800 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-zinc-200">{payload[0].payload.fullDate}</p>
          <p className="text-xs text-amber-500 mt-1">
            Dose: {payload[0].value} mg
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Protocol: {payload[0].payload.protocolName}
          </p>
          {payload[0].payload.notes && (
            <p className="text-xs text-zinc-400 mt-1">
              Notes: {payload[0].payload.notes}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // Get unique protocols for the legend
  const uniqueProtocols = chartData.reduce((acc, item) => {
    if (!acc.find(p => p.name === item.protocolName)) {
      acc.push({ name: item.protocolName, color: item.color });
    }
    return acc;
  }, [] as { name: string; color: string }[]);

  return (
    <div className="glass-card rounded-2xl p-8">
      <h2 className="text-2xl font-light text-zinc-100 mb-6">
        Injection History
        <span className="text-sm text-zinc-500 ml-3">
          (Last {chartData.length} doses)
        </span>
      </h2>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#27272a" 
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#71717a"
              tick={{ fill: '#a1a1aa', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="#71717a"
              tick={{ fill: '#a1a1aa', fontSize: 12 }}
              label={{ 
                value: 'Dose (mg)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: '#a1a1aa', fontSize: 14 }
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(251, 191, 36, 0.1)' }}
            />
            <Bar
              dataKey="dose"
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
              animationBegin={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 flex-wrap">
          {uniqueProtocols.map(p => (
            <div key={p.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: p.color }} />
              <span className="text-zinc-400">{p.name}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          {records.filter(r => !r.missed).length} total injections logged
        </p>
      </div>
    </div>
  )
}