'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { api } from '../../lib/api';
import { formatDuration } from '../../lib/utils';
import { StatusBadge } from '../../components/StatusBadge';
import { TimelineVisualizer } from '../../components/TimelineVisualizer';
import {
  Play,
  Square,
  Coffee,
  Activity,
  Moon,
  Clock,
  ShieldCheck,
  Monitor,
  Laptop,
  Zap,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { ActivityState, BreakReason } from '@highp/shared';

export default function EmployeeWorkspacePage() {
  const navigate = useNavigate();
  const { user, profile, company, refreshAuth, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>(profile);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [appUsages, setAppUsages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [breakReason, setBreakReason] = useState<string>(BreakReason.LUNCH);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (profile) {
      setCurrentProfile(profile);
    }
  }, [profile]);

  useEffect(() => {
    if (!isLoading && mounted && !user) {
      navigate('/login');
    }
  }, [user, isLoading, mounted, navigate]);

  const fetchMyData = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const res = await api.get('/auth/me');
      if (res.data?.data?.profile) {
        const prof = res.data.data.profile;
        setCurrentProfile(prof);

        const [tlRes, appRes] = await Promise.all([
          api.get(`/activity/${prof._id}/timeline?date=${todayStr}`),
          api.get(`/applications/usage/${prof._id}?date=${todayStr}`)
        ]);

        if (tlRes.data?.data?.events) setTimelineEvents(tlRes.data.data.events);
        if (appRes.data?.data?.applications) setAppUsages(appRes.data.data.applications);
      }
    } catch (err) {
      console.error('[EmployeeWorkspace] Fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchMyData();
    const interval = setInterval(fetchMyData, 20000);
    return () => clearInterval(interval);
  }, [fetchMyData]);

  const handleStartWork = async () => {
    setLoading(true);
    try {
      await api.post('/attendance/start', {});
      await fetchMyData();
      await refreshAuth();
    } catch (err) {
      console.error('[Employee] Start work error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndWork = async () => {
    setLoading(true);
    try {
      await api.post('/attendance/end', { endReason: 'Employee Web Portal End' });
      await fetchMyData();
      await refreshAuth();
    } catch (err) {
      console.error('[Employee] End work error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async () => {
    setLoading(true);
    try {
      await api.post('/breaks/start', { reason: breakReason });
      await fetchMyData();
      await refreshAuth();
    } catch (err) {
      console.error('[Employee] Start break error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setLoading(true);
    try {
      await api.post('/breaks/end', {});
      await fetchMyData();
      await refreshAuth();
    } catch (err) {
      console.error('[Employee] End break error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isWorking = currentProfile?.currentSessionId;
  const isOnBreak = currentProfile?.currentStatus === ActivityState.BREAK;
  const todayStr = new Date().toISOString().slice(0, 10);

  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">My Employee Workspace</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5" suppressHydrationWarning>
            {company?.name ? `${company.name} • ` : ''}Code: <span className="font-mono font-bold text-slate-700">{currentProfile?.employeeCode || 'EMP-001'}</span>{currentProfile?.department ? ` • ${currentProfile.department}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={currentProfile?.currentStatus || ActivityState.OFFLINE} size="md" />
        </div>
      </header>

      <main className="p-8 space-y-8 flex-1 overflow-y-auto max-w-6xl mx-auto w-full">
        {/* Work Session & Attendance Hero Card */}
        <div className="bg-gradient-to-r from-white via-white to-indigo-50/40 border border-slate-200/80 rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Today's Work Session
              </span>
              <h2 className="text-3xl font-black text-slate-900 mt-1">
                {isWorking ? (
                  <span className="text-emerald-600 flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span> Active Work Session
                  </span>
                ) : (
                  'Not Clocked In'
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 max-w-lg leading-relaxed">
                {isWorking
                  ? 'Your Windows desktop agent is recording active/idle telemetry and foreground application focus.'
                  : 'Click Start Work below or launch your installed HighP Windows Desktop Agent.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isWorking ? (
                <button
                  onClick={handleStartWork}
                  disabled={loading}
                  className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
                >
                  <Play className="w-5 h-5 fill-current" /> Start Work
                </button>
              ) : (
                <>
                  {!isOnBreak ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={breakReason}
                        onChange={(e) => setBreakReason(e.target.value)}
                        className="px-3 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none shadow-xs"
                      >
                        <option value={BreakReason.LUNCH}>🥪 Lunch Break</option>
                        <option value={BreakReason.COFFEE}>☕ Coffee Break</option>
                        <option value={BreakReason.PERSONAL}>🚶 Personal Break</option>
                        <option value={BreakReason.MEETING}>👥 Offline Meeting</option>
                      </select>
                      <button
                        onClick={handleStartBreak}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
                      >
                        <Coffee className="w-4 h-4" /> Take Break
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleEndBreak}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
                    >
                      <Play className="w-4 h-4 fill-current" /> Resume Work
                    </button>
                  )}

                  <button
                    onClick={handleEndWork}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
                  >
                    <Square className="w-4 h-4 fill-current" /> End Work
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100 text-center">
            <div className="bg-white/80 p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Active Work</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                {formatDuration(currentProfile?.todayActiveSeconds || 0)}
              </span>
            </div>
            <div className="bg-white/80 p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Idle Time</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">
                {formatDuration(currentProfile?.todayIdleSeconds || 0)}
              </span>
            </div>
            <div className="bg-white/80 p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Break Time</span>
              <span className="text-2xl font-black text-cyan-600 mt-1 block">
                {formatDuration(currentProfile?.todayBreakSeconds || 0)}
              </span>
            </div>
            <div className="bg-white/80 p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Current Focus</span>
              <span className="text-sm font-bold text-slate-800 mt-1.5 block truncate">
                {currentProfile?.currentStatus === ActivityState.OFFLINE ? 'None' : currentProfile?.currentApplication || 'Desktop'}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Today's Timeline & Application Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TimelineVisualizer events={timelineEvents} dateStr={todayStr} />
          </div>

          <div className="space-y-6">
            {/* Transparency Pledge */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white border border-indigo-500/30 rounded-3xl p-6 shadow-md">
              <div className="flex items-center gap-2.5 mb-3 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-sm">Transparency Guarantee</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                You have full visibility over what is tracked. HighP Agent never captures private messages, passwords, keystrokes, webcam, or screen recordings.
              </p>
              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active App Identity & Time
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Session & Break Durations
                </div>
              </div>
            </div>

            {/* My Top Apps Today */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-4 pb-2 border-b border-slate-100">
                My Software Usage Today
              </h3>
              {appUsages.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No app activity recorded yet today.</p>
              ) : (
                <div className="space-y-3">
                  {appUsages.map((app, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{app.applicationName}</span>
                      <span className="text-slate-500 font-mono">{formatDuration(app.totalSeconds)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
