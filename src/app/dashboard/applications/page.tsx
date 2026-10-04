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
    <div className="flex-1 flex flex-col min-h-0 bg-[#0B0F19] text-slate-100">
      <Header
        title="Application & Website Analytics"
        description="Company-wide software usage distribution, active website durations, and category breakdowns."
        actions={
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 shadow-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        }
      />

      <main className="p-6 md:p-8 space-y-6 md:space-y-8 flex-1 overflow-y-auto">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'applications'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Applications</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'applications' ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-800 text-slate-400'
            }`}>
              {appsData.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('websites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'websites'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Websites</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'websites' ? 'bg-cyan-800 text-cyan-200' : 'bg-slate-800 text-slate-400'
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
                <div className="col-span-full bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs">
                  No category aggregates available for this date.
                </div>
              ) : (
                Object.entries(categorySummary).map(([catName, data], i) => {
                  const pct = totalTime > 0 ? Math.round((data.seconds / totalTime) * 100) : 0;
                  return (
                    <div
                      key={i}
                      className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group transition-all"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{catName}</span>
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-white mt-2 tracking-tight">{formatDuration(data.seconds)}</h3>
                      <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-medium">
                        <span>{data.count} Applications</span>
                        <span className="text-indigo-400 font-bold">{pct}%</span>
                      </div>

                      <div className="mt-3 w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Applications Ranking Table */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Application Telemetry Ranking</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {appsData.length} Discovered
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Ranked by total company-wide aggregate active time on {dateStr}</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-300 self-start sm:self-auto">
                  Total Recorded Time: <strong className="text-white ml-1">{formatDuration(totalTime)}</strong>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5">Application</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5">Total Duration</th>
                      <th className="px-6 py-3.5">% of Active Time</th>
                      <th className="px-6 py-3.5">Team Members Using</th>
                      <th className="px-6 py-3.5">Last Detected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 font-medium text-slate-300">
                    {appsData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-14 text-center text-slate-500">
                          <Monitor className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                          No application telemetry usage recorded for {dateStr}.
                        </td>
                      </tr>
                    ) : (
                      appsData.map((app, idx) => {
                        const lastDetected = app.lastUsedAt
                          ? new Date(app.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—';

                        return (
                          <tr key={idx} className="hover:bg-slate-800/40 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs group-hover:border-indigo-500/40 transition-colors">
                                  <Monitor className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                                  {app.applicationName}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-slate-800/70 rounded-full text-[11px] font-semibold text-slate-300 border border-slate-700/60">
                                {app.category || 'Other'}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-white">
                              {formatDuration(app.totalSeconds)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3 max-w-[150px]">
                                <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                  <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                                    style={{ width: `${app.percentage}%` }}
                                  />
                                </div>
                                <span className="font-semibold text-indigo-400 text-[11px]">{app.percentage}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-slate-500" />
                                <span>{app.employeeCount || 1} members</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">{lastDetected}</td>
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
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Website Domain Telemetry Ranking</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {websitesData.length} Visited Domains
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Ranked by total company-wide aggregate active time on {dateStr}</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-300 self-start sm:self-auto">
                Total Website Time: <strong className="text-white ml-1">{formatDuration(totalWebTime)}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Website Domain</th>
                    <th className="px-6 py-3.5">Browser</th>
                    <th className="px-6 py-3.5">Total Duration</th>
                    <th className="px-6 py-3.5">% of Active Time</th>
                    <th className="px-6 py-3.5">Team Members</th>
                    <th className="px-6 py-3.5">Last Visited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-medium text-slate-300">
                  {websitesData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-14 text-center text-slate-500">
                        <Globe className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                        No website telemetry usage recorded for {dateStr}.
                        <p className="text-[11px] text-slate-600 mt-1">Make sure the HighP Chrome / Brave Extension is installed and active.</p>
                      </td>
                    </tr>
                  ) : (
                    websitesData.map((web, idx) => {
                      const lastDetected = web.lastUsedAt
                        ? new Date(web.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—';

                      return (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs group-hover:border-cyan-500/40 transition-colors">
                                <Globe className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-white group-hover:text-cyan-300 transition-colors font-mono">
                                {web.domain}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-slate-800/70 rounded-full text-[11px] font-semibold text-slate-300 border border-slate-700/60">
                              {web.browser || 'Web Browser'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-white">
                            {formatDuration(web.totalSeconds)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 max-w-[150px]">
                              <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                <div
                                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                  style={{ width: `${web.percentage}%` }}
                                />
                              </div>
                              <span className="font-semibold text-cyan-400 text-[11px]">{web.percentage}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-500" />
                              <span>{web.employeeCount || 1} members</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">{lastDetected}</td>
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
