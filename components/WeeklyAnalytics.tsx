'use client';

import React, { useMemo } from 'react';
import { InjectionRecord } from '@/lib/types';
import { storage } from '@/lib/storage';

interface WeeklyAnalyticsProps {
  records: InjectionRecord[];
}

export default function WeeklyAnalytics({ records }: WeeklyAnalyticsProps) {
  const analytics = useMemo(() => {
    const now = new Date();
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    // Filter records for the last 4 weeks
    const recentRecords = records.filter(r => r.date >= fourWeeksAgo && r.date <= now);

    // Group by week
    const weeklyData: { [key: string]: { total: number; count: number; missed: number } } = {};
    
    recentRecords.forEach(record => {
      const weekStart = new Date(record.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
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

    // Calculate statistics
    const weeks = Object.entries(weeklyData).map(([week, data]) => ({
      week: new Date(week),
      totalMg: data.total,
      injectionCount: data.count,
      missedCount: data.missed,
      averagePerInjection: data.count > 0 ? data.total / data.count : 0,
    })).sort((a, b) => a.week.getTime() - b.week.getTime());

    // Overall stats
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
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Weekly Analytics</h2>
      
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-accent rounded-lg p-3">
          <p className="text-sm text-muted-foreground">Compliance Rate</p>
          <p className="text-2xl font-bold">
            {analytics.overall.complianceRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-accent rounded-lg p-3">
          <p className="text-sm text-muted-foreground">Total Injections</p>
          <p className="text-2xl font-bold">{analytics.overall.totalInjections}</p>
        </div>
        <div className="bg-accent rounded-lg p-3">
          <p className="text-sm text-muted-foreground">Missed Doses</p>
          <p className="text-2xl font-bold text-red-400">{analytics.overall.totalMissed}</p>
        </div>
        <div className="bg-accent rounded-lg p-3">
          <p className="text-sm text-muted-foreground">Avg per Injection</p>
          <p className="text-2xl font-bold">
            {analytics.overall.averageMgPerInjection.toFixed(1)} mg
          </p>
        </div>
      </div>

      {/* Weekly Bar Chart */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Weekly Totals (Last 4 Weeks)</h3>
        {analytics.weeks.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No injection data available for the last 4 weeks
          </p>
        ) : (
          <div className="space-y-3">
            {analytics.weeks.map((week, index) => {
              const barWidth = (week.totalMg / maxWeeklyMg) * 100;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>
                      Week of {week.week.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-muted-foreground">
                      {week.totalMg.toFixed(1)} mg ({week.injectionCount} injections)
                      {week.missedCount > 0 && (
                        <span className="text-red-400 ml-2">
                          {week.missedCount} missed
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="relative h-8 bg-accent rounded-md overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary rounded-md transition-all duration-500"
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
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Total administered in last 4 weeks: <span className="font-medium text-foreground">
            {analytics.overall.totalMg.toFixed(1)} mg
          </span>
        </p>
      </div>
    </div>
  );
}