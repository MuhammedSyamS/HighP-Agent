'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '../../../components/Header';
import { api } from '../../../lib/api';
import { formatDuration } from '../../../lib/utils';
import { FileBarChart, Download, Calendar, Users, Filter, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { IDailyReportRow, IWeeklyMonthlyReportRow } from '@highp/shared';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 10));
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = `/reports/daily?date=${dateStr}`;
      if (reportType === 'weekly') {
        const endDate = dateStr;
        const startDate = new Date(new Date(dateStr).getTime() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
        endpoint = `/reports/weekly?startDate=${startDate}&endDate=${endDate}`;
      } else if (reportType === 'monthly') {
        const parts = dateStr.split('-');
        endpoint = `/reports/monthly?year=${parts[0]}&month=${parts[1]}`;
      }

      const res = await api.get(endpoint);
      if (res.data?.data) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('[Reports] Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, dateStr]);

  const setDatePreset = (preset: 'today' | 'yesterday' | '7days' | 'month') => {
    const today = new Date();
    if (preset === 'today') {
      setDateStr(today.toISOString().slice(0, 10));
      setReportType('daily');
    } else if (preset === 'yesterday') {
      const y = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      setDateStr(y.toISOString().slice(0, 10));
      setReportType('daily');
    } else if (preset === '7days') {
      setDateStr(today.toISOString().slice(0, 10));
      setReportType('weekly');
    } else if (preset === 'month') {
      setDateStr(today.toISOString().slice(0, 10));
      setReportType('monthly');
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      let endpoint = `/reports/daily?date=${dateStr}&exportCsv=true`;
      if (reportType === 'weekly') {
        const endDate = dateStr;
        const startDate = new Date(new Date(dateStr).getTime() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
        endpoint = `/reports/weekly?startDate=${startDate}&endDate=${endDate}&exportCsv=true`;
      } else if (reportType === 'monthly') {
        const parts = dateStr.split('-');
        endpoint = `/reports/monthly?year=${parts[0]}&month=${parts[1]}&exportCsv=true`;
      }

      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-activity-report-${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('[Reports] CSV export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Aggregated totals
  let totalActive = 0;
  let totalIdle = 0;
  let totalBreak = 0;
  let totalSession = 0;

  reportData.forEach((row) => {
    totalActive += row.totalActiveSeconds || row.activeSeconds || 0;
    totalIdle += row.totalIdleSeconds || row.idleSeconds || 0;
    totalBreak += row.totalBreakSeconds || row.breakSeconds || 0;
    totalSession += row.totalSessionSeconds || 0;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <Header
        title="Activity & Attendance Reports"
        description="Audit-ready workforce telemetry reports with custom range filters and instant CSV export."
        actions={
          <button
            onClick={handleExportCsv}
            disabled={isExporting || reportData.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-105 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {isExporting ? 'Generating CSV...' : 'Export to CSV'}
          </button>
        }
      />

      <main className="p-8 space-y-8 flex-1 overflow-y-auto">
        {/* Controls and Quick Presets Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['daily', 'weekly', 'monthly'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                  reportType === type
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type} Report
              </button>
            ))}
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Presets:</span>
            <button
              onClick={() => setDatePreset('today')}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setDatePreset('yesterday')}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors"
            >
              Yesterday
            </button>
            <button
              onClick={() => setDatePreset('7days')}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors"
            >
              Past 7 Days
            </button>
            <button
              onClick={() => setDatePreset('month')}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors"
            >
              This Month
            </button>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            />
          </div>
        </div>

        {/* Report Aggregation Summary Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Team Active
            </span>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatDuration(totalActive)}</h3>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Team Idle
            </span>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{formatDuration(totalIdle)}</h3>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Break Time
            </span>
            <h3 className="text-2xl font-black text-cyan-600 mt-1">{formatDuration(totalBreak)}</h3>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Logged Time
            </span>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">{formatDuration(totalSession)}</h3>
          </div>
        </div>

        {/* Report Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 capitalize">{reportType} Activity Breakdown</h3>
            <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              {reportData.length} Employee Records
            </span>
          </div>

          <div className="overflow-x-auto">
            {reportType === 'daily' ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Work Start</th>
                    <th className="px-6 py-3.5">Work End</th>
                    <th className="px-6 py-3.5">Active Time</th>
                    <th className="px-6 py-3.5">Idle Time</th>
                    <th className="px-6 py-3.5">Break Time</th>
                    <th className="px-6 py-3.5">Total Session</th>
                    <th className="px-6 py-3.5">Top Applications</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {reportData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                        No activity records found for this period.
                      </td>
                    </tr>
                  ) : (
                    reportData.map((row: IDailyReportRow) => {
                      const start = row.sessionStartedAt
                        ? new Date(row.sessionStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—';
                      const end = row.sessionEndedAt
                        ? new Date(row.sessionEndedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : row.sessionStartedAt
                        ? 'In Progress'
                        : '—';

                      return (
                        <tr key={row.employeeId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{row.employeeName}</p>
                            <p className="text-[11px] font-mono text-slate-400">{row.employeeCode}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{row.department}</td>
                          <td className="px-6 py-4 text-slate-600">{start}</td>
                          <td className="px-6 py-4 text-slate-600">{end}</td>
                          <td className="px-6 py-4 font-bold text-emerald-600">
                            {formatDuration(row.activeSeconds)}
                          </td>
                          <td className="px-6 py-4 text-amber-600 font-semibold">
                            {formatDuration(row.idleSeconds)}
                          </td>
                          <td className="px-6 py-4 text-cyan-600 font-semibold">
                            {formatDuration(row.breakSeconds)}
                          </td>
                          <td className="px-6 py-4 font-bold text-indigo-600">
                            {formatDuration(row.totalSessionSeconds)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {(row.topApplications || []).map((app, ai) => (
                                <span
                                  key={ai}
                                  className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[10px] text-slate-700 font-bold"
                                >
                                  {app.applicationName}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Period</th>
                    <th className="px-6 py-3.5">Working Days</th>
                    <th className="px-6 py-3.5">Total Active Time</th>
                    <th className="px-6 py-3.5">Total Idle Time</th>
                    <th className="px-6 py-3.5">Total Break Time</th>
                    <th className="px-6 py-3.5">Total Session</th>
                    <th className="px-6 py-3.5">Avg Daily Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {reportData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                        No activity records found for this period.
                      </td>
                    </tr>
                  ) : (
                    reportData.map((row: IWeeklyMonthlyReportRow) => (
                      <tr key={row.employeeId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{row.employeeName}</p>
                          <p className="text-[11px] font-mono text-slate-400">{row.employeeCode}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{row.department}</td>
                        <td className="px-6 py-4 text-slate-600">{row.period}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{row.workingDaysCount} days</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">
                          {formatDuration(row.totalActiveSeconds)}
                        </td>
                        <td className="px-6 py-4 text-amber-600 font-semibold">
                          {formatDuration(row.totalIdleSeconds)}
                        </td>
                        <td className="px-6 py-4 text-cyan-600 font-semibold">
                          {formatDuration(row.totalBreakSeconds)}
                        </td>
                        <td className="px-6 py-4 font-bold text-indigo-600">
                          {formatDuration(row.totalSessionSeconds)}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {formatDuration(row.averageDailyActiveSeconds)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
