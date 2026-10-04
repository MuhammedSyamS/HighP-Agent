'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { formatDuration, getLocalDateString } from '../../lib/utils';
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
  Check,
  AlertCircle,
  X
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
  const [actionError, setActionError] = useState<string>('');
  const [breakReason, setBreakReason] = useState<string>(BreakReason.LUNCH);

  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [autoDownloaded, setAutoDownloaded] = useState(false);

  // Synchronize currentProfile whenever profile arrives from auth context
  useEffect(() => {
    if (profile) {
      setCurrentProfile((prev: any) => ({
        ...prev,
        ...profile
      }));
    }
  }, [profile]);

  // Authentication guard
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // Real-Time Live Tracking Engine State with localStorage persistence across page reloads
  const [liveActiveSeconds, setLiveActiveSeconds] = useState<number>(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const savedDate = localStorage.getItem('highp_live_date');
      const savedActive = localStorage.getItem('highp_live_active_sec');
      if (savedDate === today && savedActive) {
        return Math.max(0, parseInt(savedActive, 10) || 0);
      }
    } catch {}
    return 0;
  });

  const [liveIdleSeconds, setLiveIdleSeconds] = useState<number>(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const savedDate = localStorage.getItem('highp_live_date');
      const savedIdle = localStorage.getItem('highp_live_idle_sec');
      if (savedDate === today && savedIdle) {
        return Math.max(0, parseInt(savedIdle, 10) || 0);
      }
    } catch {}
    return 0;
  });

  const [liveBreakSeconds, setLiveBreakSeconds] = useState<number>(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const savedDate = localStorage.getItem('highp_live_date');
      const savedBreak = localStorage.getItem('highp_live_break_sec');
      if (savedDate === today && savedBreak) {
        return Math.max(0, parseInt(savedBreak, 10) || 0);
      }
    } catch {}
    return 0;
  });

  const [isIdle, setIsIdle] = useState(false);
  const [currentAppFocus, setCurrentAppFocus] = useState('Active Workstation');
  const lastActivityRef = React.useRef(Date.now());

  // Save live counters to localStorage so page refresh never wipes today's tracked time
  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('highp_live_date', today);
      if (liveActiveSeconds > 0) localStorage.setItem('highp_live_active_sec', String(liveActiveSeconds));
      if (liveIdleSeconds > 0) localStorage.setItem('highp_live_idle_sec', String(liveIdleSeconds));
      if (liveBreakSeconds > 0) localStorage.setItem('highp_live_break_sec', String(liveBreakSeconds));
    } catch {}
  }, [liveActiveSeconds, liveIdleSeconds, liveBreakSeconds]);

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
    const empId = profile?._id || currentProfile?._id || user?.employeeProfileId;
    if (!empId) return;
    try {
      const today = getLocalDateString();
      const [empRes, timelineRes, appRes, liveRes] = await Promise.all([
        api.get(`/employees/${empId}`),
        api.get(`/activity/${empId}/timeline?date=${today}`),
        api.get(`/applications/usage/${empId}?date=${today}`),
        api.get(`/employees/${empId}/live`).catch(() => null)
      ]);

      if (empRes.data?.data?.profile) {
        const p = empRes.data.data.profile;
        setCurrentProfile(p);

        const currentSess = empRes.data?.data?.currentSession;
        let sessActive = 0;
        let sessIdle = 0;
        let sessBreak = 0;
        if (currentSess && currentSess.startedAt) {
          sessActive = currentSess.activeSeconds || 0;
          sessIdle = currentSess.idleSeconds || 0;
          sessBreak = currentSess.breakSeconds || 0;
        }

        const authoritativeActive = Math.max(p.todayActiveSeconds || 0, sessActive);
        const authoritativeIdle = Math.max(p.todayIdleSeconds || 0, sessIdle);
        const authoritativeBreak = Math.max(p.todayBreakSeconds || 0, sessBreak);

        setLiveActiveSeconds(authoritativeActive);
        setLiveIdleSeconds(authoritativeIdle);
        setLiveBreakSeconds(authoritativeBreak);
        if (p.currentApplication) setCurrentAppFocus(p.currentApplication);
      }
      if (liveRes?.data?.data) {
        const live = liveRes.data.data;
        if (live.application && live.status === 'active') {
          setCurrentAppFocus(live.application);
        }
      }
      if (timelineRes.data?.data?.events) setTimelineEvents(timelineRes.data.data.events);
      if (appRes.data?.data?.applications) setAppUsages(appRes.data.data.applications);
    } catch (err) {
      console.error('[Employee] Fetch error:', err);
    }
  }, [profile?._id, currentProfile?._id, user?.employeeProfileId]);

  useEffect(() => {
    const empId = profile?._id || currentProfile?._id || user?.employeeProfileId;
    if (empId) {
      fetchMyData();
      const interval = setInterval(fetchMyData, 10000);

      // Subscribe to real-time Socket.IO live telemetry events
      const socket = getSocket();
      if (socket) {
        const handleTelemetryUpdated = (data: any) => {
          if (data && data.employeeProfileId === empId) {
            console.log(`[FRONTEND]\napplication=${data.application}`);
            if (data.status === 'active') {
              setCurrentAppFocus(data.application || 'Active Workstation');
              setIsIdle(false);
            } else if (data.status === 'idle') {
              setIsIdle(true);
            } else if (data.status === 'break') {
              setCurrentAppFocus('On Break');
            } else if (data.status === 'offline') {
              setCurrentAppFocus('Session not active');
            }
          }
        };

        const handleStatusChanged = (data: any) => {
          if (data && (data.employeeProfileId === empId || data.employeeId === empId)) {
            setCurrentProfile((prev: any) => ({
              ...prev,
              currentStatus: data.status,
              currentApplication: data.currentApplication !== undefined ? data.currentApplication : prev?.currentApplication
            }));
            if (data.status === 'ACTIVE' && data.currentApplication) {
              setCurrentAppFocus(data.currentApplication);
            }
          }
        };

        const handleActivityChanged = (data: any) => {
          if (data && (data.employeeProfileId === empId || data.employeeId === empId)) {
            if (data.currentApplication) {
              setCurrentAppFocus(data.currentApplication);
            }
          }
        };

        socket.on('employee:telemetry_updated', handleTelemetryUpdated);
        socket.on('employee:status_changed', handleStatusChanged);
        socket.on('employee:activity_changed', handleActivityChanged);

        return () => {
          clearInterval(interval);
          socket.off('employee:telemetry_updated', handleTelemetryUpdated);
          socket.off('employee:status_changed', handleStatusChanged);
          socket.off('employee:activity_changed', handleActivityChanged);
        };
      }

      return () => clearInterval(interval);
    }
  }, [profile?._id, currentProfile?._id, user?.employeeProfileId, fetchMyData]);

  const isWorking = !!currentProfile?.currentSessionId;
  const isOnBreak = currentProfile?.currentStatus === ActivityState.BREAK;
  const todayStr = getLocalDateString();

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

