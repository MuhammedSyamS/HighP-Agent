'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  CheckCircle2,
  LogOut,
  ArrowLeft,
  Download,
  Check
} from 'lucide-react';
import { ActivityState, BreakReason } from '@highp/shared';
import { getDesktopAgentDownloadUrl } from '../../lib/constants';

export default function EmployeeWorkspacePage() {
  const navigate = useNavigate();
  const { user, profile, company, refreshAuth, logout, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>(profile);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [appUsages, setAppUsages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [breakReason, setBreakReason] = useState<string>(BreakReason.LUNCH);

  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [autoDownloaded, setAutoDownloaded] = useState(false);

  // Real-Time Live Tracking Engine State
  const [liveActiveSeconds, setLiveActiveSeconds] = useState(0);
  const [liveIdleSeconds, setLiveIdleSeconds] = useState(0);
  const [liveBreakSeconds, setLiveBreakSeconds] = useState(0);
  const [isIdle, setIsIdle] = useState(false);
  const [currentAppFocus, setCurrentAppFocus] = useState('HighP Web Workspace');
  const lastActivityRef = React.useRef(Date.now());

  const triggerAgentDownload = useCallback(() => {
    try {
      const link = document.createElement('a');
      link.href = getDesktopAgentDownloadUrl();
      link.setAttribute('download', 'HighP-Agent-Setup-1.0.0.exe');
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setAutoDownloaded(true);
    } catch (e) {
      console.error('Auto download trigger failed:', e);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const hasInstalled = localStorage.getItem('highp_agent_installed');
    if (hasInstalled === 'true') {
      setShowInstallBanner(false);
    }
  }, []);

  const handleDismissInstall = () => {
    localStorage.setItem('highp_agent_installed', 'true');
    setShowInstallBanner(false);
  };

  const fetchMyData = useCallback(async () => {
    if (!profile?._id) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [empRes, timelineRes, appRes] = await Promise.all([
        api.get(`/employees/${profile._id}`),
        api.get(`/activity/${profile._id}/timeline?date=${today}`),
        api.get(`/applications/usage/${profile._id}?date=${today}`)
      ]);

      if (empRes.data?.data?.profile) {
        const p = empRes.data.data.profile;
        setCurrentProfile(p);
        setLiveActiveSeconds((s) => Math.max(s, p.todayActiveSeconds || 0));
        setLiveIdleSeconds((s) => Math.max(s, p.todayIdleSeconds || 0));
        setLiveBreakSeconds((s) => Math.max(s, p.todayBreakSeconds || 0));
        if (p.currentApplication) setCurrentAppFocus(p.currentApplication);
      }
      if (timelineRes.data?.data?.events) setTimelineEvents(timelineRes.data.data.events);
      if (appRes.data?.data?.applications) setAppUsages(appRes.data.data.applications);
    } catch (err) {
      console.error('[Employee] Fetch error:', err);
    }
  }, [profile?._id]);

  useEffect(() => {
    if (profile?._id) {
      fetchMyData();
      const interval = setInterval(fetchMyData, 10000);
      return () => clearInterval(interval);
    }
  }, [profile?._id, fetchMyData]);

  const isWorking = !!currentProfile?.currentSessionId;
  const isOnBreak = currentProfile?.currentStatus === ActivityState.BREAK;
  const todayStr = new Date().toISOString().slice(0, 10);

  // Track User Interaction for Idle Detection
  useEffect(() => {
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
      if (isIdle) {
        setIsIdle(false);
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, []);

  const isWorkingRef = React.useRef(isWorking);
  const isOnBreakRef = React.useRef(isOnBreak);
  const isIdleRef = React.useRef(isIdle);

  useEffect(() => {
    isWorkingRef.current = isWorking;
  }, [isWorking]);

  useEffect(() => {
    isOnBreakRef.current = isOnBreak;
  }, [isOnBreak]);

  useEffect(() => {
    isIdleRef.current = isIdle;
  }, [isIdle]);

  // 1-Second Live Local Ticker
  useEffect(() => {
    if (!isWorking) return;

    const ticker = setInterval(() => {
      // 5-minute inactivity threshold
      const idleMs = Date.now() - lastActivityRef.current;
      const nowIdle = idleMs > 5 * 60 * 1000;
      if (nowIdle !== isIdleRef.current) {
        isIdleRef.current = nowIdle;
        setIsIdle(nowIdle);
      }

      if (isOnBreakRef.current) {
        setLiveBreakSeconds((s) => s + 1);
      } else if (nowIdle) {
        setLiveIdleSeconds((s) => s + 1);
      } else {
        setLiveActiveSeconds((s) => s + 1);
      }
    }, 1000);

    return () => clearInterval(ticker);
  }, [isWorking]);

  // Periodic 15-Second Attendance Heartbeat to Backend
  const sendHeartbeat = useCallback(
    async (overrideStatus?: ActivityState, durationSec = 15) => {
      if (!isWorkingRef.current || !profile?._id) return;
      try {
        const effectiveStatus =
          overrideStatus ||
          (isOnBreakRef.current
            ? ActivityState.BREAK
            : isIdleRef.current
            ? ActivityState.IDLE
            : ActivityState.ACTIVE);
        const idleTimeSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000);
        const appName = document.title || 'HighP Web Workspace';

        await api.post('/attendance/heartbeat', {
          status: effectiveStatus,
          currentApplication: appName,
          recentDurationSeconds: durationSec,
          idleSeconds: idleTimeSeconds
        });
        setCurrentAppFocus(appName);
      } catch (err) {
        console.warn('[Tracking] Heartbeat sync warning:', err);
      }
    },
    [profile?._id]
  );

  useEffect(() => {
    if (!isWorking) return;
    const interval = setInterval(() => {
      sendHeartbeat(undefined, 15);
    }, 15000);
    return () => clearInterval(interval);
  }, [isWorking, sendHeartbeat]);

  const handleStartWork = async () => {
    setLoading(true);
    try {
      await api.post('/attendance/start', {});
      await api.post('/attendance/heartbeat', {
        status: ActivityState.ACTIVE,
        currentApplication: document.title || 'HighP Web Workspace',
        recentDurationSeconds: 1,
        idleSeconds: 0
      });
      lastActivityRef.current = Date.now();
      setIsIdle(false);
      await fetchMyData();
      await refreshAuth();
    } catch (err) {
      console.error('[Employee] Start work error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndWork = async () => {
    if (!confirm('Are you sure you want to end your work session?')) return;
    setLoading(true);
    try {
      await sendHeartbeat(ActivityState.OFFLINE, 1);
      await api.post('/attendance/end', {});
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
      await sendHeartbeat(ActivityState.BREAK, 1);
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
      await sendHeartbeat(ActivityState.ACTIVE, 1);
      await fetchMyData();
      await refreshAuth();
    } catch (err) {
      console.error('[Employee] End break error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0B0F19] text-slate-100">
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {user?.role !== 'EMPLOYEE' && (
            <Link
              to="/dashboard"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
            </Link>
          )}
          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight">My Employee Workspace</h1>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate max-w-[200px] sm:max-w-none" suppressHydrationWarning>
              {company?.name ? `${company.name} • ` : ''}Code: <span className="font-mono font-bold text-slate-200">{currentProfile?.employeeCode || 'EMP-001'}</span>{currentProfile?.department ? ` • ${currentProfile.department}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <StatusBadge
            status={
              !isWorking
                ? ActivityState.OFFLINE
                : isOnBreak
                ? ActivityState.BREAK
                : isIdle
                ? ActivityState.IDLE
                : ActivityState.ACTIVE
            }
            size="sm"
          />
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-8 pb-24 space-y-6 sm:space-y-8 flex-1 overflow-y-auto max-w-6xl mx-auto w-full">
        {/* Desktop Agent Auto-Download & Setup Banner */}
        {showInstallBanner && (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400 shadow-inner">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      HighP Desktop Agent (1-Click Install)
                    </h3>
                    <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {autoDownloaded ? 'Downloaded to browser' : 'Auto-Downloading...'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                    {autoDownloaded ? (
                      <>
                        <strong className="text-indigo-300">Next Step:</strong> Click <code className="bg-slate-950 text-indigo-200 px-1 py-0.5 rounded text-[11px] border border-slate-800">HighP Agent Setup 1.0.0.exe</code> in your browser downloads bar to complete 1-click install.
                      </>
                    ) : (
                      'Your download is starting automatically. Click the downloaded file to connect your computer.'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={triggerAgentDownload}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-indigo-600/30 transition-all hover:scale-105"
                >
                  <Download className="w-3.5 h-3.5" />
                  {autoDownloaded ? 'Download Again' : 'Download Now'}
                </button>
                <button
                  type="button"
                  onClick={handleDismissInstall}
                  className="inline-flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-medium px-3.5 py-2 rounded-xl text-xs border border-slate-700 transition-colors"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  I've Installed It
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Work Session & Attendance Hero Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Today's Work Session
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                {isWorking ? (
                  <span className="text-emerald-400 flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span> Active Work Session
                  </span>
                ) : (
                  <span className="text-slate-400">Not Clocked In</span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 max-w-lg leading-relaxed">
                {isWorking
                  ? 'Your session is active. You can log breaks or clock out when finishing your shift.'
                  : 'Start your shift below to begin recording work attendance.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 relative z-10">
              {!isWorking ? (
                <button
                  onClick={handleStartWork}
                  disabled={loading}
                  className="w-full sm:w-auto justify-center flex items-center gap-2.5 px-7 py-3.5 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-5 h-5 fill-current" /> Start Work
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  {!isOnBreak ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={breakReason}
                        onChange={(e) => setBreakReason(e.target.value)}
                        className="flex-1 sm:flex-none px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none shadow-sm focus:border-indigo-500"
                      >
                        <option value={BreakReason.LUNCH}>🥪 Lunch Break</option>
                        <option value={BreakReason.COFFEE}>☕ Coffee Break</option>
                        <option value={BreakReason.PERSONAL}>🚶 Personal Break</option>
                        <option value={BreakReason.MEETING}>👥 Offline Meeting</option>
                      </select>
                      <button
                        onClick={handleStartBreak}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 whitespace-nowrap"
                      >
                        <Coffee className="w-4 h-4" /> Take Break
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleEndBreak}
                      disabled={loading}
                      className="w-full sm:w-auto justify-center flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current" /> Resume Work
                    </button>
                  )}

                  <button
                    onClick={handleEndWork}
                    disabled={loading}
                    className="w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <Square className="w-4 h-4 fill-current" /> End Work
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800 text-center relative z-10">
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 shadow-md">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Active Work</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block tracking-tight">
                {formatDuration(liveActiveSeconds)}
              </span>
            </div>
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 shadow-md">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Idle Time</span>
              <span className="text-2xl font-black text-amber-400 mt-1 block tracking-tight">
                {formatDuration(liveIdleSeconds)}
              </span>
            </div>
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 shadow-md">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Break Time</span>
              <span className="text-2xl font-black text-cyan-400 mt-1 block tracking-tight">
                {formatDuration(liveBreakSeconds)}
              </span>
            </div>
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 shadow-md">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Current Focus</span>
              <span className="text-sm font-bold text-white mt-1.5 block truncate">
                {!isWorking
                  ? 'None'
                  : isOnBreak
                  ? 'On Break'
                  : isIdle
                  ? 'Idle / Inactive'
                  : currentAppFocus}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Today's Timeline & Application Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2">
            <TimelineVisualizer events={timelineEvents} dateStr={todayStr} />
          </div>

          <div className="space-y-6">
            {/* Transparency Pledge */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-900 text-white border border-indigo-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-2.5 mb-3 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-sm">Transparency Guarantee</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                You have full visibility over what is tracked. HighP Agent never captures private messages, passwords, keystrokes, webcam, or screen recordings.
              </p>
              <div className="space-y-2 text-[11px] text-slate-300">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active App Identity & Time
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Session & Break Durations
                </div>
              </div>
            </div>

            {/* My Top Apps Today */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <h3 className="font-bold text-white text-sm mb-4 pb-2 border-b border-slate-800">
                My Software Usage Today
              </h3>
              {appUsages.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No app activity recorded yet today.</p>
              ) : (
                <div className="space-y-3">
                  {appUsages.map((app, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-200 truncate max-w-[150px]">{app.applicationName}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{formatDuration(app.totalSeconds)}</span>
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
