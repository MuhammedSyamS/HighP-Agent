'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { formatDuration, formatDurationExact, getLocalDateString } from '../../lib/utils';
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
  X,
  Globe,
  Calendar,
  List,
  Layers,
  History
} from 'lucide-react';
import { ActivityState, BreakReason } from '@highp/shared';
import { getDesktopAgentDownloadUrl } from '../../lib/constants';

export default function EmployeeWorkspacePage() {
  const navigate = useNavigate();
  const { user, profile, company, refreshAuth, logout, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>(profile);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [completedSessions, setCompletedSessions] = useState<any[]>([]);
  const [lastCompletedSession, setLastCompletedSession] = useState<any>(null);
  const [todayTotals, setTodayTotals] = useState<any>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [appUsages, setAppUsages] = useState<any[]>([]);
  const [websiteUsages, setWebsiteUsages] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string>('');
  const [breakReason, setBreakReason] = useState<string>(BreakReason.LUNCH);
  const [activityViewTab, setActivityViewTab] = useState<'timeline' | 'logs'>('timeline');

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

  // Save live counters to localStorage only while actively working
  useEffect(() => {
    try {
      if (isWorkingRef.current) {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('highp_live_date', today);
        localStorage.setItem('highp_live_active_sec', String(liveActiveSeconds));
        localStorage.setItem('highp_live_idle_sec', String(liveIdleSeconds));
        localStorage.setItem('highp_live_break_sec', String(liveBreakSeconds));
      } else {
        localStorage.removeItem('highp_live_active_sec');
        localStorage.removeItem('highp_live_idle_sec');
        localStorage.removeItem('highp_live_break_sec');
      }
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
      const queryDate = selectedDate || today;
      const [empRes, timelineRes, appRes, webRes, liveRes] = await Promise.all([
        api.get(`/employees/${empId}`),
        api.get(`/activity/${empId}/timeline?date=${queryDate}`),
        api.get(`/applications/usage/${empId}?date=${queryDate}`),
        api.get(`/applications/websites/${empId}?date=${queryDate}`).catch(() => null),
        api.get(`/employees/${empId}/live`).catch(() => null)
      ]);

      if (empRes.data?.data) {
        const d = empRes.data.data;
        const p = d.profile;
        if (p) setCurrentProfile(p);

        const currentSess = d.currentSession && d.currentSession.status === 'ACTIVE' ? d.currentSession : null;
        setCurrentSession(currentSess);
        setCompletedSessions(d.completedSessions || []);
        setLastCompletedSession(d.lastCompletedSession || null);
        setTodayTotals(d.todayTotals || null);

        let sessActive = 0;
        let sessIdle = 0;
        let sessBreak = 0;
        if (currentSess && currentSess.startedAt) {
          sessActive = currentSess.activeSeconds || 0;
          sessIdle = currentSess.idleSeconds || 0;
          sessBreak = currentSess.breakSeconds || 0;
        }

        const isCurrentlyWorking = !!currentSess && p?.currentStatus !== ActivityState.OFFLINE;

        if (isCurrentlyWorking) {
          // Sync with the active work session (starts clean from 0 for every shift!)
          setLiveActiveSeconds(sessActive);
          setLiveIdleSeconds(sessIdle);
          setLiveBreakSeconds(sessBreak);
        } else {
          // Off shift: reset live shift counters so user is ready for new shift
          setLiveActiveSeconds(0);
          setLiveIdleSeconds(0);
          setLiveBreakSeconds(0);
          try {
            localStorage.removeItem('highp_live_active_sec');
            localStorage.removeItem('highp_live_idle_sec');
            localStorage.removeItem('highp_live_break_sec');
          } catch {}
        }
        if (p?.currentApplication && isCurrentlyWorking) {
          setCurrentAppFocus(p.currentApplication);
        } else if (!isCurrentlyWorking) {
          setCurrentAppFocus('Shift Inactive');
        }
      }
      if (liveRes?.data?.data) {
        const live = liveRes.data.data;
        if (live.application && live.status === 'active') {
          setCurrentAppFocus(live.application);
        }
      }

      let events = timelineRes.data?.data?.events || [];
      // If selected date has 0 events and it's today, check yesterday's events so overnight/late-night workers see their shift
      if (events.length === 0 && queryDate === today) {
        try {
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          const yRes = await api.get(`/activity/${empId}/timeline?date=${yesterday}`);
          if (yRes.data?.data?.events?.length > 0) {
            events = yRes.data.data.events;
          }
        } catch {}
      }
      setTimelineEvents(events);

      let apps = appRes.data?.data?.applications || [];
      if (apps.length === 0 && queryDate === today && empRes.data?.data?.topApps?.length > 0) {
        apps = empRes.data.data.topApps;
      }
      setAppUsages(apps);

      const sites = (webRes?.data?.data?.websites && webRes.data.data.websites.length > 0)
        ? webRes.data.data.websites
        : (empRes.data?.data?.topWebsites || []);
      setWebsiteUsages(sites);
    } catch (err) {
      console.error('[Employee] Fetch error:', err);
    }
  }, [profile?._id, user?.employeeProfileId, selectedDate]);

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
            if (data.status === 'OFFLINE' || data.status === 'offline') {
              isWorkingRef.current = false;
              isOnBreakRef.current = false;
              setIsIdle(false);
              setCurrentSession(null);
              setLiveActiveSeconds(0);
              setLiveIdleSeconds(0);
              setLiveBreakSeconds(0);
              setCurrentAppFocus('Shift Inactive');
              setCurrentProfile((prev: any) => ({
                ...prev,
                currentStatus: ActivityState.OFFLINE,
                currentSessionId: undefined,
                currentApplication: '',
                todayActiveSeconds: data.todayActiveSeconds ?? prev?.todayActiveSeconds,
                todayIdleSeconds: data.todayIdleSeconds ?? prev?.todayIdleSeconds,
                todayBreakSeconds: data.todayBreakSeconds ?? prev?.todayBreakSeconds,
                todayAttendanceStatus: 'COMPLETED'
              }));
              fetchMyData();
              return;
            }

            setCurrentProfile((prev: any) => ({
              ...prev,
              currentStatus: data.status,
              currentApplication: data.currentApplication !== undefined ? data.currentApplication : prev?.currentApplication,
              currentWebsiteDomain: data.currentWebsite?.domain !== undefined ? data.currentWebsite.domain : prev?.currentWebsiteDomain,
              todayActiveSeconds: data.todayActiveSeconds ?? prev?.todayActiveSeconds,
              todayIdleSeconds: data.todayIdleSeconds ?? prev?.todayIdleSeconds,
              todayBreakSeconds: data.todayBreakSeconds ?? prev?.todayBreakSeconds
            }));

            if (data.currentSessionActiveSeconds != null) {
              setLiveActiveSeconds(data.currentSessionActiveSeconds);
            }
            if (data.currentSessionIdleSeconds != null) {
              setLiveIdleSeconds(data.currentSessionIdleSeconds);
            }

            if (data.status === 'IDLE' || data.status === 'idle') {
              setIsIdle(true);
              isIdleRef.current = true;
              setCurrentAppFocus('System Idle');
            } else if (data.status === 'ACTIVE' || data.status === 'active') {
              setIsIdle(false);
              isIdleRef.current = false;
              if (data.currentApplication) {
                setCurrentAppFocus(data.currentApplication);
              }
            } else if (data.status === 'BREAK' || data.status === 'break') {
              setCurrentAppFocus('On Break');
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

        const handleSessionEnded = (data: any) => {
          if (data && (data.employeeProfileId === empId || data.employeeId === empId)) {
            setCurrentSession(null);
            fetchMyData();
          }
        };

        socket.on('employee:telemetry_updated', handleTelemetryUpdated);
        socket.on('employee:status_changed', handleStatusChanged);
        socket.on('employee:activity_changed', handleActivityChanged);
        socket.on('employee:session_ended', handleSessionEnded);

        return () => {
          clearInterval(interval);
          socket.off('employee:telemetry_updated', handleTelemetryUpdated);
          socket.off('employee:status_changed', handleStatusChanged);
          socket.off('employee:activity_changed', handleActivityChanged);
          socket.off('employee:session_ended', handleSessionEnded);
        };
      }

      return () => clearInterval(interval);
    }
  }, [profile?._id, user?.employeeProfileId, selectedDate]);

  const isWorking = Boolean(
    (currentSession && currentSession.status === 'ACTIVE' && currentProfile?.currentStatus !== ActivityState.OFFLINE) ||
    (currentProfile?.currentSessionId && currentProfile?.currentStatus && currentProfile.currentStatus !== ActivityState.OFFLINE)
  );
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

  // 1-Second Live Local Ticker with strict mutual exclusion
  useEffect(() => {
    if (!isWorking) return;

    const ticker = setInterval(() => {
      // 1-minute (60-second) inactivity threshold
      const idleMs = Date.now() - lastActivityRef.current;
      const isDesktopIdle = currentProfile?.currentStatus === 'IDLE';
      const nowIdle = isIdleRef.current || isDesktopIdle || (idleMs > 60 * 1000);
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
  }, [isWorking, currentProfile?.currentStatus]);

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
          recentDurationSeconds: isDesktopLinked ? 0 : durationSec,
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
    // Optimistic UI update - start fresh at 0 for this new shift!
    const browserApp = getBrowserAppName();
    const nowIso = new Date().toISOString();
    setLiveActiveSeconds(0);
    setLiveIdleSeconds(0);
    setLiveBreakSeconds(0);
    try {
      localStorage.removeItem('highp_live_active_sec');
      localStorage.removeItem('highp_live_idle_sec');
      localStorage.removeItem('highp_live_break_sec');
    } catch {}
    setCurrentProfile((prev: any) => ({
      ...prev,
      currentStatus: ActivityState.ACTIVE,
      currentApplication: browserApp,
      currentSessionId: prev?.currentSessionId || 'session-optimistic',
      todayShiftStartedAt: prev?.todayShiftStartedAt || nowIso,
      todayShiftEndedAt: null,
      todayAttendanceStatus: 'PRESENT'
    }));
    isWorkingRef.current = true;
    isOnBreakRef.current = false;
    lastActivityRef.current = Date.now();
    setIsIdle(false);

    try {
      const startRes = await api.post('/attendance/start', {});
      const newSess = startRes.data?.data;
      if (newSess) {
        setCurrentSession(newSess);
        setCurrentProfile((prev: any) => ({
          ...prev,
          currentSessionId: newSess._id,
          currentStatus: ActivityState.ACTIVE,
          currentApplication: browserApp,
          currentShiftStartedAt: newSess.startedAt || nowIso,
          todayShiftStartedAt: prev?.todayShiftStartedAt || newSess.startedAt || nowIso,
          todayShiftEndedAt: null,
          todayAttendanceStatus: 'PRESENT'
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

    isWorkingRef.current = false;
    isOnBreakRef.current = false;
    setIsIdle(false);

    setCurrentSession(null);
    setCurrentProfile((prev: any) => ({
      ...prev,
      currentStatus: ActivityState.OFFLINE,
      currentSessionId: undefined,
      currentApplication: '',
      todayAttendanceStatus: 'COMPLETED'
    }));

    setLiveActiveSeconds(0);
    setLiveIdleSeconds(0);
    setLiveBreakSeconds(0);
    try {
      localStorage.removeItem('highp_live_active_sec');
      localStorage.removeItem('highp_live_idle_sec');
      localStorage.removeItem('highp_live_break_sec');
    } catch {}

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
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-3.5 xs:px-6 sm:px-10 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-20 transition-all w-full">
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
                      Working Now
                    </span>
                  )
                ) : completedSessions.length > 0 ? (
                  <span className="text-slate-600 flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-indigo-500"></span>
                    Clocked Out
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                    Not Clocked In
                  </span>
                )}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl leading-relaxed">
                {isWorking
                  ? isOnBreak
                    ? 'You are on break. Click "Resume Work" when you return to your workstation.'
                    : 'Your session is recording active software time, idle intervals, and productivity metrics.'
                  : completedSessions.length > 0
                  ? 'Your work session has ended. Click Start Work below to begin a new session.'
                  : 'Click Start Work below to begin recording your work session and attendance.'}
              </p>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 relative z-10 shrink-0 w-full lg:w-auto">
              {!isWorking ? (
                <button
                  onClick={handleStartWork}
                  disabled={loading}
                  className="w-full sm:w-auto justify-center flex items-center gap-2.5 px-8 py-3.5 sm:py-4 rounded-2xl bg-black hover:bg-slate-800 text-white font-black text-sm shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 min-h-[48px]"
                >
                  <Play className="w-5 h-5 fill-current text-white shrink-0" />
                  <span>Start Work</span>
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                  {!isOnBreak ? (
                    <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
                      <select
                        value={breakReason}
                        onChange={(e) => setBreakReason(e.target.value)}
                        className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs min-h-[44px]"
                      >
                        <option value={BreakReason.LUNCH}>🥪 Lunch Break</option>
                        <option value={BreakReason.COFFEE}>☕ Coffee Break</option>
                        <option value={BreakReason.PERSONAL}>🚶 Personal Break</option>
                        <option value={BreakReason.MEETING}>👥 Offline Meeting</option>
                      </select>
                      <button
                        onClick={handleStartBreak}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all active:scale-95 whitespace-nowrap min-h-[44px]"
                      >
                        <Coffee className="w-4 h-4 shrink-0" />
                        <span>Take Break</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleEndBreak}
                      disabled={loading}
                      className="w-full sm:w-auto justify-center flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95 min-h-[44px]"
                    >
                      <Play className="w-4 h-4 fill-current shrink-0" />
                      <span>Resume Work</span>
                    </button>
                  )}

                  <button
                    onClick={handleEndWork}
                    disabled={loading}
                    className="w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 shadow-2xs transition-all active:scale-95 min-h-[44px]"
                  >
                    <Square className="w-4 h-4 fill-current text-rose-600 shrink-0" />
                    <span>Clock Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Daily Attendance Marking & Session Timings Banner */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70 p-4.5 sm:p-5 rounded-2xl border border-slate-200/80 relative z-10">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0 ${
                  isWorking
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                    : completedSessions.length > 0
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Daily Attendance Log
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block">
                  {isWorking ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Present • Working Now
                    </span>
                  ) : completedSessions.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Work Concluded (Clocked Out)
                    </span>
                  ) : (
                    <span className="text-slate-500">Not Clocked In Today</span>
                  )}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
              <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isWorking ? 'Start Work (Current Session)' : lastCompletedSession ? 'Start Work (Last Session)' : 'Start Work (Clock In)'}
                </span>
                <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm mt-0.5 block">
                  {isWorking && currentSession?.startedAt ? (
                    new Date(currentSession.startedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  ) : !isWorking && lastCompletedSession?.startedAt ? (
                    new Date(lastCompletedSession.startedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  ) : isWorking ? (
                    'Marking now...'
                  ) : (
                    '—'
                  )}
                </span>
              </div>

              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isWorking ? 'Current Status' : 'End Work (Clock Out)'}
                </span>
                <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm mt-0.5 block">
                  {isWorking ? (
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnBreak ? 'bg-indigo-500' : isIdle || currentProfile?.currentStatus === 'IDLE' ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                      <span className={isOnBreak ? 'text-indigo-700' : isIdle || currentProfile?.currentStatus === 'IDLE' ? 'text-amber-700' : 'text-emerald-700'}>
                        {isOnBreak ? 'On Break' : isIdle || currentProfile?.currentStatus === 'IDLE' ? 'Workstation Idle' : 'Working Now'}
                      </span>
                    </span>
                  ) : !isWorking && lastCompletedSession?.endedAt ? (
                    new Date(lastCompletedSession.endedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  ) : (
                    '—'
                  )}
                </span>
              </div>

              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isWorking ? 'Current Session Duration' : lastCompletedSession ? 'Last Session Duration' : 'Total Work Duration'}
                </span>
                <span className="font-mono font-bold text-indigo-700 text-xs sm:text-sm mt-0.5 block">
                  {(() => {
                    if (isWorking) {
                      const startTime = currentSession?.startedAt || currentProfile?.currentShiftStartedAt;
                      if (startTime) {
                        const elapsedSec = Math.max(0, Math.round((Date.now() - new Date(startTime).getTime()) / 1000));
                        return formatDuration(elapsedSec);
                      }
                      return formatDuration(liveActiveSeconds + liveIdleSeconds + liveBreakSeconds);
                    }
                    if (lastCompletedSession && lastCompletedSession.durationSeconds != null) {
                      return formatDuration(lastCompletedSession.durationSeconds);
                    }
                    if (completedSessions.length > 0) {
                      const last = completedSessions[completedSessions.length - 1];
                      if (last.durationSeconds != null) return formatDuration(last.durationSeconds);
                      if (last.endedAt && last.startedAt) {
                        return formatDuration(Math.max(0, Math.round((new Date(last.endedAt).getTime() - new Date(last.startedAt).getTime()) / 1000)));
                      }
                    }
                    return '0m';
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Active Software / Website Focus Indicator */}
          {isWorking && (
            <div className="mt-4 flex items-center justify-between gap-3 bg-indigo-50/70 border border-indigo-100/90 px-4 py-2.5 rounded-xl text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Active Focus:</span>
                <span className="font-bold text-slate-900">{isOnBreak ? 'On Break' : isIdle ? 'Idle / Inactive' : currentAppFocus}</span>
              </div>
              {(currentProfile?.currentWebsiteDomain || currentProfile?.currentWebsite?.domain) && !isIdle && !isOnBreak && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-lg border border-cyan-200">
                  <Globe className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  {currentProfile?.currentWebsiteDomain || currentProfile?.currentWebsite?.domain}
                </span>
              )}
            </div>
          )}

          {/* Metric Grid: Today's Cumulative Totals */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 mt-8 pt-6 border-t border-slate-100 text-center relative z-10">
            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs transition-all hover:bg-slate-50">
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                Active Work Today
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 block tracking-tight font-sans">
                {formatDuration((todayTotals?.todayActiveSeconds ?? currentProfile?.todayActiveSeconds) || 0)}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 mt-1 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {isWorking ? 'Current session: ' + formatDurationExact(liveActiveSeconds) : 'All sessions saved'}
              </span>
            </div>

            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 shadow-2xs transition-all hover:bg-slate-50">
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                Idle Inactivity
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2 block tracking-tight font-sans">
                {formatDuration((todayTotals?.todayIdleSeconds ?? currentProfile?.todayIdleSeconds) || 0)}
              </span>
              <span className="text-[11px] font-semibold text-amber-700 mt-1 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {isWorking ? 'Current session: ' + formatDurationExact(liveIdleSeconds) : 'Away from desk'}
              </span>
            </div>

            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 shadow-2xs transition-all hover:bg-slate-50">
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                Total Breaks
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-2 block tracking-tight font-sans">
                {formatDuration((todayTotals?.todayBreakSeconds ?? currentProfile?.todayBreakSeconds) || 0)}
              </span>
              <span className="text-[11px] font-semibold text-indigo-700 mt-1 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                {isWorking ? 'Current session: ' + formatDurationExact(liveBreakSeconds) : 'Logged breaks'}
              </span>
            </div>

            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 shadow-2xs transition-all hover:bg-slate-50">
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                Today's Total Work Time
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-indigo-900 mt-2 block tracking-tight font-sans">
                {formatDuration((todayTotals?.todayShiftDuration ?? currentProfile?.todayShiftDuration) || 0)}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 mt-1 inline-flex items-center gap-1">
                {completedSessions.length + (isWorking ? 1 : 0)} session{completedSessions.length + (isWorking ? 1 : 0) === 1 ? '' : 's'} recorded today
              </span>
            </div>
          </div>
        </div>

        {/* Today's Completed Attendance History */}
        {completedSessions.length > 0 && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Today's Completed Work Sessions</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Authoritative attendance sessions recorded for today</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {completedSessions.length} Completed Session{completedSessions.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="pb-3 pr-4 font-extrabold">#</th>
                    <th className="pb-3 px-4 font-extrabold">Clock In</th>
                    <th className="pb-3 px-4 font-extrabold">Clock Out</th>
                    <th className="pb-3 px-4 font-extrabold">Work Duration</th>
                    <th className="pb-3 px-4 font-extrabold text-emerald-700">Active Work</th>
                    <th className="pb-3 px-4 font-extrabold text-amber-700">Idle Time</th>
                    <th className="pb-3 px-4 font-extrabold text-indigo-700">Breaks</th>
                    <th className="pb-3 pl-4 font-extrabold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedSessions.map((sess: any, idx: number) => {
                    const startStr = sess.startedAt ? new Date(sess.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                    const endStr = sess.endedAt ? new Date(sess.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                    const dur = sess.durationSeconds != null ? formatDuration(sess.durationSeconds) : '0m';
                    return (
                      <tr key={sess._id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 pr-4 font-bold text-slate-500">Session {idx + 1}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{startStr}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{endStr}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{dur}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">{formatDuration(sess.activeSeconds || 0)}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-600">{formatDuration(sess.idleSeconds || 0)}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{formatDuration(sess.breakSeconds || 0)}</td>
                        <td className="py-3.5 pl-4 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Completed
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2-Column Section: Timeline & Software / Website Tracking */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-4">
            {/* Timeline Date Selector Bar with View Toggle */}
            <div className="bg-white border border-slate-200/90 rounded-2xl px-5 py-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                    Activity Date
                  </span>
                  <span className="font-mono text-xs font-black text-slate-900 mt-0.5 block">
                    {selectedDate}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* View Mode Toggle: Timeline vs Detailed Logs */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold mr-2">
                  <button
                    type="button"
                    onClick={() => setActivityViewTab('timeline')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                      activityViewTab === 'timeline'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Timeline</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityViewTab('logs')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                      activityViewTab === 'logs'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Timestamp Logs ({timelineEvents.length})</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDate(getLocalDateString())}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedDate === getLocalDateString()
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 1);
                    setSelectedDate(d.toISOString().slice(0, 10));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedDate !== getLocalDateString()
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Yesterday
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(e.target.value);
                  }}
                  className="px-3 py-1 text-xs border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {activityViewTab === 'timeline' ? (
              <TimelineVisualizer events={timelineEvents} dateStr={selectedDate} />
            ) : (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Sequential Activity & Timestamp Log
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {timelineEvents.length} intervals recorded
                  </span>
                </div>

                {timelineEvents.length === 0 ? (
                  <p className="text-xs text-slate-400 py-12 text-center font-medium">
                    No activity intervals recorded for {selectedDate}.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {[...timelineEvents].reverse().map((ev, i) => {
                      const isIdleEv = ev.type === 'IDLE_INTERVAL' || (ev.applicationName || '').toLowerCase().includes('idle');
                      const startFormatted = ev.startedAt ? new Date(ev.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
                      const endFormatted = ev.endedAt ? new Date(ev.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs transition-all ${
                            isIdleEv
                              ? 'bg-amber-50/40 border-amber-200/70 hover:bg-amber-50/70'
                              : ev.domain || ev.websiteDomain
                              ? 'bg-cyan-50/40 border-cyan-200/70 hover:bg-cyan-50/70'
                              : 'bg-slate-50/70 border-slate-200/70 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="shrink-0">
                              {isIdleEv ? (
                                <Moon className="w-4 h-4 text-amber-600" />
                              ) : ev.domain || ev.websiteDomain ? (
                                <Globe className="w-4 h-4 text-cyan-600" />
                              ) : (
                                <Monitor className="w-4 h-4 text-indigo-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 truncate">
                                  {isIdleEv ? 'System Inactivity (Away)' : ev.applicationName}
                                </span>
                                {(ev.domain || ev.websiteDomain) && (
                                  <span className="font-mono text-[10px] text-cyan-800 bg-cyan-100/80 px-2 py-0.5 rounded font-semibold truncate">
                                    {ev.domain || ev.websiteDomain}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{startFormatted} → {endFormatted}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`font-mono font-bold text-xs ${isIdleEv ? 'text-amber-700' : 'text-indigo-700'}`}>
                              {formatDuration(ev.durationSeconds)}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {isIdleEv ? 'Idle' : 'Productive'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* My Top Apps */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Software Usage
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {appUsages.filter(
                    (a) =>
                      !a.applicationName.toLowerCase().includes('highp') &&
                      !a.applicationName.toLowerCase().includes('internal workforce') &&
                      !a.applicationName.toLowerCase().includes('highphaus') &&
                      !a.applicationName.toLowerCase().includes('electron')
                  ).length} apps
                </span>
              </div>

              {appUsages.filter(
                (a) =>
                  !a.applicationName.toLowerCase().includes('highp') &&
                  !a.applicationName.toLowerCase().includes('internal workforce') &&
                  !a.applicationName.toLowerCase().includes('highphaus') &&
                  !a.applicationName.toLowerCase().includes('electron')
              ).length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No app activity recorded for {selectedDate}.</p>
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
                      <div key={i} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:bg-slate-50 transition-all">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <Monitor className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="text-slate-900 font-bold truncate max-w-[160px] sm:max-w-[200px]" title={app.applicationName}>
                              {app.applicationName}
                            </span>
                            {app.category && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 shrink-0">
                                {app.category}
                              </span>
                            )}
                          </div>
                          <span className="text-indigo-700 font-mono font-bold text-xs shrink-0">
                            {formatDuration(app.totalSeconds)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {app.lastUsedAt ? (
                              <span>Last active at {new Date(app.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            ) : (
                              <span>Tracked today</span>
                            )}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 font-semibold">
                            {app.percentage ? `${app.percentage}%` : ''}
                          </span>
                        </div>
                        {app.percentage > 0 && (
                          <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, app.percentage)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Websites Visited */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Websites Visited
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {websiteUsages.length} domains
                </span>
              </div>

              {websiteUsages.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No website activity recorded for {selectedDate}.</p>
              ) : (
                <div className="space-y-3">
                  {websiteUsages.map((site, i) => (
                    <div key={i} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-cyan-50/40 border border-cyan-100 hover:bg-cyan-50/70 transition-all">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <Globe className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          <span className="text-slate-900 font-bold truncate max-w-[160px] sm:max-w-[200px]" title={site.domain}>
                            {site.domain}
                          </span>
                          {site.browser && (
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white text-cyan-800 font-bold border border-cyan-200 shrink-0">
                              {site.browser}
                            </span>
                          )}
                        </div>
                        <span className="text-cyan-800 font-mono font-bold text-xs shrink-0">
                          {formatDuration(site.totalSeconds)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-cyan-500" />
                          {site.lastUsedAt ? (
                            <span>Last visited at {new Date(site.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          ) : (
                            <span>Visited today</span>
                          )}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 font-semibold">
                          {site.percentage ? `${site.percentage}%` : ''}
                        </span>
                      </div>
                      {site.percentage > 0 && (
                        <div className="w-full bg-cyan-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, site.percentage)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                  <span>Websites Visited & Exact Timestamps</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Working Hours & Break Durations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
