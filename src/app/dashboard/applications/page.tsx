'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '../../../components/Header';
import { api } from '../../../lib/api';
import { formatDuration, getLocalDateString } from '../../../lib/utils';
import { Monitor, Users, Calendar, Layers, Globe, ExternalLink, Chrome } from 'lucide-react';

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState<'applications' | 'websites'>('applications');
  const [appsData, setAppsData] = useState<any[]>([]);
  const [websitesData, setWebsitesData] = useState<any[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [totalWebTime, setTotalWebTime] = useState(0);
  const [dateStr, setDateStr] = useState(getLocalDateString());
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, webRes] = await Promise.all([
        api.get(`/applications/usage?date=${dateStr}`).catch(() => null),
        api.get(`/applications/websites?date=${dateStr}`).catch(() => null)
      ]);

      if (appsRes?.data?.data) {
        setAppsData(appsRes.data.data.applications || []);
        setTotalTime(appsRes.data.data.totalTimeOverall || 0);
      }
      if (webRes?.data?.data) {
        setWebsitesData(webRes.data.data.websites || []);
        setTotalWebTime(webRes.data.data.totalTimeOverall || 0);
      }
    } catch (err) {
      console.error('[Applications] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateStr]);

  // Group by Category (for applications)
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
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC] text-slate-900 selection:bg-black selection:text-white">
      <Header
        title="Application & Website Analytics"
        description="Company-wide software usage distribution, active website durations, and category breakdowns."
        actions={
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
              />
            </div>
          </div>
        }
      />

      <main className="p-6 md:p-8 space-y-6 md:space-y-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="bg-slate-200/60 p-1.5 rounded-2xl inline-flex items-center gap-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'applications'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Monitor className="w-4 h-4 text-indigo-600" />
            <span>Applications</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'applications' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/80 text-slate-600'
            }`}>
              {appsData.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('websites')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'websites'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Globe className="w-4 h-4 text-cyan-600" />
            <span>Websites</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'websites' ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-200/80 text-slate-600'
            }`}>
              {websitesData.length}
            </span>
          </button>
        </div>

        {activeTab === 'applications' ? (
          <>
            {/* Category Distribution Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(categorySummary).length === 0 ? (
                <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs shadow-xs">
                  No category aggregates available for this date.
                </div>
              ) : (
                Object.entries(categorySummary).map(([catName, data], i) => {
                  const pct = totalTime > 0 ? Math.round((data.seconds / totalTime) * 100) : 0;
                  return (
                    <div
                      key={i}
                      className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{catName}</span>
                        <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mt-2 tracking-tight">{formatDuration(data.seconds)}</h3>
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-medium">
                        <span>{data.count} Applications</span>
                        <span className="text-slate-900 font-bold">{pct}%</span>
                      </div>

                      <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Applications Ranking Table */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Application Telemetry Ranking</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                      {appsData.length} Discovered
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Ranked by total company-wide aggregate active time on {dateStr}</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-700 self-start sm:self-auto shadow-2xs">
                  Total Recorded Time: <strong className="text-emerald-700 ml-1 font-mono">{formatDuration(totalTime)}</strong>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
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
                        <td colSpan={6} className="px-6 py-14 text-center text-slate-400">
                          <Monitor className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                          No application telemetry usage recorded for {dateStr}.
                        </td>
                      </tr>
                    ) : (
                      appsData.map((app, idx) => {
                        const lastDetected = app.lastUsedAt
                          ? new Date(app.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—';

                        return (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs">
                                  <Monitor className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-slate-900">
                                  {app.applicationName}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-slate-100 rounded-full text-[11px] font-semibold text-slate-700 border border-slate-200">
                                {app.category || 'Other'}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                              {formatDuration(app.totalSeconds)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3 max-w-[150px]">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                  <div
                                    className="h-full bg-indigo-600 rounded-full"
                                    style={{ width: `${app.percentage}%` }}
                                  />
                                </div>
                                <span className="font-semibold text-slate-900 text-[11px]">{app.percentage}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span>{app.employeeCount || 1} members</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">{lastDetected}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Websites Tab View */
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Website Domain Telemetry Ranking</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                    {websitesData.length} Visited Domains
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Ranked by total company-wide aggregate active time on {dateStr}</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-700 self-start sm:self-auto shadow-2xs">
                Total Website Time: <strong className="text-cyan-800 ml-1 font-mono">{formatDuration(totalWebTime)}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="px-6 py-3.5">Website Domain</th>
                    <th className="px-6 py-3.5">Browser</th>
                    <th className="px-6 py-3.5">Total Duration</th>
                    <th className="px-6 py-3.5">% of Active Time</th>
                    <th className="px-6 py-3.5">Team Members</th>
                    <th className="px-6 py-3.5">Last Visited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {websitesData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-14 text-center text-slate-400">
                        <Globe className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                        No website telemetry usage recorded for {dateStr}.
                        <p className="text-[11px] text-slate-500 mt-1">Make sure the HighP Chrome / Brave Extension is installed and active.</p>
                      </td>
                    </tr>
                  ) : (
                    websitesData.map((web, idx) => {
                      const lastDetected = web.lastUsedAt
                        ? new Date(web.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—';

                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 font-bold flex items-center justify-center text-xs">
                                <Globe className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-slate-900 font-mono">
                                {web.domain}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-slate-100 rounded-full text-[11px] font-semibold text-slate-700 border border-slate-200">
                              {web.browser || 'Web Browser'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                            {formatDuration(web.totalSeconds)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 max-w-[150px]">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div
                                  className="h-full bg-cyan-700 rounded-full"
                                  style={{ width: `${web.percentage}%` }}
                                />
                              </div>
                              <span className="font-semibold text-slate-900 text-[11px]">{web.percentage}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>{web.employeeCount || 1} members</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">{lastDetected}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
