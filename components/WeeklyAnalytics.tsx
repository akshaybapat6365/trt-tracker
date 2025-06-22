'use client';

import React, { useMemo } from 'react';
import { InjectionRecord } from '@/lib/types';
import { TrendingUp, Activity, AlertTriangle, Calendar } from 'lucide-react';

interface WeeklyAnalyticsProps {
  records: InjectionRecord[];
}

export default function WeeklyAnalytics({ records }: WeeklyAnalyticsProps) {
  const analytics = useMemo(() => {
    const now = new Date();
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const recentRecords = records.filter(r => r.date >= fourWeeksAgo && r.date <= now);

    const weeklyData: { [key: string]: { total: number; count: number; missed: number } } = {};
    
    recentRecords.forEach(record => {
      const weekStart = new Date(record.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { total: 0, count: 0, missed: 0 };
      }
      
      if (record.missed) {
        weeklyData[weekKey].missed++;
      } else {
        weeklyData[weekKey].total += record.dose;
        weeklyData[weekKey].count++;
      }
    });

    const weeks = Object.entries(weeklyData).map(([week, data]) => ({
      week: new Date(week),
      totalMg: data.total,
      injectionCount: data.count,
      missedCount: data.missed,
      averagePerInjection: data.count > 0 ? data.total / data.count : 0,
    })).sort((a, b) => a.week.getTime() - b.week.getTime());

    const totalInjections = recentRecords.filter(r => !r.missed).length;
    const totalMissed = recentRecords.filter(r => r.missed).length;
    const totalScheduled = recentRecords.length;
    const complianceRate = totalScheduled > 0 ? (totalInjections / totalScheduled) * 100 : 100;
    const totalMg = recentRecords.reduce((sum, r) => sum + (r.missed ? 0 : r.dose), 0);
    const averageMgPerInjection = totalInjections > 0 ? totalMg / totalInjections : 0;

    return {
      weeks,
      overall: {
        totalInjections,
        totalMissed,
        totalScheduled,
        complianceRate,
        totalMg,
        averageMgPerInjection,
      },
    };
  }, [records]);

  const maxWeeklyMg = Math.max(...analytics.weeks.map(w => w.totalMg), 1);

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-8 overflow-hidden relative">
      {/* Grain texture overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
           }}
      />
      
      <div className="relative">
        <h2 className="text-2xl font-light text-zinc-100 mb-8">Weekly Analytics</h2>
        
        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl p-4
                          hover:border-amber-500/30 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/5 to-amber-500/0 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <p className="text-xs uppercase tracking-wider text-zinc-500">Compliance</p>
              </div>
              <p className="text-2xl font-light text-zinc-100">
                {analytics.overall.complianceRate.toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl p-4
                          hover:border-amber-500/30 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/5 to-amber-500/0 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <p className="text-xs uppercase tracking-wider text-zinc-500">Completed</p>
              </div>
              <p className="text-2xl font-light text-zinc-100">{analytics.overall.totalInjections}</p>
            </div>
          </div>
          
          <div className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl p-4
                          hover:border-amber-500/30 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/5 to-amber-500/0 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-xs uppercase tracking-wider text-zinc-500">Missed</p>
              </div>
              <p className="text-2xl font-light text-red-500">{analytics.overall.totalMissed}</p>
            </div>
          </div>
          
          <div className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl p-4
                          hover:border-amber-500/30 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/5 to-amber-500/0 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <p className="text-xs uppercase tracking-wider text-zinc-500">Avg Dose</p>
              </div>
              <p className="text-2xl font-light text-zinc-100">
                {analytics.overall.averageMgPerInjection.toFixed(1)}
                <span className="text-sm text-zinc-500 ml-1">mg</span>
              </p>
            </div>
          </div>
        </div>

        {/* Weekly Bar Chart */}
        <div className="space-y-6">
          <h3 className="text-lg font-light text-zinc-100">Weekly Progress</h3>
          {analytics.weeks.length === 0 ? (
            <div className="text-center py-12 text-zinc-600">
              <p className="text-sm">No injection data available for the last 4 weeks</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.weeks.map((week, index) => {
                const barWidth = (week.totalMg / maxWeeklyMg) * 100;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-zinc-400">
                        Week of {week.week.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="text-sm text-zinc-500">
                        <span className="text-zinc-300">{week.totalMg.toFixed(1)} mg</span>
                        <span className="mx-2">•</span>
                        <span>{week.injectionCount} doses</span>
                        {week.missedCount > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="text-red-500">{week.missedCount} missed</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="relative h-10 bg-zinc-900/50 rounded-lg overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500/80 to-amber-600/80 
                                   rounded-lg transition-all duration-700 ease-out shimmer"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-8 pt-6 border-t border-zinc-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Total administered (4 weeks)
            </p>
            <p className="text-lg font-light text-amber-500">
              {analytics.overall.totalMg.toFixed(1)} mg
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}