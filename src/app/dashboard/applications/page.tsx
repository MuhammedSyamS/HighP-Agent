'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '../../../components/Header';
import { api } from '../../../lib/api';
import { formatDuration } from '../../../lib/utils';
import { PieChart, Monitor, Users, Calendar, Filter, Layers } from 'lucide-react';

export default function ApplicationsPage() {
  const [appsData, setAppsData] = useState<any[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);

  const fetchApplicationUsage = async () => {
    try {
      const res = await api.get(`/applications/usage?date=${dateStr}`);
      if (res.data?.data) {
        setAppsData(res.data.data.applications || []);
        setTotalTime(res.data.data.totalTimeOverall || 0);
      }
    } catch (err) {
      console.error('[Applications] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationUsage();
  }, [dateStr]);

  // Group by Category
  const categorySummary: Record<string, { seconds: number; count: number }> = {};
  appsData.forEach((app) => {
    const cat = app.category || 'Other';
    if (!categorySummary[cat]) {
      categorySummary[cat] = { seconds: 0, count: 0 };
    }
    categorySummary[cat].seconds += app.totalSeconds;
    categorySummary[cat].count += 1;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <Header
        title="Application Usage Analytics"
        description="Company-wide software usage distribution, active durations, and category breakdowns."
        actions={
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-xs focus:outline-none"
            />
          </div>
        }
      />

      <main className="p-8 space-y-8 flex-1 overflow-y-auto">
        {/* Category Distribution Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(categorySummary).map(([catName, data], i) => {
            const pct = totalTime > 0 ? Math.round((data.seconds / totalTime) * 100) : 0;
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{catName}</span>
                  <Layers className="w-4 h-4 text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{formatDuration(data.seconds)}</h3>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-medium">
                  <span>{data.count} Applications</span>
                  <span className="text-indigo-600 font-bold">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Applications Ranking Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Application Ranking</h3>
              <p className="text-xs text-slate-500 mt-0.5">Ranked by total aggregate active duration on {dateStr}</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-slate-100 rounded-full text-slate-600">
              Total Time: {formatDuration(totalTime)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Application</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Total Duration</th>
                  <th className="px-6 py-3.5">% of Active Time</th>
                  <th className="px-6 py-3.5">Team Members Using</th>
                  <th className="px-6 py-3.5">Last Detected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {appsData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No application usage recorded for {dateStr}.
                    </td>
                  </tr>
                ) : (
                  appsData.map((app, idx) => {
                    const lastDetected = app.lastUsedAt
                      ? new Date(app.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'N/A';

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs border border-indigo-100">
                              <Monitor className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-900">{app.applicationName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 rounded-full text-[11px] font-semibold text-slate-600 border border-slate-200">
                            {app.category || 'Other'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {formatDuration(app.totalSeconds)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 max-w-[140px]">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full"
                                style={{ width: `${app.percentage}%` }}
                              />
                            </div>
                            <span className="font-semibold text-slate-600 text-[11px]">{app.percentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{app.employeeCount || 1} members</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{lastDetected}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
