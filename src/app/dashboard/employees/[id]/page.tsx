'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../../../../components/Header';
import { StatCard } from '../../../../components/StatCard';
import { StatusBadge } from '../../../../components/StatusBadge';
import { TimelineVisualizer } from '../../../../components/TimelineVisualizer';
import { api } from '../../../../lib/api';
import { getSocket } from '../../../../lib/socket';
import { formatDuration, formatPercent, getLocalDateString } from '../../../../lib/utils';
import {
  ArrowLeft,
  Moon,
  Coffee,
  Clock,
  Laptop,
  Calendar,
  Zap,
  Activity,
  UserCheck,
  Globe
} from 'lucide-react';
import { ActivityState } from '@highp/shared';

export default function EmployeeDetailPage() {
  const params = useParams();
  const employeeId = params?.id as string;

  const [dateStr, setDateStr] = useState(getLocalDateString());
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

    const socket = getSocket();
    if (socket && employeeId) {
      const handleTelemetryUpdated = (data: any) => {
        if (!data || data.employeeProfileId !== employeeId) return;
        setEmployeeData((prev: any) => {
          if (!prev?.profile) return prev;
          return {
            ...prev,
            profile: {
              ...prev.profile,
              currentStatus: (data.status || prev.profile.currentStatus || 'OFFLINE').toUpperCase(),
              currentApplication: data.application !== undefined ? (data.application || '') : prev.profile.currentApplication,
              lastActiveAt: data.lastSeenAt || prev.profile.lastActiveAt
            }
          };
        });
      };

      socket.on('employee:telemetry_updated', handleTelemetryUpdated);
      return () => {
        socket.off('employee:telemetry_updated', handleTelemetryUpdated);
      };
    }
  }, [fetchEmployeeData, employeeId]);

  if (loading) {
    return (
      <div className="flex-1 min-h-[600px] flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Loading Telemetry Workspace...</p>
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
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC] text-slate-900 selection:bg-black selection:text-white">
      <Header
        title={name}
        description={`${profile?.employeeCode || 'EMP'} • ${profile?.department || 'Operations'} • ${profile?.designation || 'Team Member'}`}
        actions={
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
              />
            </div>
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" /> Team Cockpit
            </Link>
          </div>
        }
      />

      <main className="p-6 md:p-8 space-y-6 md:space-y-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Profile Banner */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-black text-white font-black flex items-center justify-center text-2xl shadow-sm">
              {name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{name}</h2>
                <StatusBadge status={profile?.currentStatus || ActivityState.OFFLINE} size="md" />
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {user?.email} • Code: <span className="font-mono font-bold text-slate-900">{profile?.employeeCode}</span> • Role:{' '}
                <span className="font-semibold text-slate-900 uppercase">
                  {user?.role === 'OWNER' || user?.role === 'ADMIN' ? 'HR' : user?.role}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-700 bg-slate-50 px-6 py-3.5 rounded-2xl border border-slate-200 relative z-10">
            <div>
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Current Focus</span>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                  {profile?.currentStatus === ActivityState.OFFLINE ? 'None (Offline)' : profile?.currentApplication || 'Desktop'}
                </span>
                {profile?.currentWebsiteDomain && profile?.currentStatus !== ActivityState.OFFLINE && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                    <Globe className="w-3 h-3 text-cyan-700" />
                    {profile.currentWebsiteDomain}
                  </span>
                )}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Registered Workstation</span>
              <span className="font-bold text-slate-900 mt-0.5 block truncate max-w-[150px]">
                {devices[0]?.deviceName || 'Windows Workstation'}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Start Work (Clock In)</span>
              <span className="font-bold text-slate-900 mt-0.5 block font-mono text-xs">
                {profile?.todayShiftStartedAt
                  ? new Date(profile.todayShiftStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Not Started'}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">End Work (Clock Out)</span>
              <span className="font-bold text-slate-900 mt-0.5 block font-mono text-xs">
                {profile?.todayShiftEndedAt ? (
                  new Date(profile.todayShiftEndedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                ) : (profile?.todayAttendanceStatus === 'PRESENT' || profile?.currentStatus !== 'OFFLINE') && profile?.todayShiftStartedAt ? (
                  <span className="text-emerald-700 inline-flex items-center gap-1 font-sans font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Working Now
                  </span>
                ) : (
                  '—'
                )}
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
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Application Telemetry</h3>
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  {dateStr}
                </span>
              </div>

              {appUsages.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No application activity recorded on this date.</p>
              ) : (
                <div className="space-y-4">
                  {appUsages.map((app, idx) => {
                    const pct = formatPercent(app.totalSeconds, totalAppTime);
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 truncate max-w-[160px]">{app.applicationName}</span>
                          <span className="text-slate-600 font-semibold font-mono">
                            {formatDuration(app.totalSeconds)} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className="h-full bg-black rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Website Telemetry */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-700" />
                  <h3 className="text-sm font-bold text-slate-900">Website Activity</h3>
                </div>
                <span className="text-[11px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                  {dateStr}
                </span>
              </div>

              {(!employeeData?.topWebsites || employeeData.topWebsites.length === 0) ? (
                <p className="text-xs text-slate-400 py-6 text-center">No website activity recorded on this date.</p>
              ) : (
                <div className="space-y-3">
                  {employeeData.topWebsites.map((web: any, idx: number) => {
                    const totalWebSec = employeeData.topWebsites.reduce((a: number, c: any) => a + (c.totalSeconds || 0), 0);
                    const pct = totalWebSec > 0 ? Math.round((web.totalSeconds / totalWebSec) * 100) : 0;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-cyan-800 font-semibold truncate max-w-[160px] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0" />
                            {web.domain}
                          </span>
                          <span className="text-slate-600 font-semibold font-mono">
                            {formatDuration(web.totalSeconds)} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className="h-full bg-cyan-700 rounded-full transition-all duration-500"
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
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Recent Work Sessions
              </h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {attendanceHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No attendance sessions recorded.</p>
                ) : (
                  attendanceHistory.map((att, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-900">{new Date(att.startedAt).toLocaleDateString()}</span>
                        <span className="text-emerald-700">{formatDuration(att.activeSeconds)} active</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-medium font-mono">
                        <span>
                          {new Date(att.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →{' '}
                          {att.endedAt
                            ? new Date(att.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'In Progress'}
                        </span>
                        <span className="text-amber-700">{formatDuration(att.idleSeconds)} idle</span>
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
