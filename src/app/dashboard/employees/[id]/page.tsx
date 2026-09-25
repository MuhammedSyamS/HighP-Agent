'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../../../../components/Header';
import { StatCard } from '../../../../components/StatCard';
import { StatusBadge } from '../../../../components/StatusBadge';
import { TimelineVisualizer } from '../../../../components/TimelineVisualizer';
import { api } from '../../../../lib/api';
import { formatDuration, formatPercent } from '../../../../lib/utils';
import {
  ArrowLeft,
  Moon,
  Coffee,
  Clock,
  Laptop,
  Calendar,
  Zap,
  Activity,
  UserCheck
} from 'lucide-react';
import { ActivityState } from '@highp/shared';

export default function EmployeeDetailPage() {
  const params = useParams();
  const employeeId = params?.id as string;

  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 10));
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [appUsages, setAppUsages] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployeeData = useCallback(async () => {
    if (!employeeId) return;
    try {
      const [empRes, timelineRes, appRes, attRes] = await Promise.all([
        api.get(`/employees/${employeeId}`),
        api.get(`/activity/${employeeId}/timeline?date=${dateStr}`),
        api.get(`/applications/usage/${employeeId}?date=${dateStr}`),
        api.get(`/attendance/${employeeId}`)
      ]);

      if (empRes.data?.data) setEmployeeData(empRes.data.data);
      if (timelineRes.data?.data?.events) setTimelineEvents(timelineRes.data.data.events);
      if (appRes.data?.data?.applications) setAppUsages(appRes.data.data.applications);
      if (attRes.data?.data) setAttendanceHistory(attRes.data.data);
    } catch (err) {
      console.error('[EmployeeDetail] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [employeeId, dateStr]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  if (loading) {
    return (
      <div className="flex-1 min-h-[600px] flex items-center justify-center bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Telemetry Workspace...</p>
        </div>
      </div>
    );
  }

  const profile = employeeData?.profile;
  const user = profile?.userId;
  const name = user ? `${user.firstName} ${user.lastName}` : 'Employee';
  const devices = employeeData?.devices || [];

  const totalAppTime = appUsages.reduce((acc, curr) => acc + (curr.totalSeconds || 0), 0);
  const activeSeconds = profile?.todayActiveSeconds || 0;
  const idleSeconds = profile?.todayIdleSeconds || 0;
  const totalTrackedToday = activeSeconds + idleSeconds;
  const activeFocusPct = totalTrackedToday > 0 ? Math.round((activeSeconds / totalTrackedToday) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0B0F19] text-slate-100">
      <Header
        title={name}
        description={`${profile?.employeeCode || 'EMP'} • ${profile?.department || 'Operations'} • ${profile?.designation || 'Team Member'}`}
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
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-xs transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" /> Team Cockpit
            </Link>
          </div>
        }
      />

      <main className="p-6 md:p-8 space-y-6 md:space-y-8 flex-1 overflow-y-auto">
        {/* Profile Banner */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white font-black flex items-center justify-center text-2xl shadow-xl shadow-indigo-600/30 ring-2 ring-indigo-500/40">
              {name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-white tracking-tight">{name}</h2>
                <StatusBadge status={profile?.currentStatus || ActivityState.OFFLINE} size="md" />
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {user?.email} • Code: <span className="font-mono font-bold text-slate-200">{profile?.employeeCode}</span> • Role:{' '}
                <span className="font-semibold text-indigo-400 uppercase">
                  {user?.role === 'OWNER' || user?.role === 'ADMIN' ? 'HR' : user?.role}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-300 bg-slate-950/60 px-6 py-3.5 rounded-2xl border border-slate-800 relative z-10">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Current Focus</span>
              <span className="font-bold text-white mt-0.5 block truncate max-w-[150px]">
                {profile?.currentStatus === ActivityState.OFFLINE ? 'None (Offline)' : profile?.currentApplication || 'Desktop'}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Registered Workstation</span>
              <span className="font-bold text-white mt-0.5 block truncate max-w-[150px]">
                {devices[0]?.deviceName || 'Windows Workstation'}
              </span>
            </div>
          </div>
        </div>

        {/* Metric Cards for Today */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Active Work Time"
            value={formatDuration(profile?.todayActiveSeconds || 0)}
            subtitle={`${activeFocusPct}% active session ratio`}
            icon={Zap}
            color="emerald"
          />
          <StatCard
            title="Idle Duration"
            value={formatDuration(profile?.todayIdleSeconds || 0)}
            subtitle="Zero keyboard/mouse input"
            icon={Moon}
            color="amber"
          />
          <StatCard
            title="Break Duration"
            value={formatDuration(profile?.todayBreakSeconds || 0)}
            subtitle="Lunch / Pause intervals"
            icon={Coffee}
            color="cyan"
          />
          <StatCard
            title="Total Session Time"
            value={formatDuration(
              (profile?.todayActiveSeconds || 0) +
                (profile?.todayIdleSeconds || 0) +
                (profile?.todayBreakSeconds || 0)
            )}
            subtitle="Clock-in to current time"
            icon={Clock}
            color="indigo"
          />
        </div>

        {/* 2-Column Grid: Timeline & Application Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left 2 Cols: Timeline */}
          <div className="lg:col-span-2">
            <TimelineVisualizer events={timelineEvents} dateStr={dateStr} />
          </div>

          {/* Right 1 Col: Application Usage Breakdown */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Application Telemetry</h3>
                <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                  {dateStr}
                </span>
              </div>

              {appUsages.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">No application activity recorded on this date.</p>
              ) : (
                <div className="space-y-4">
                  {appUsages.map((app, idx) => {
                    const pct = formatPercent(app.totalSeconds, totalAppTime);
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white truncate max-w-[160px]">{app.applicationName}</span>
                          <span className="text-slate-400 font-semibold font-mono">
                            {formatDuration(app.totalSeconds)} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Attendance History */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-4 pb-3 border-b border-slate-800">
                Recent Work Sessions
              </h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {attendanceHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No attendance sessions recorded.</p>
                ) : (
                  attendanceHistory.map((att, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs hover:bg-slate-800/50 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex justify-between font-bold">
                        <span className="text-white">{new Date(att.startedAt).toLocaleDateString()}</span>
                        <span className="text-emerald-400">{formatDuration(att.activeSeconds)} active</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium font-mono">
                        <span>
                          {new Date(att.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →{' '}
                          {att.endedAt
                            ? new Date(att.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'In Progress'}
                        </span>
                        <span className="text-amber-400/90">{formatDuration(att.idleSeconds)} idle</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
