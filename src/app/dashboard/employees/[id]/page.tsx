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
  Globe,
  Pencil,
  Trash2,
  PlusCircle,
  X,
  Save,
  AlertTriangle
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

  // Admin Attendance Editing & Deleting State
  const [editingSession, setEditingSession] = useState<{
    id: string;
    date: string;
    startedTime: string;
    endedTime: string;
    activeMinutes: number;
    idleMinutes: number;
    breakMinutes: number;
    status: string;
    adminNote: string;
  } | null>(null);
  const [deletingSession, setDeletingSession] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    date: getLocalDateString(),
    startTime: '09:00',
    endTime: '17:00',
    status: 'PRESENT',
    activeHours: '8',
    breakMinutes: '60',
    adminNote: 'Manual HR entry'
  });
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

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
      let apps = appRes.data?.data?.applications || [];
      if (apps.length === 0 && empRes.data?.data?.topApps?.length > 0) {
        apps = empRes.data.data.topApps;
      }
      setAppUsages(
        apps.filter(
          (a: any) =>
            a.applicationName &&
            a.applicationName.toLowerCase() !== 'unknown application' &&
            a.applicationName.toLowerCase() !== 'system idle' &&
            a.applicationName.toLowerCase() !== 'system' &&
            !a.applicationName.toLowerCase().includes('highp') &&
            !a.applicationName.toLowerCase().includes('electron')
        )
      );
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

  // Open Edit Session Modal
  const openEditSessionModal = (sess: any) => {
    const sDate = sess.startedAt ? new Date(sess.startedAt) : new Date();
    const sTime = `${String(sDate.getHours()).padStart(2, '0')}:${String(sDate.getMinutes()).padStart(2, '0')}`;
    let eTime = '';
    if (sess.endedAt) {
      const eDate = new Date(sess.endedAt);
      eTime = `${String(eDate.getHours()).padStart(2, '0')}:${String(eDate.getMinutes()).padStart(2, '0')}`;
    }
    const sessDate = sess.date || (sess.startedAt ? new Date(sess.startedAt).toISOString().slice(0, 10) : dateStr);

    setEditingSession({
      id: sess._id || sess.id,
      date: sessDate,
      startedTime: sTime,
      endedTime: eTime,
      activeMinutes: Math.round((sess.activeSeconds || 0) / 60),
      idleMinutes: Math.round((sess.idleSeconds || 0) / 60),
      breakMinutes: Math.round((sess.breakSeconds || 0) / 60),
      status: sess.status || 'COMPLETED',
      adminNote: sess.adminNote || ''
    });
  };

  // Save Session Edit
  const handleSaveEditSession = async () => {
    if (!editingSession) return;
    try {
      setActionSubmitting(true);
      const sAt = `${editingSession.date}T${editingSession.startedTime}:00`;
      let eAt: string | undefined = undefined;
      if (editingSession.endedTime && editingSession.status !== 'ACTIVE') {
        eAt = `${editingSession.date}T${editingSession.endedTime}:00`;
      }

      await api.put(`/attendance/session/${editingSession.id}`, {
        startedAt: sAt,
        endedAt: eAt,
        activeSeconds: editingSession.activeMinutes * 60,
        idleSeconds: editingSession.idleMinutes * 60,
        breakSeconds: editingSession.breakMinutes * 60,
        status: editingSession.status,
        adminNote: editingSession.adminNote || 'Modified by HR Admin'
      });

      showToast('success', 'Attendance session updated successfully.');
      setEditingSession(null);
      fetchEmployeeData();
    } catch (err: any) {
      console.error('Failed to update session:', err);
      showToast('error', err.response?.data?.message || 'Failed to update session.');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Delete Session
  const handleDeleteSession = async () => {
    if (!deletingSession) return;
    try {
      setActionSubmitting(true);
      await api.delete(`/attendance/session/${deletingSession.id}`);
      showToast('success', 'Attendance session deleted.');
      setDeletingSession(null);
      fetchEmployeeData();
    } catch (err: any) {
      console.error('Failed to delete session:', err);
      showToast('error', err.response?.data?.message || 'Failed to delete session.');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Create Manual Session
  const handleCreateManualSession = async () => {
    try {
      setActionSubmitting(true);
      const activeMins = Math.round(parseFloat(manualForm.activeHours || '8') * 60);
      const breakMins = parseInt(manualForm.breakMinutes || '60', 10);

      await api.post('/attendance/manual', {
        employeeId,
        date: manualForm.date,
        startTime: manualForm.startTime,
        endTime: manualForm.endTime,
        status: manualForm.status,
        activeMinutes: activeMins,
        breakMinutes: breakMins,
        adminNote: manualForm.adminNote || 'Manual attendance added by HR Admin'
      });

      showToast('success', 'Manual attendance session logged successfully.');
      setShowManualModal(false);
      fetchEmployeeData();
    } catch (err: any) {
      console.error('Failed to create manual attendance:', err);
      showToast('error', err.response?.data?.message || 'Failed to create manual session.');
    } finally {
      setActionSubmitting(false);
    }
  };

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

            {/* Attendance History with Admin Controls */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 flex-wrap">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recent Work Sessions</h3>
                  <p className="text-[11px] text-slate-500">Edit, log, or delete attendance records</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Record Manual Session</span>
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {attendanceHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No attendance sessions recorded.</p>
                ) : (
                  attendanceHistory.map((att, i) => (
                    <div
                      key={att._id || i}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:bg-slate-100/70 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 font-sans">
                            {new Date(att.startedAt).toLocaleDateString()}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            att.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {att.status || 'COMPLETED'}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditSessionModal(att)}
                            className="p-1.5 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit Attendance Session"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingSession({
                              id: att._id || att.id,
                              label: `session on ${new Date(att.startedAt).toLocaleDateString()} (${new Date(att.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                            })}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium font-mono pt-1 border-t border-slate-200/60">
                        <span>
                          {new Date(att.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →{' '}
                          {att.endedAt
                            ? new Date(att.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'In Progress'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-700 font-bold">{formatDuration(att.activeSeconds)} act</span>
                          <span className="text-amber-700 font-bold">{formatDuration(att.idleSeconds)} idl</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── EDIT SESSION MODAL ── */}
        {editingSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Edit Attendance Session</h3>
                    <p className="text-[11px] text-slate-500">Date: {editingSession.date}</p>
                  </div>
                </div>
                <button onClick={() => setEditingSession(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                    Status
                  </label>
                  <select
                    value={editingSession.status}
                    onChange={(e) => setEditingSession({ ...editingSession, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="COMPLETED">Completed Shift</option>
                    <option value="ACTIVE">Active (In Progress)</option>
                    <option value="TIMEOUT">Timeout / Inactive</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={editingSession.startedTime}
                      onChange={(e) => setEditingSession({ ...editingSession, startedTime: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={editingSession.endedTime}
                      disabled={editingSession.status === 'ACTIVE'}
                      onChange={(e) => setEditingSession({ ...editingSession, endedTime: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                      Active (Min)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editingSession.activeMinutes}
                      onChange={(e) => setEditingSession({ ...editingSession, activeMinutes: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                      Idle (Min)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editingSession.idleMinutes}
                      onChange={(e) => setEditingSession({ ...editingSession, idleMinutes: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                      Break (Min)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editingSession.breakMinutes}
                      onChange={(e) => setEditingSession({ ...editingSession, breakMinutes: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                    Audit Note
                  </label>
                  <textarea
                    rows={2}
                    value={editingSession.adminNote}
                    onChange={(e) => setEditingSession({ ...editingSession, adminNote: e.target.value })}
                    placeholder="Reason for adjustment"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditSession}
                  disabled={actionSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{actionSubmitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── DELETE SESSION MODAL ── */}
        {deletingSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Delete Attendance Session</h3>
                  <p className="text-xs text-slate-500">This action will remove {deletingSession.label}.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingSession(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSession}
                  disabled={actionSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-50"
                >
                  {actionSubmitting ? 'Deleting...' : 'Delete Session'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CREATE MANUAL SESSION MODAL ── */}
        {showManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Record Manual Session</h3>
                    <p className="text-[11px] text-slate-500">Add an attendance shift for this employee</p>
                  </div>
                </div>
                <button onClick={() => setShowManualModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={manualForm.date}
                      onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                      Status *
                    </label>
                    <select
                      value={manualForm.status}
                      onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                    >
                      <option value="PRESENT">Present (Full Day)</option>
                      <option value="HALF_DAY">Half Day</option>
                      <option value="PRESENT_ACTIVE">Active Now</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={manualForm.startTime}
                      onChange={(e) => setManualForm({ ...manualForm, startTime: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={manualForm.endTime}
                      onChange={(e) => setManualForm({ ...manualForm, endTime: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                      Active Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={manualForm.activeHours}
                      onChange={(e) => setManualForm({ ...manualForm, activeHours: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                      Break (Min)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={manualForm.breakMinutes}
                      onChange={(e) => setManualForm({ ...manualForm, breakMinutes: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                    Audit Note
                  </label>
                  <textarea
                    rows={2}
                    value={manualForm.adminNote}
                    onChange={(e) => setManualForm({ ...manualForm, adminNote: e.target.value })}
                    placeholder="e.g. Approved on-site client meeting"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateManualSession}
                  disabled={actionSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs disabled:opacity-50"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{actionSubmitting ? 'Recording...' : 'Record Session'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TOAST ALERT ── */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white transition-all animate-bounce ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}>
            {toast.message}
          </div>
        )}
      </main>
    </div>
  );
}
