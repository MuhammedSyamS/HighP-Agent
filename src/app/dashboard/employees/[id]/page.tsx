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
  Activity,
  Moon,
  Coffee,
  Clock,
  Laptop,
  Calendar,
  PieChart,
  User,
  Monitor,
  Zap,
  ShieldCheck,
  CheckCircle2
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
      <div className="p-16 text-center text-slate-400">
        <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Loading Employee Workspace...</p>
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
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <Header
        title={name}
        description={`${profile?.employeeCode} • ${profile?.department} • ${profile?.designation}`}
        actions={
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs focus:outline-none"
            />
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Team Overview
            </Link>
          </div>
        }
      />

      <main className="p-8 space-y-8 flex-1 overflow-y-auto">
        {/* Profile Banner */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 text-white font-black flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/20">
              {name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{name}</h2>
                <StatusBadge status={profile?.currentStatus || ActivityState.OFFLINE} size="md" />
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {user?.email} • Code: <span className="font-mono font-bold text-slate-700">{profile?.employeeCode}</span> • Role: <span className="capitalize font-semibold text-slate-700">{user?.role?.toLowerCase()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-600 bg-slate-50 px-6 py-3.5 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Current Focus</span>
              <span className="font-bold text-slate-900 mt-0.5 block truncate max-w-[150px]">
                {profile?.currentStatus === ActivityState.OFFLINE ? 'None (Offline)' : profile?.currentApplication || 'Desktop'}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Registered Workstation</span>
              <span className="font-bold text-slate-900 mt-0.5 block truncate max-w-[150px]">
                {devices[0]?.deviceName || 'Windows PC'}
              </span>
            </div>
          </div>
        </div>

        {/* Metric Cards for Today */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Active Work Time"
            value={formatDuration(profile?.todayActiveSeconds || 0)}
            subtitle={`${activeFocusPct}% of session active`}
            icon={Zap}
            color="emerald"
          />
          <StatCard
            title="Idle Duration"
            value={formatDuration(profile?.todayIdleSeconds || 0)}
            subtitle="Zero input intervals"
            icon={Moon}
            color="amber"
          />
          <StatCard
            title="Break Duration"
            value={formatDuration(profile?.todayBreakSeconds || 0)}
            subtitle="Lunch / Coffee pauses"
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
            subtitle="Clock-in to present"
            icon={Clock}
            color="indigo"
          />
        </div>

        {/* 2-Column Grid: Timeline & Application Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Timeline */}
          <div className="lg:col-span-2">
            <TimelineVisualizer events={timelineEvents} dateStr={dateStr} />
          </div>

          {/* Right 1 Col: Application Usage Breakdown */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Application Focus</h3>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {dateStr}
                </span>
              </div>

              {appUsages.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No application activity recorded on this date.</p>
              ) : (
                <div className="space-y-4">
                  {appUsages.map((app, idx) => {
                    const pct = formatPercent(app.totalSeconds, totalAppTime);
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{app.applicationName}</span>
                          <span className="text-slate-500 font-semibold">
                            {formatDuration(app.totalSeconds)} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all"
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
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Recent Work Sessions
              </h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {attendanceHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No attendance sessions recorded.</p>
                ) : (
                  attendanceHistory.map((att, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs hover:bg-slate-100/60 transition-colors">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{new Date(att.startedAt).toLocaleDateString()}</span>
                        <span className="text-emerald-600">{formatDuration(att.activeSeconds)} active</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                        <span>
                          {new Date(att.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →{' '}
                          {att.endedAt
                            ? new Date(att.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'In Progress'}
                        </span>
                        <span>{formatDuration(att.idleSeconds)} idle</span>
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
