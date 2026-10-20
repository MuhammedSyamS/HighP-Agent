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
  ArrowRight,
  Download,
  Check,
  AlertCircle,
  X,
  Globe,
  Calendar,
  List,
  Layers,
  History,
  Filter,
  Search,
  Timer
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

  // Full Work & Attendance History State
  const [allHistorySessions, setAllHistorySessions] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [customHistoryDate, setCustomHistoryDate] = useState<string>('');
  const [autoEndNotice, setAutoEndNotice] = useState<string>('');

  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [autoDownloaded, setAutoDownloaded] = useState(false);

  // Side navigation state: 'history' | 'tracking'
  const [sideNav, setSideNav] = useState<'history' | 'tracking'>('history');

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
      const [empRes, timelineRes, appRes, webRes, liveRes, attendanceRes] = await Promise.all([
        api.get(`/employees/${empId}`),
        api.get(`/activity/${empId}/timeline?date=${queryDate}`),
        api.get(`/applications/usage/${empId}?date=${queryDate}`),
        api.get(`/applications/websites/${empId}?date=${queryDate}`).catch(() => null),
        api.get(`/employees/${empId}/live`).catch(() => null),
        api.get(`/attendance?limit=200`).catch(() => null)
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

      if (attendanceRes?.data?.data && Array.isArray(attendanceRes.data.data)) {
        setAllHistorySessions(attendanceRes.data.data);
      }
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
      if (isIdleRef.current) {
        isIdleRef.current = false;
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
  const liveActiveRef = React.useRef(liveActiveSeconds);
  const liveIdleRef = React.useRef(liveIdleSeconds);

  useEffect(() => {
    isWorkingRef.current = isWorking;
  }, [isWorking]);

  useEffect(() => {
    isOnBreakRef.current = isOnBreak;
  }, [isOnBreak]);

  useEffect(() => {
    isIdleRef.current = isIdle;
  }, [isIdle]);

  useEffect(() => {
    liveActiveRef.current = liveActiveSeconds;
  }, [liveActiveSeconds]);

  useEffect(() => {
    liveIdleRef.current = liveIdleSeconds;
  }, [liveIdleSeconds]);

  // 1-Second Live Local Ticker with strict mutual exclusion
  useEffect(() => {
    if (!isWorking) return;

    const ticker = setInterval(() => {
      // 1-minute (60-second) inactivity threshold
      const idleMs = Date.now() - lastActivityRef.current;
      const isDesktopIdle = currentProfile?.currentStatus === 'IDLE';
      const nowIdle = isDesktopIdle || (idleMs >= 60 * 1000);
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
          idleSeconds: idleTimeSeconds,
          ...(!isDesktopLinked ? {
            totalActiveSeconds: liveActiveRef.current,
            totalIdleSeconds: liveIdleRef.current
          } : {})
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

  const formatShiftDate = (dStr: string) => {
    if (!dStr) return { formatted: '—', tag: '', itemDate: '' };
    try {
      const d = new Date(dStr);
      const today = getLocalDateString();
      const dYest = new Date();
      dYest.setDate(dYest.getDate() - 1);
      const yesterday = getLocalDateString(dYest);
      const itemDate = getLocalDateString(d);

      let tag = '';
      if (itemDate === today) tag = 'Today';
      else if (itemDate === yesterday) tag = 'Yesterday';

      const formatted = d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      return { formatted, tag, itemDate };
    } catch {
      return { formatted: dStr, tag: '', itemDate: '' };
    }
  };

  const filteredHistory = React.useMemo(() => {
    const today = getLocalDateString();
    const dYest = new Date();
    dYest.setDate(dYest.getDate() - 1);
    const yesterday = getLocalDateString(dYest);
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const monthAgo = new Date(Date.now() - 30 * 86400000);

    let list = [...allHistorySessions];

    // If currently active work session is running, ensure it appears live at top
    if (isWorking && currentSession?.startedAt) {
      const alreadyPresent = list.some((s: any) => s._id === currentSession._id || (s.status === 'ACTIVE' && s.date === today));
      if (!alreadyPresent) {
        list.unshift({
          _id: currentSession._id || 'live-current',
          date: today,
          startedAt: currentSession.startedAt,
          endedAt: null,
          durationSeconds: liveActiveSeconds + liveIdleSeconds + liveBreakSeconds,
          activeSeconds: liveActiveSeconds,
          idleSeconds: liveIdleSeconds,
          breakSeconds: liveBreakSeconds,
          status: 'ACTIVE',
          endReason: 'Shift In Progress'
        });
      }
    }

    return list.filter((item: any) => {
      const itemDate = item.date || (item.startedAt ? getLocalDateString(new Date(item.startedAt)) : '');
      if (historyFilter === 'today') {
        return itemDate === today;
      }
      if (historyFilter === 'yesterday') {
        return itemDate === yesterday;
      }
      if (historyFilter === 'week') {
        return item.startedAt && new Date(item.startedAt) >= weekAgo;
      }
      if (historyFilter === 'month') {
        return item.startedAt && new Date(item.startedAt) >= monthAgo;
      }
      if (historyFilter === 'custom' && customHistoryDate) {
        return itemDate === customHistoryDate;
      }
      return true; // 'all'
    });
  }, [allHistorySessions, historyFilter, customHistoryDate, isWorking, currentSession, liveActiveSeconds, liveIdleSeconds, liveBreakSeconds]);

  const historyStats = React.useMemo(() => {
    const totalShifts = filteredHistory.length;
    let totalSec = 0;
    let activeSec = 0;
    let idleSec = 0;
    let breakSec = 0;
    let autoEndedCount = 0;

    filteredHistory.forEach((s: any) => {
      let dur = s.durationSeconds;
      if (dur == null || dur <= 0) {
        if (s.startedAt && s.endedAt) {
          dur = Math.max(0, Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 1000));
        } else if (s.startedAt && s.status === 'ACTIVE') {
          dur = Math.max(0, Math.round((Date.now() - new Date(s.startedAt).getTime()) / 1000));
        } else {
          dur = (s.activeSeconds || 0) + (s.idleSeconds || 0) + (s.breakSeconds || 0);
        }
      }
      totalSec += dur;
      activeSec += (s.activeSeconds || 0);
      idleSec += (s.idleSeconds || 0);
      breakSec += (s.breakSeconds || 0);

      const r = (s.endReason || '').toLowerCase();
      if (r.includes('5:00 pm') || r.includes('5 pm') || r.includes('shift conclusion')) {
        autoEndedCount++;
      }
    });

    return { totalShifts, totalSec, activeSec, idleSec, breakSec, autoEndedCount };
  }, [filteredHistory]);

  // Check if today's shift has already been completed/ended
  const hasCompletedShiftToday = Boolean(
    !isWorking && (completedSessions.length > 0 || currentProfile?.todayAttendanceStatus === 'COMPLETED')
  );

  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    const minTicker = setInterval(() => {
      const d = new Date();
      setCurrentMinutes(d.getHours() * 60 + d.getMinutes());
    }, 10000);
    return () => clearInterval(minTicker);
  }, []);

  const isBefore830AM = currentMinutes < (8 * 60 + 30);
  const isPast5PM = currentMinutes >= (17 * 60);
  const canStartWork = !isWorking && !hasCompletedShiftToday && !isBefore830AM && !isPast5PM;

  const handleStartWork = async () => {
    setActionError('');
    if (hasCompletedShiftToday) {
      setActionError('You have already completed your work session for today. Next work shift starts tomorrow at 8:30 AM.');
      return;
    }
    if (isBefore830AM) {
      setActionError('Work sessions can only be started from 8:30 AM onwards. Shift hours are 9:00 AM – 5:00 PM.');
      return;
    }
    if (isPast5PM) {
      setActionError('Today\'s work shift concluded at 5:00 PM. Next work session starts tomorrow at 8:30 AM.');
      return;
    }

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

  const handleAutoEndWorkAt5PM = useCallback(async () => {
    if (!isWorkingRef.current) return;
    console.log('[Auto-End] 5:00 PM shift end reached. Concluding session automatically.');

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

    setAutoEndNotice('Your work session has automatically ended at 5:00 PM (scheduled shift conclusion). Attendance and duration have been saved. Work starts manually at 9:00 AM.');

    try {
      await sendHeartbeat(ActivityState.OFFLINE, 1);
      await api.post('/attendance/end', { endReason: 'Auto-ended at 5:00 PM (Shift Conclusion)' });
      await fetchMyData();
      await refreshAuth();
    } catch (err: any) {
      console.warn('[Auto-End] End work warning:', err);
      await fetchMyData();
    }
  }, [sendHeartbeat, fetchMyData, refreshAuth]);

  // Periodic 5:00 PM Shift Conclusion Check (Shift Hours: 9:00 AM - 5:00 PM)
  useEffect(() => {
    if (!isWorking) return;

    const checkAutoEndAt5PM = () => {
      const now = new Date();
      const startIso = currentSession?.startedAt || currentProfile?.currentShiftStartedAt;
      const startedBefore5PM = !startIso || (new Date(startIso).getHours() < 17);
      if (now.getHours() >= 17 && startedBefore5PM && isWorkingRef.current) {
        handleAutoEndWorkAt5PM();
      }
    };

    checkAutoEndAt5PM();
    const interval = setInterval(checkAutoEndAt5PM, 2000);
    return () => clearInterval(interval);
  }, [isWorking, currentSession?.startedAt, currentProfile?.currentShiftStartedAt, handleAutoEndWorkAt5PM]);

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

        {autoEndNotice && (
          <div className="flex items-center justify-between p-4.5 rounded-2xl bg-indigo-50/95 border border-indigo-200 text-indigo-950 text-xs sm:text-sm font-semibold animate-fade-in shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold block text-indigo-950 text-sm">Shift Concluded at 5:00 PM</span>
                <span className="text-xs text-indigo-800 font-medium">{autoEndNotice}</span>
              </div>
            </div>
            <button
              onClick={() => setAutoEndNotice('')}
              className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-700 transition-colors shrink-0"
              title="Dismiss notification"
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Current Attendance State
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="text-xs font-semibold text-slate-500">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Standard 9:00 AM - 5:00 PM Shift Policy Pills */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  Work Hours: 9:00 AM – 5:00 PM
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  <Play className="w-3 h-3 fill-current text-emerald-600 shrink-0" />
                  Start: Manual Clock In
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs">
                  <Square className="w-3 h-3 fill-current text-indigo-600 shrink-0" />
                  End: Auto @ 5:00 PM
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2.5 tracking-tight font-sans">
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
                    ? 'You are currently on break. Use your HighP Desktop Agent to resume your work session.'
                    : 'Your session is actively streaming from your HighP Desktop Agent.'
                  : 'Start your shift, pause for breaks, and clock out directly using the HighP Desktop Agent installed on your PC.'}
              </p>
            </div>

            {/* Desktop Agent Exclusivity Status Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 relative z-10 shrink-0 w-full lg:w-auto">
              <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto">
                <div className={`px-5 py-3 rounded-2xl border font-bold text-xs flex items-center gap-3 shadow-2xs transition-all ${
                  isWorking
                    ? isOnBreak
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    isWorking
                      ? isOnBreak
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-emerald-500 animate-pulse'
                      : 'bg-slate-400'
                  }`} />
                  <div className="flex flex-col">
                    <span className="font-extrabold uppercase tracking-wider text-[11px]">
                      {isWorking
                        ? isOnBreak
                          ? 'On Break (Desktop Agent)'
                          : 'Live Session Streaming'
                        : 'Agent Standby'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Tracked exclusively via HighP Desktop Agent
                    </span>
                  </div>
                </div>
                <span className="text-[10.5px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  Clock-in, breaks & clock-out are controlled in your Desktop Agent
                </span>
              </div>
            </div>
          </div>

          {/* ── AUTHORITATIVE ATTENDANCE & SHIFT HUB ── */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-6 relative z-10">
            {/* Main Attendance Card */}
            <div className={`p-6 sm:p-7 rounded-3xl border transition-all shadow-sm ${
              isWorking
                ? 'bg-gradient-to-br from-white via-emerald-50/20 to-white border-emerald-200/80 shadow-emerald-500/5'
                : completedSessions.length > 0
                ? 'bg-gradient-to-br from-white via-indigo-50/20 to-white border-indigo-200/80 shadow-indigo-500/5'
                : 'bg-white border-slate-200/90'
            }`}>
              {/* Header row: Title & Live Attendance Pill */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm shrink-0 transition-transform ${
                    isWorking
                      ? 'bg-emerald-600 text-white shadow-emerald-600/25 scale-105'
                      : completedSessions.length > 0
                      ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        Today's Work & Attendance Session
                      </h3>
                      <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {todayStr}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Real-time shift telemetry verified and tracked directly through your HighP Desktop Agent
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {isWorking ? (
                    isOnBreak ? (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                        <Coffee className="w-4 h-4 text-amber-600" />
                        <span>ON BREAK</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span>PRESENT • WORKING NOW</span>
                      </span>
                    )
                  ) : completedSessions.length > 0 ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      <span>SHIFT CONCLUDED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black bg-slate-100 text-slate-600 border border-slate-200">
                      <Moon className="w-4 h-4 text-slate-400" />
                      <span>STANDBY (NOT CLOCKED IN)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Feature KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {/* Clock In Time */}
                <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 p-4.5 rounded-2xl transition-all">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Start Work Time (Clock In)
                    </span>
                    <Clock className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">
                    {(() => {
                      const startTime = currentSession?.startedAt || todayTotals?.firstSessionStart || currentProfile?.currentShiftStartedAt;
                      if (startTime) {
                        return new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      }
                      if (lastCompletedSession?.startedAt) {
                        return new Date(lastCompletedSession.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }
                      return isWorking ? 'Marking now...' : '—';
                    })()}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1.5 flex items-center gap-1">
                    {isWorking ? (
                      <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> First clock-in today
                      </span>
                    ) : lastCompletedSession ? (
                      'Last logged shift'
                    ) : (
                      'Launch agent to clock in'
                    )}
                  </p>
                </div>

                {/* Current Working Duration */}
                <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 p-4.5 rounded-2xl transition-all">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      How Long Working (Session)
                    </span>
                    <Timer className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700 tracking-tight">
                    {(() => {
                      if (isWorking) {
                        const startTime = currentSession?.startedAt || currentProfile?.currentShiftStartedAt;
                        if (startTime) {
                          const elapsedSec = Math.max(0, Math.round((Date.now() - new Date(startTime).getTime()) / 1000));
                          return formatDurationExact(elapsedSec);
                        }
                        return formatDurationExact(liveActiveSeconds + liveIdleSeconds + liveBreakSeconds);
                      }
                      if (lastCompletedSession && lastCompletedSession.durationSeconds != null) {
                        return formatDuration(lastCompletedSession.durationSeconds);
                      }
                      return '00:00:00';
                    })()}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1.5 flex items-center gap-1">
                    {isWorking ? (
                      <span className="text-emerald-600 font-bold inline-flex items-center gap-1 animate-pulse">
                        ● Ticking live shift duration
                      </span>
                    ) : (
                      'Current session time'
                    )}
                  </p>
                </div>

                {/* Total Day Shift Time */}
                <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 p-4.5 rounded-2xl transition-all">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Total Work Time Today
                    </span>
                    <Zap className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-indigo-900 tracking-tight">
                    {formatDuration((todayTotals?.todayShiftDuration ?? currentProfile?.todayShiftDuration) || (liveActiveSeconds + liveIdleSeconds + liveBreakSeconds))}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1.5 flex items-center gap-1">
                    {completedSessions.length + (isWorking ? 1 : 0)} session{completedSessions.length + (isWorking ? 1 : 0) === 1 ? '' : 's'} recorded today
                  </p>
                </div>

                {/* Active Application / Focus */}
                <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 p-4.5 rounded-2xl transition-all">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Active Application Focus
                    </span>
                    <Monitor className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-slate-900 truncate tracking-tight" title={isOnBreak ? 'On Break' : isIdle ? 'Idle / Inactive' : currentAppFocus}>
                    {isOnBreak ? '☕ On Break' : isIdle ? '⏳ Workstation Idle' : currentAppFocus}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 truncate">
                    {(currentProfile?.currentWebsiteDomain || currentProfile?.currentWebsite?.domain) && !isIdle && !isOnBreak ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 truncate">
                        <Globe className="w-3 h-3 text-cyan-600 shrink-0" />
                        <span className="truncate">{currentProfile?.currentWebsiteDomain || currentProfile?.currentWebsite?.domain}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-500">
                        {isWorking ? 'Foreground app monitored' : 'Standby'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Work Balance Ratio Bar */}
              {isWorking && (
                <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-600" />
                      Daily Work Ratio Balance
                    </span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {Math.round(((liveActiveSeconds) / Math.max(1, (liveActiveSeconds + liveIdleSeconds + liveBreakSeconds))) * 100)}% Focus Rate
                    </span>
                  </div>

                  {/* Horizontal Segmented Bar */}
                  {(() => {
                    const totalSec = Math.max(1, liveActiveSeconds + liveIdleSeconds + liveBreakSeconds);
                    const actPct = Math.round((liveActiveSeconds / totalSec) * 100);
                    const idlPct = Math.round((liveIdleSeconds / totalSec) * 100);
                    const brkPct = Math.max(0, 100 - actPct - idlPct);

                    return (
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex shadow-inner">
                        <div
                          className="bg-emerald-500 transition-all duration-500"
                          style={{ width: `${actPct}%` }}
                          title={`Active: ${formatDuration(liveActiveSeconds)} (${actPct}%)`}
                        />
                        <div
                          className="bg-amber-400 transition-all duration-500"
                          style={{ width: `${idlPct}%` }}
                          title={`Idle: ${formatDuration(liveIdleSeconds)} (${idlPct}%)`}
                        />
                        <div
                          className="bg-indigo-400 transition-all duration-500"
                          style={{ width: `${brkPct}%` }}
                          title={`Break: ${formatDuration(liveBreakSeconds)} (${brkPct}%)`}
                        />
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2 pt-1 font-medium font-mono">
                    <span className="inline-flex items-center gap-1.5 text-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Active: {formatDuration(liveActiveSeconds)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-amber-800">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Idle: {formatDuration(liveIdleSeconds)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-indigo-800">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      Break: {formatDuration(liveBreakSeconds)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Metric Grid: Today's Cumulative Totals */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 text-center">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs transition-all hover:bg-slate-50">
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

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs transition-all hover:bg-slate-50">
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

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs transition-all hover:bg-slate-50">
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

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs transition-all hover:bg-slate-50">
                <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                  Today's Total Shift Time
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
        </div>



        {/* ── Side Navigation: History / Tracking ── */}
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">

          {/* Side Nav Bar */}
          <div className="lg:w-52 shrink-0">
            <nav className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-sm flex lg:flex-col gap-1.5">
              <button
                id="emp-sidenav-history"
                type="button"
                onClick={() => setSideNav('history')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm transition-all w-full text-left ${
                  sideNav === 'history'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <History className="w-4 h-4 shrink-0" />
                <span>Work History</span>
              </button>
              <button
                id="emp-sidenav-tracking"
                type="button"
                onClick={() => setSideNav('tracking')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm transition-all w-full text-left ${
                  sideNav === 'tracking'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Activity className="w-4 h-4 shrink-0" />
                <span>Activity Tracking</span>
              </button>
            </nav>
          </div>

          {/* Main Panel */}
          <div className="flex-1 min-w-0">

        {/* ── HISTORY PANEL ── */}
        {sideNav === 'history' && (
          <div id="emp-history-panel">
        {/* Full Work & Shift Attendance History Component */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
          {/* Header & Filter Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200/70 flex items-center justify-center shrink-0 shadow-2xs">
                <History className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    My Full Attendance & Work History
                  </h3>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {filteredHistory.length} Record{filteredHistory.length === 1 ? '' : 's'}
                  </span>
                  {isWorking && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Shift Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Complete records of started work times, clock-out times, durations, active work, and shift status
                </p>
              </div>
            </div>

            {/* Quick Filter Controls & Date Picker */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setHistoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    historyFilter === 'all'
                      ? 'bg-white text-indigo-700 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All History
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('today')}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    historyFilter === 'today'
                      ? 'bg-white text-indigo-700 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('yesterday')}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    historyFilter === 'yesterday'
                      ? 'bg-white text-indigo-700 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('week')}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    historyFilter === 'week'
                      ? 'bg-white text-indigo-700 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Past 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('month')}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    historyFilter === 'month'
                      ? 'bg-white text-indigo-700 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  This Month
                </button>
              </div>

              {/* Specific Date Picker */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={customHistoryDate}
                  onChange={(e) => {
                    setCustomHistoryDate(e.target.value);
                    if (e.target.value) setHistoryFilter('custom');
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
                  title="Filter by specific date"
                />
                {customHistoryDate && (
                  <button
                    onClick={() => {
                      setCustomHistoryDate('');
                      setHistoryFilter('all');
                    }}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                    title="Clear date filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Aggregated Filter Summary Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Shifts Recorded
              </span>
              <span className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 block font-sans">
                {historyStats.totalShifts}
              </span>
            </div>
            <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Work Duration
              </span>
              <span className="text-lg sm:text-xl font-black text-indigo-700 mt-0.5 block font-mono">
                {formatDuration(historyStats.totalSec)}
              </span>
            </div>
            <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Productive Active Time
              </span>
              <span className="text-lg sm:text-xl font-black text-emerald-600 mt-0.5 block font-mono">
                {formatDuration(historyStats.activeSec)}
              </span>
            </div>
            <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Auto-Ended @ 5:00 PM
              </span>
              <span className="text-lg sm:text-xl font-black text-slate-800 mt-0.5 block font-sans">
                {historyStats.autoEndedCount} Shift{historyStats.autoEndedCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50/60 rounded-2xl border border-slate-200/70">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No shift history found for this view</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {historyFilter === 'yesterday'
                  ? 'No attendance records logged for yesterday.'
                  : historyFilter === 'today'
                  ? 'No shifts recorded for today yet. Start work on your HighP Desktop Agent to begin your day.'
                  : 'Start work on your HighP Desktop Agent to record attendance.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setHistoryFilter('all');
                  setCustomHistoryDate('');
                }}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-600 shadow-2xs hover:bg-slate-50"
              >
                Reset Filter to All
              </button>
            </div>
          ) : (
            <>
              {/* Mobile View: High-Density Card List (< 768px) */}
              <div className="block md:hidden space-y-3.5">
                {filteredHistory.map((sess: any, idx: number) => {
                  const dateInfo = formatShiftDate(sess.startedAt || sess.date);
                  const startStr = sess.startedAt
                    ? new Date(sess.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—';
                  const isLive = sess.status === 'ACTIVE' || !sess.endedAt;
                  const endStr = isLive
                    ? 'Working Now (Live)'
                    : sess.endedAt
                    ? new Date(sess.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—';

                  let durSec = sess.durationSeconds;
                  if (durSec == null || durSec <= 0) {
                    if (sess.startedAt && sess.endedAt) {
                      durSec = Math.max(0, Math.round((new Date(sess.endedAt).getTime() - new Date(sess.startedAt).getTime()) / 1000));
                    } else if (sess.startedAt && isLive) {
                      durSec = Math.max(0, Math.round((Date.now() - new Date(sess.startedAt).getTime()) / 1000));
                    } else {
                      durSec = (sess.activeSeconds || 0) + (sess.idleSeconds || 0) + (sess.breakSeconds || 0);
                    }
                  }

                  const is5PMEnd = (sess.endReason || '').toLowerCase().includes('5:00 pm') ||
                    (sess.endReason || '').toLowerCase().includes('5 pm') ||
                    (sess.endReason || '').toLowerCase().includes('shift conclusion');

                  return (
                    <div
                      key={sess._id || idx}
                      className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all space-y-3"
                    >
                      {/* Card Header: Date & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900">{dateInfo.formatted}</span>
                          {dateInfo.tag && (
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                dateInfo.tag === 'Today'
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {dateInfo.tag}
                            </span>
                          )}
                        </div>

                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Now
                          </span>
                        ) : is5PMEnd ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                            Auto-Ended @ 5 PM
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Completed
                          </span>
                        )}
                      </div>

                      {/* Work Timing Arrow Bar */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Clock In (Start)
                          </span>
                          <span className="font-mono font-black text-slate-900 text-sm">{startStr}</span>
                        </div>

                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                        <div className="min-w-0 text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Clock Out (End)
                          </span>
                          <span className={`font-mono font-black text-sm ${isLive ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {endStr}
                          </span>
                        </div>
                      </div>

                      {/* Duration & Breakdown Pills */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Total Shift:
                          </span>
                          <span className="font-mono font-black text-indigo-700 text-xs bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                            {formatDuration(durSec)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold">
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100" title="Active Productive Time">
                            {formatDuration(sess.activeSeconds || 0)}
                          </span>
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100" title="Idle Time">
                            {formatDuration(sess.idleSeconds || 0)}
                          </span>
                          <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100" title="Breaks">
                            {formatDuration(sess.breakSeconds || 0)}
                          </span>
                        </div>
                      </div>

                      {sess.endReason && (
                        <div className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-100">
                          Note: {sess.endReason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tablet & Desktop View: High-Density Structured Table (>= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      <th className="pb-3 pr-3 font-extrabold">Date / Day</th>
                      <th className="pb-3 px-3 font-extrabold">Clock In (Start)</th>
                      <th className="pb-3 px-3 font-extrabold">Clock Out (End)</th>
                      <th className="pb-3 px-3 font-extrabold text-indigo-700">Total Duration</th>
                      <th className="pb-3 px-3 font-extrabold text-emerald-700">Active Work</th>
                      <th className="pb-3 px-3 font-extrabold text-amber-700">Idle Time</th>
                      <th className="pb-3 px-3 font-extrabold text-indigo-700">Breaks</th>
                      <th className="pb-3 pl-3 font-extrabold text-right">Shift Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistory.map((sess: any, idx: number) => {
                      const dateInfo = formatShiftDate(sess.startedAt || sess.date);
                      const startStr = sess.startedAt
                        ? new Date(sess.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—';
                      const isLive = sess.status === 'ACTIVE' || !sess.endedAt;
                      const endStr = isLive
                        ? 'Working Now (Live)'
                        : sess.endedAt
                        ? new Date(sess.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—';

                      let durSec = sess.durationSeconds;
                      if (durSec == null || durSec <= 0) {
                        if (sess.startedAt && sess.endedAt) {
                          durSec = Math.max(0, Math.round((new Date(sess.endedAt).getTime() - new Date(sess.startedAt).getTime()) / 1000));
                        } else if (sess.startedAt && isLive) {
                          durSec = Math.max(0, Math.round((Date.now() - new Date(sess.startedAt).getTime()) / 1000));
                        } else {
                          durSec = (sess.activeSeconds || 0) + (sess.idleSeconds || 0) + (sess.breakSeconds || 0);
                        }
                      }

                      const is5PMEnd = (sess.endReason || '').toLowerCase().includes('5:00 pm') ||
                        (sess.endReason || '').toLowerCase().includes('5 pm') ||
                        (sess.endReason || '').toLowerCase().includes('shift conclusion');

                      return (
                        <tr key={sess._id || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 pr-3 font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{dateInfo.formatted}</span>
                              {dateInfo.tag && (
                                <span
                                  className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                    dateInfo.tag === 'Today'
                                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {dateInfo.tag}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {startStr}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                              <span className={isLive ? 'text-emerald-700' : 'text-slate-800'}>{endStr}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                            {formatDuration(durSec)}
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-emerald-600 whitespace-nowrap">
                            {formatDuration(sess.activeSeconds || 0)}
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-amber-600 whitespace-nowrap">
                            {formatDuration(sess.idleSeconds || 0)}
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-indigo-600 whitespace-nowrap">
                            {formatDuration(sess.breakSeconds || 0)}
                          </td>
                          <td className="py-3.5 pl-3 text-right whitespace-nowrap">
                            {isLive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Working Now
                              </span>
                            ) : is5PMEnd ? (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                                title={sess.endReason || 'Shift concluded at 5:00 PM'}
                              >
                                <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                                Auto-Ended @ 5 PM
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                                title={sess.endReason || 'Completed session'}
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
          </div>
        )}




          {/* ── TRACKING PANEL ── */}
          {sideNav === 'tracking' && (
            <div id="emp-tracking-panel">
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
                      !a.applicationName.toLowerCase().includes('electron') &&
                      a.applicationName.toLowerCase() !== 'unknown application' &&
                      a.applicationName.toLowerCase() !== 'system idle' &&
                      a.applicationName.toLowerCase() !== 'system'
                  ).length} apps
                </span>
              </div>

              {appUsages.filter(
                (a) =>
                  !a.applicationName.toLowerCase().includes('highp') &&
                  !a.applicationName.toLowerCase().includes('internal workforce') &&
                  !a.applicationName.toLowerCase().includes('highphaus') &&
                  !a.applicationName.toLowerCase().includes('electron') &&
                  a.applicationName.toLowerCase() !== 'unknown application' &&
                  a.applicationName.toLowerCase() !== 'system idle' &&
                  a.applicationName.toLowerCase() !== 'system'
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
                        !a.applicationName.toLowerCase().includes('electron') &&
                        a.applicationName.toLowerCase() !== 'unknown application' &&
                        a.applicationName.toLowerCase() !== 'system idle' &&
                        a.applicationName.toLowerCase() !== 'system'
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
        </div>
        )}
            </div> {/* /main-panel */}
          </div> {/* /side-nav */}

      </main>
    </div>
  );
}