const getBrowserAppName = (): string => {
  if (typeof window === 'undefined') return '';
  // If the tab is hidden or lacks focus, the user is working in an external desktop app (like Antigravity IDE)
  if (typeof document !== 'undefined' && (document.hidden || !document.hasFocus())) {
    return '';
  }
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Microsoft Edge';
  if ((navigator as any).brave || ua.includes('Brave')) return 'Brave Browser';
  if (ua.includes('Chrome/')) return 'Google Chrome';
  if (ua.includes('Firefox/')) return 'Mozilla Firefox';
  if (ua.includes('Safari/')) return 'Apple Safari';
  return 'Web Browser';
};

  // Periodic 15-Second Attendance Heartbeat to Backend
  const sendHeartbeat = useCallback(
    async (overrideStatus?: ActivityState, durationSec = 15) => {
      const empId = profile?._id || currentProfile?._id || user?.employeeProfileId;
      if (!isWorkingRef.current || !empId) return;
      try {
        const effectiveStatus =
          overrideStatus ||
          (isOnBreakRef.current
            ? ActivityState.BREAK
            : isIdleRef.current
            ? ActivityState.IDLE
            : ActivityState.ACTIVE);
        const idleTimeSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000);
        const browserApp = getBrowserAppName();
        const isDesktopLinked = !!currentProfile?.currentDeviceId;

        await api.post('/attendance/heartbeat', {
          status: effectiveStatus,
          ...(!isDesktopLinked && browserApp ? { currentApplication: browserApp } : {}),
          recentDurationSeconds: durationSec,
          idleSeconds: idleTimeSeconds
        });
      } catch (err) {
        console.warn('[Tracking] Heartbeat sync warning:', err);
      }
    },
    [profile?._id, currentProfile?._id, user?.employeeProfileId]
  );

  useEffect(() => {
    if (!isWorking) return;
    const interval = setInterval(() => {
      sendHeartbeat(undefined, 15);
    }, 15000);
    return () => clearInterval(interval);
  }, [isWorking, sendHeartbeat]);

  // Tab focus re-engagement listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isWorkingRef.current) {
        lastActivityRef.current = Date.now();
        setIsIdle(false);
        sendHeartbeat(ActivityState.ACTIVE, 5);
        fetchMyData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sendHeartbeat, fetchMyData]);

  const handleStartWork = async () => {
    setActionError('');
    setLoading(true);
    // Optimistic UI update
    const browserApp = getBrowserAppName();
    setCurrentProfile((prev: any) => ({
      ...prev,
      currentStatus: ActivityState.ACTIVE,
      currentApplication: browserApp,
      currentSessionId: prev?.currentSessionId || 'session-optimistic'
    }));
    isWorkingRef.current = true;
    isOnBreakRef.current = false;
    lastActivityRef.current = Date.now();
    setIsIdle(false);

    try {
      const startRes = await api.post('/attendance/start', {});
      if (startRes.data?.data) {
        setCurrentProfile((prev: any) => ({
          ...prev,
          currentSessionId: startRes.data.data._id,
          currentStatus: ActivityState.ACTIVE,
          currentApplication: browserApp
        }));
      }
      await api.post('/attendance/heartbeat', {
        status: ActivityState.ACTIVE,
        currentApplication: browserApp,
        recentDurationSeconds: 1,
        idleSeconds: 0
      });
      await fetchMyData();
      await refreshAuth();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to start work session.';
      console.error('[Employee] Start work error:', err);
      setActionError(msg);
      await fetchMyData();
    } finally {
      setLoading(false);
    }
  };

  const handleEndWork = async () => {
    if (!confirm('Are you sure you want to end your work session?')) return;
    setActionError('');
    setLoading(true);
    // Optimistic UI update
    setCurrentProfile((prev: any) => ({
      ...prev,
      currentStatus: ActivityState.OFFLINE,
      currentSessionId: undefined,
      currentApplication: ''
    }));
    isWorkingRef.current = false;
    isOnBreakRef.current = false;

    try {
      await sendHeartbeat(ActivityState.OFFLINE, 1);
      await api.post('/attendance/end', {});
      await fetchMyData();
      await refreshAuth();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to end work session.';
      console.error('[Employee] End work error:', err);
      setActionError(msg);
      await fetchMyData();
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async () => {
    setActionError('');
    setLoading(true);
    // Optimistic UI update - immediately flips button and status
    setCurrentProfile((prev: any) => ({
      ...prev,
      currentStatus: ActivityState.BREAK,
      currentApplication: 'On Break'
    }));
    isOnBreakRef.current = true;
    setCurrentAppFocus('On Break');

    try {
      await api.post('/breaks/start', { reason: breakReason });
      await sendHeartbeat(ActivityState.BREAK, 1);
      await fetchMyData();
      await refreshAuth();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to start break.';
      console.error('[Employee] Start break error:', err);
      setActionError(msg);
      await fetchMyData();
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setActionError('');
    setLoading(true);
    // Optimistic UI update - immediately returns to active work
    const browserApp = getBrowserAppName();
    setCurrentProfile((prev: any) => ({
      ...prev,
      currentStatus: ActivityState.ACTIVE,
      currentApplication: browserApp || 'Active Workstation'
    }));
    isOnBreakRef.current = false;
    lastActivityRef.current = Date.now();
    setIsIdle(false);
    setCurrentAppFocus(browserApp || 'Active Workstation');

    try {
      await api.post('/breaks/end', {});
      await sendHeartbeat(ActivityState.ACTIVE, 1);
      await fetchMyData();
      await refreshAuth();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to resume work from break.';
      console.error('[Employee] End break error:', err);
      setActionError(msg);
      await fetchMyData();
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-bold tracking-wider uppercase">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC] text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 sm:px-10 py-4 flex items-center justify-between sticky top-0 z-20 transition-all">
        <div className="flex items-center gap-4">
          {user?.role !== 'EMPLOYEE' && (
            <Link
              to="/dashboard"
              className="p-2 rounded-xl text-slate-600 hover:text-black hover:bg-slate-100 transition-colors border border-slate-200 shadow-2xs"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600" />
            </Link>
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                My Workstation Hub
              </h1>
              {company?.name && (
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {company.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium truncate max-w-[280px] sm:max-w-none mt-0.5" suppressHydrationWarning>
              Employee ID: <span className="font-mono font-bold text-slate-800">{currentProfile?.employeeCode || 'EMP-001'}</span>
              {currentProfile?.department ? ` • ${currentProfile.department}` : ''}
              {currentProfile?.designation ? ` (${currentProfile.designation})` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
            size="md"
          />
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-all shadow-2xs"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="p-6 sm:p-10 pb-28 space-y-8 flex-1 overflow-y-auto max-w-6xl mx-auto w-full">
        {actionError && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold animate-fade-in shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError('')}
              className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
              title="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Desktop Agent Setup Banner */}
        {showInstallBanner && (
          <div className="bg-gradient-to-r from-indigo-50/90 via-sky-50/60 to-white border border-indigo-200/90 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                      HighP Desktop Agent (Windows Telemetry)
                    </h3>
                    <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {autoDownloaded ? 'Downloaded to Browser' : 'Available for Windows'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                    Install the native background agent to track active desktop applications (VS Code, Chrome, Terminal, Office) and accurately measure focus & idle duration.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={triggerAgentDownload}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  {autoDownloaded ? 'Download Again' : 'Download (.exe)'}
                </button>
                <button
                  type="button"
                  onClick={handleDismissInstall}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 shadow-2xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Primary Attendance & Shift Control Hero Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Current Attendance State
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="text-xs font-semibold text-slate-500">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5 tracking-tight font-sans">
                {isWorking ? (
                  isOnBreak ? (
                    <span className="text-amber-600 flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-500 animate-pulse"></span>
                      On Break ({breakReason})
                    </span>
                  ) : isIdle ? (
                    <span className="text-amber-500 flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-400"></span>
                      Workstation Idle
                    </span>
                  ) : (
                    <span className="text-emerald-600 flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping"></span>
                      Active Work Shift
                    </span>
                  )
                ) : (
                  <span className="text-slate-400 flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                    Shift Not Started
                  </span>
                )}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl leading-relaxed">
                {isWorking
                  ? isOnBreak
                    ? 'You are on break. Click "Resume Work" when you return to your workstation.'
                    : 'Your session is recording active software time, idle intervals, and productivity metrics.'
                  : 'Start your work shift below to begin recording attendance.'}
              </p>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 relative z-10 shrink-0">
              {!isWorking ? (
                <button
                  onClick={handleStartWork}
                  disabled={loading}
                  className="w-full sm:w-auto justify-center flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-black hover:bg-slate-800 text-white font-black text-sm shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-5 h-5 fill-current text-white" />
                  <span>Start Work Shift</span>
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {!isOnBreak ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={breakReason}
                        onChange={(e) => setBreakReason(e.target.value)}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
                      >
                        <option value={BreakReason.LUNCH}>🥪 Lunch Break</option>
                        <option value={BreakReason.COFFEE}>☕ Coffee Break</option>
                        <option value={BreakReason.PERSONAL}>🚶 Personal Break</option>
                        <option value={BreakReason.MEETING}>👥 Offline Meeting</option>
                      </select>
                      <button
                        onClick={handleStartBreak}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all active:scale-95 whitespace-nowrap"
                      >
                        <Coffee className="w-4 h-4" />
                        <span>Take Break</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleEndBreak}
                      disabled={loading}
                      className="w-full sm:w-auto justify-center flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Resume Work Shift</span>
                    </button>
                  )}

                  <button
                    onClick={handleEndWork}
                    disabled={loading}
                    className="w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 shadow-2xs transition-all active:scale-95"
                  >
                    <Square className="w-4 h-4 fill-current text-rose-600" />
                    <span>Clock Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Metric Grid with generous breathing room */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-9 pt-7 border-t border-slate-100 text-center relative z-10">
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 shadow-2xs transition-all hover:bg-slate-50">
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                Active Work Today
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 block tracking-tight font-sans">
                {formatDuration(liveActiveSeconds)}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 mt-1 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Productive focus
              </span>
            </div>

            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 shadow-2xs transition-all hover:bg-slate-50">
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                Idle Inactivity
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2 block tracking-tight font-sans">
                {formatDuration(liveIdleSeconds)}
              </span>
              <span className="text-[11px] font-semibold text-amber-700 mt-1 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Away from desk
              </span>
            </div>

            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 shadow-2xs transition-all hover:bg-slate-50">
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                Total Breaks
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-2 block tracking-tight font-sans">
                {formatDuration(liveBreakSeconds)}
              </span>
              <span className="text-[11px] font-semibold text-indigo-700 mt-1 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Logged breaks
              </span>
            </div>

            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 shadow-2xs transition-all hover:bg-slate-50">
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                Current Software Focus
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-900 mt-2 block truncate">
                {!isWorking
                  ? 'Shift Inactive'
                  : isOnBreak
                  ? 'On Break'
                  : isIdle
                  ? 'Idle / Inactive'
                  : currentAppFocus}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 mt-1 inline-flex items-center gap-1">
                <Monitor className="w-3 h-3 text-slate-400" /> Foreground app
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Today's Timeline & Software Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2">
            <TimelineVisualizer events={timelineEvents} dateStr={todayStr} />
          </div>

          <div className="space-y-6">
            {/* Transparency Pledge */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2.5 mb-3 text-indigo-600">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Privacy & Transparency Guarantee</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                You have full visibility over what is tracked. HighP Agent never captures private chat messages, passwords, keystrokes, webcam, or desktop screen recordings.
              </p>
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Foreground App Name & Time</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Work Shift & Break Durations</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No Keystrokes or Screen Capture</span>
                </div>
              </div>
            </div>

            {/* My Top Apps Today */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  My Software Usage Today
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  {appUsages.length} apps
                </span>
              </div>

              {appUsages.filter(
                (a) =>
                  !a.applicationName.toLowerCase().includes('highp') &&
                  !a.applicationName.toLowerCase().includes('internal workforce') &&
                  !a.applicationName.toLowerCase().includes('highphaus') &&
                  !a.applicationName.toLowerCase().includes('electron')
              ).length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No app activity recorded yet today.</p>
              ) : (
                <div className="space-y-3">
                  {appUsages
                    .filter(
                      (a) =>
                        !a.applicationName.toLowerCase().includes('highp') &&
                        !a.applicationName.toLowerCase().includes('internal workforce') &&
                        !a.applicationName.toLowerCase().includes('highphaus') &&
                        !a.applicationName.toLowerCase().includes('electron')
                    )
                    .map((app, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1.5">
                        <span className="text-slate-800 font-bold truncate max-w-[170px]">{app.applicationName}</span>
                        <span className="text-indigo-600 font-mono font-bold text-xs">{formatDuration(app.totalSeconds)}</span>
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
