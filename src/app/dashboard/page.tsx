'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/Header';
import { StatusBadge } from '../../components/StatusBadge';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { formatDuration } from '../../lib/utils';
import { getDesktopAgentDownloadUrl } from '../../lib/constants';
import {
  Users,
  Activity,
  Clock,
  Search,
  UserPlus,
  ArrowUpRight,
  Monitor,
  CheckCircle2,
  X,
  LayoutGrid,
  List,
  Sparkles,
  Zap,
  TrendingUp,
  Download,
  Laptop,
  Radio,
  Briefcase,
  ChevronRight,
  Shield,
  Layers,
  Globe,
  Code2,
  Palette,
  Terminal,
  Folder,
  MessageSquare,
  FileSpreadsheet,
  Compass,
  Cpu
} from 'lucide-react';
import { ActivityState, IDashboardOverview, UserRole } from '@highp/shared';

// Helper to provide brand-aware application icons formatted for light theme
const getAppVisuals = (appName?: string) => {
  const name = (appName || '').toLowerCase();
  if (name.includes('brave')) {
    return { icon: Compass, color: 'text-orange-700 bg-orange-50 border-orange-200' };
  }
  if (name.includes('chrome')) {
    return { icon: Globe, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }
  if (name.includes('edge')) {
    return { icon: Globe, color: 'text-sky-700 bg-sky-50 border-sky-200' };
  }
  if (name.includes('firefox')) {
    return { icon: Globe, color: 'text-amber-700 bg-amber-50 border-amber-200' };
  }
  if (name.includes('code') || name.includes('antigravity') || name.includes('studio') || name.includes('cursor')) {
    return { icon: Code2, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
  }
  if (name.includes('figma') || name.includes('photoshop') || name.includes('illustrator') || name.includes('blender')) {
    return { icon: Palette, color: 'text-purple-700 bg-purple-50 border-purple-200' };
  }
  if (name.includes('terminal') || name.includes('powershell') || name.includes('cmd') || name.includes('bash')) {
    return { icon: Terminal, color: 'text-slate-800 bg-slate-100 border-slate-200' };
  }
  if (name.includes('slack') || name.includes('teams') || name.includes('discord')) {
    return { icon: MessageSquare, color: 'text-rose-700 bg-rose-50 border-rose-200' };
  }
  if (name.includes('excel') || name.includes('sheet') || name.includes('word') || name.includes('notion')) {
    return { icon: FileSpreadsheet, color: 'text-blue-700 bg-blue-50 border-blue-200' };
  }
  if (name.includes('explorer')) {
    return { icon: Folder, color: 'text-amber-700 bg-amber-50 border-amber-200' };
  }
  return { icon: Monitor, color: 'text-slate-700 bg-slate-100 border-slate-200' };
};

export default function DashboardOverviewPage() {
  const [overview, setOverview] = useState<IDashboardOverview>(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const saved = localStorage.getItem('highp_dashboard_overview');
      const savedDate = localStorage.getItem('highp_dashboard_date');
      if (saved && savedDate === today) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      totalEmployees: 0,
      activeNow: 0,
      idleNow: 0,
      onBreakNow: 0,
      offlineNow: 0,
      currentlyWorking: 0,
      totalActiveSecondsToday: 0,
      totalIdleSecondsToday: 0,
      totalBreakSecondsToday: 0
    };
  });

  useEffect(() => {
    try {
      if (overview.totalActiveSecondsToday > 0 || overview.currentlyWorking > 0) {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('highp_dashboard_date', today);
        localStorage.setItem('highp_dashboard_overview', JSON.stringify(overview));
      }
    } catch {}
  }, [overview]);

  const [employees, setEmployees] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isLoading, setLoading] = useState(true);

  // Live Stream Events Feed
  const [recentLiveEvents, setRecentLiveEvents] = useState<
    Array<{
      id: any;
      name: string;
      status: string;
      app: string;
      time: string;
      isLiveNow?: boolean;
      durationSeconds?: number;
      employeeCode?: string;
    }>
  >([]);

  // Section 20 & 21: Application Activity & Analytics State
  const [activityRecords, setActivityRecords] = useState<any[]>([]);
  const [activityAppFilter, setActivityAppFilter] = useState('');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState('ALL');
  const [activityEmployeeFilter, setActivityEmployeeFilter] = useState('ALL');
  const [activityDateFilter, setActivityDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [activityStatusFilter, setActivityStatusFilter] = useState('ALL');
  const [appUsageAnalytics, setAppUsageAnalytics] = useState<any[]>([]);
  const [totalAppUsageSeconds, setTotalAppUsageSeconds] = useState(0);
  const [isActivityLoading, setIsActivityLoading] = useState(false);

  // Add Employee Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [newTitle, setNewTitle] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchActivityData = useCallback(async () => {
    setIsActivityLoading(true);
    try {
      const [actRes, usageRes] = await Promise.all([
        api.get('/activity', {
          params: {
            date: activityDateFilter,
            category: activityCategoryFilter !== 'ALL' ? activityCategoryFilter : undefined,
            application: activityAppFilter.trim() || undefined,
            employeeId: activityEmployeeFilter !== 'ALL' ? activityEmployeeFilter : undefined,
            status: activityStatusFilter !== 'ALL' ? activityStatusFilter : undefined,
            limit: 50
          }
        }),
        api.get(`/applications/usage?date=${activityDateFilter}`)
      ]);

      if (actRes.data?.data && Array.isArray(actRes.data.data)) {
        setActivityRecords(actRes.data.data);
      }
      if (usageRes.data?.data) {
        setAppUsageAnalytics(usageRes.data.data.applications || []);
        setTotalAppUsageSeconds(usageRes.data.data.totalTimeOverall || 0);
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching activity/usage:', err);
    } finally {
      setIsActivityLoading(false);
    }
  }, [activityDateFilter, activityCategoryFilter, activityAppFilter, activityEmployeeFilter, activityStatusFilter]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [overviewRes, employeesRes, activityRes] = await Promise.all([
        api.get('/employees/overview'),
        api.get('/employees'),
        api.get('/activity?limit=12')
      ]);

      if (overviewRes.data?.data) {
        setOverview(overviewRes.data.data);
      }
      if (employeesRes.data?.data) {
        setEmployees(employeesRes.data.data);
      }
      if (activityRes.data?.data && Array.isArray(activityRes.data.data)) {
        const streamItems = activityRes.data.data
          .filter((evt: any) => evt.applicationName && !evt.applicationName.toLowerCase().includes('highp'))
          .map((evt: any) => ({
            id: evt.eventId || evt._id,
            name: evt.employeeId?.userId
              ? `${evt.employeeId.userId.firstName || ''} ${evt.employeeId.userId.lastName || ''}`.trim() || 'Employee'
              : 'Employee',
            employeeCode: evt.employeeId?.employeeCode || '',
            status: evt.isLiveNow ? 'ACTIVE' : evt.type === 'IDLE_INTERVAL' ? 'IDLE' : 'ACTIVE',
            app: evt.applicationName || 'Active Workstation',
            durationSeconds: evt.todayTotalSeconds || evt.durationSeconds || 0,
            time: new Date(evt.startedAt || evt.endedAt || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            }),
            isLiveNow: !!evt.isLiveNow
          }));
        setRecentLiveEvents(streamItems);
      }
    } catch (err) {
      console.error('[Dashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  useEffect(() => {
    // Subscribe to real-time Socket.IO events
    const socket = getSocket();
    if (socket) {
      const handleStatusChange = (data: any) => {
        setEmployees((prev) => {
          const updatedList = prev.map((emp) => {
            if (emp._id === data.employeeId) {
              return {
                ...emp,
                currentStatus: data.status,
                currentApplication: data.currentApplication ?? emp.currentApplication,
                lastActiveAt: data.lastActiveAt,
                currentWebsite: data.currentWebsite !== undefined ? data.currentWebsite : emp.currentWebsite,
                todayActiveSeconds: data.todayActiveSeconds ?? emp.todayActiveSeconds,
                todayIdleSeconds: data.todayIdleSeconds ?? emp.todayIdleSeconds,
                todayBreakSeconds: data.todayBreakSeconds ?? emp.todayBreakSeconds
              };
            }
            return emp;
          });

          // Recompute overview counts
          let active = 0;
          let idle = 0;
          let onBreak = 0;
          let offline = 0;
          for (const item of updatedList) {
            if (item.currentStatus === 'ACTIVE') active++;
            else if (item.currentStatus === 'IDLE') idle++;
            else if (item.currentStatus === 'BREAK') onBreak++;
            else offline++;
          }
          setOverview((o) => ({
            ...o,
            activeNow: active,
            idleNow: idle,
            onBreakNow: onBreak,
            offlineNow: offline,
            currentlyWorking: active + idle
          }));

          const targetEmp = prev.find((e) => e._id === data.employeeId);
          if (targetEmp && data.currentApplication) {
            const empName = `${targetEmp.userId?.firstName || 'Employee'} ${targetEmp.userId?.lastName || ''}`.trim();
            setRecentLiveEvents((rev) => [
              {
                id: Date.now(),
                name: empName,
                employeeCode: targetEmp.employeeCode || '',
                status: data.status,
                app: data.currentApplication,
                durationSeconds: data.todayActiveSeconds || 1,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isLiveNow: data.status === 'ACTIVE'
              },
              ...rev.filter((r) => r.name !== empName).slice(0, 11)
            ]);
          }

          return updatedList;
        });
      };

      const handleActivityChange = (data: any) => {
        setEmployees((prev) => {
          const target = prev.find((e) => e._id === data.employeeId);
          if (target && data.currentApplication) {
            const empName = `${target.userId?.firstName || 'Employee'} ${target.userId?.lastName || ''}`.trim();
            setRecentLiveEvents((rev) => [
              {
                id: Date.now(),
                name: empName,
                employeeCode: target.employeeCode || '',
                status: target.currentStatus || 'ACTIVE',
                app: data.currentApplication,
                durationSeconds: data.durationSeconds || 1,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isLiveNow: true
              },
              ...rev.map((item) => (item.name === empName ? { ...item, isLiveNow: false } : item)).slice(0, 11)
            ]);
          }

          return prev.map((emp) => {
            if (emp._id === data.employeeId) {
              return {
                ...emp,
                currentApplication: data.currentApplication
              };
            }
            return emp;
          });
        });
      };

      const handleTelemetryUpdated = (data: any) => {
        if (!data || !data.employeeProfileId) return;

        setEmployees((prev) => {
          const updatedList = prev.map((emp) => {
            if (emp._id === data.employeeProfileId) {
              const newStatus = (data.status || emp.currentStatus || 'OFFLINE').toUpperCase();
              return {
                ...emp,
                currentStatus: newStatus,
                currentApplication: data.application !== undefined ? (data.application || '') : emp.currentApplication,
                lastActiveAt: data.lastSeenAt || emp.lastActiveAt,
                currentAppStartedAt: data.startedAt || emp.currentAppStartedAt
              };
            }
            return emp;
          });

          // Recompute overview counts
          let active = 0;
          let idle = 0;
          let onBreak = 0;
          let offline = 0;
          for (const item of updatedList) {
            const st = (item.currentStatus || '').toUpperCase();
            if (st === 'ACTIVE') active++;
            else if (st === 'IDLE') idle++;
            else if (st === 'BREAK') onBreak++;
            else offline++;
          }
          setOverview((o) => ({
            ...o,
            activeNow: active,
            idleNow: idle,
            onBreakNow: onBreak,
            offlineNow: offline,
            currentlyWorking: active + idle
          }));

          const targetEmp = prev.find((e) => e._id === data.employeeProfileId);
          if (targetEmp && data.application && !data.application.toLowerCase().includes('highp')) {
            const empName = `${targetEmp.userId?.firstName || 'Employee'} ${targetEmp.userId?.lastName || ''}`.trim();
            const timeStr = data.startedAt
              ? new Date(data.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : data.lastSeenAt
              ? new Date(data.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            setRecentLiveEvents((rev) => [
              {
                id: Date.now(),
                name: empName,
                employeeCode: targetEmp.employeeCode || '',
                status: (data.status || 'ACTIVE').toUpperCase(),
                app: data.application,
                durationSeconds: data.activeDurationSeconds || 1,
                time: timeStr,
                isLiveNow: data.status === 'active'
              },
              ...rev.map((item) => (item.name === empName ? { ...item, isLiveNow: false } : item)).slice(0, 11)
            ]);
          }

          return updatedList;
        });
      };

      const handleCurrentApplication = (data: any) => {
        if (!data || !data.employeeId || !data.application) return;
        const appName = data.application.name || '';
        const trackingState = data.application.trackingState || 'TRACKED';
        const executableName = data.application.executableName || '';

        setEmployees((prev) => {
          const target = prev.find((e) => e._id === data.employeeId);
          if (target && appName && !appName.toLowerCase().includes('highp')) {
            const empName = `${target.userId?.firstName || 'Employee'} ${target.userId?.lastName || ''}`.trim();
            setRecentLiveEvents((rev) => [
              {
                id: Date.now(),
                name: empName,
                employeeCode: target.employeeCode || '',
                status: target.currentStatus || 'ACTIVE',
                app: appName,
                durationSeconds: 1,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isLiveNow: target.currentStatus === 'ACTIVE'
              },
              ...rev.map((item) => (item.name === empName ? { ...item, isLiveNow: false } : item)).slice(0, 11)
            ]);
          }

          return prev.map((emp) => {
            if (emp._id === data.employeeId) {
              return {
                ...emp,
                currentApplication: appName,
                currentTrackingState: trackingState,
                currentExecutable: executableName || emp.currentExecutable,
                currentWebsite: data.website?.domain ? data.website : null
              };
            }
            return emp;
          });
        });
      };

      socket.on('agent:current-application', handleCurrentApplication);
      socket.on('employee:telemetry_updated', handleTelemetryUpdated);
      socket.on('employee:status_changed', handleStatusChange);
      socket.on('employee:activity_changed', handleActivityChange);
      socket.on('employee:session_started', fetchDashboardData);
      socket.on('employee:session_ended', fetchDashboardData);
      socket.on('employee:break_started', fetchDashboardData);
      socket.on('employee:break_ended', fetchDashboardData);

      return () => {
        socket.off('agent:current-application', handleCurrentApplication);
        socket.off('employee:telemetry_updated', handleTelemetryUpdated);
        socket.off('employee:status_changed', handleStatusChange);
        socket.off('employee:activity_changed', handleActivityChange);
        socket.off('employee:session_started', fetchDashboardData);
        socket.off('employee:session_ended', fetchDashboardData);
        socket.off('employee:break_started', fetchDashboardData);
        socket.off('employee:break_ended', fetchDashboardData);
      };
    }
  }, [fetchDashboardData]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    try {
      await api.post('/employees', {
        email: newEmail.trim().toLowerCase(),
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        employeeCode: newCode.trim().toUpperCase(),
        department: newDept,
        role: newRole,
        designation: newTitle.trim() || undefined
      });

      setIsAddModalOpen(false);
      setNewEmail('');
      setNewFirstName('');
      setNewLastName('');
      setNewCode('');
      setNewTitle('');
      await fetchDashboardData();
    } catch (err: any) {
      setModalError(err.response?.data?.message || err.message || 'Failed to create employee profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const user = emp.userId;
    const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase();
    const email = (user?.email || '').toLowerCase();
    const code = (emp.employeeCode || '').toLowerCase();
    const q = searchTerm.toLowerCase();

    const matchesSearch = fullName.includes(q) || email.includes(q) || code.includes(q);
    const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.currentStatus === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));
  const totalWorkingSeconds = overview.totalActiveSecondsToday + overview.totalIdleSecondsToday;
  const activeRatio =
    totalWorkingSeconds > 0 ? Math.round((overview.totalActiveSecondsToday / totalWorkingSeconds) * 100) : 0;

  // Currently actively focused employees
  const currentlyActiveWorkers = employees.filter(
    (e) => e.currentStatus === ActivityState.ACTIVE && e.currentApplication
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC] text-slate-900 selection:bg-black selection:text-white">
      <Header
        title="Workforce Intelligence Hub"
        description="Real-time employee presence, foreground workstation applications, and telemetry analytics."
        actions={
          <div className="flex items-center gap-2.5">
            <a
              href={getDesktopAgentDownloadUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold transition-all shadow-sm"
              title="Download Desktop Telemetry Agent"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" /> Desktop Agent (.exe)
            </a>
            <Link
              to="/dashboard/reports"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold transition-all shadow-sm"
            >
              <TrendingUp className="w-3.5 h-3.5 text-slate-600" /> Export Reports
            </Link>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Team Member
            </button>
          </div>
        }
      />

      <main className="p-4 sm:p-8 space-y-6 sm:space-y-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Executive KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Active Workforce Pulse */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm transition-all hover:border-slate-300">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Workforce Active Now
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <h3 className="text-3xl font-black text-slate-900 font-sans tracking-tight">
                    {overview.activeNow}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    / {overview.totalEmployees} Total
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {activeRatio}% Productive
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">live efficiency</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Card 2: Presence Matrix */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm transition-all hover:border-slate-300">
            <div className="flex items-start justify-between">
              <div className="w-full">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Presence Distribution
                </span>
                <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                  <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-200">
                    <span className="text-sm font-extrabold text-emerald-800 block">{overview.activeNow}</span>
                    <span className="text-[9px] uppercase tracking-wider text-emerald-700 font-semibold">Active</span>
                  </div>
                  <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-200">
                    <span className="text-sm font-extrabold text-amber-800 block">{overview.idleNow}</span>
                    <span className="text-[9px] uppercase tracking-wider text-amber-700 font-semibold">Idle</span>
                  </div>
                  <div className="bg-sky-50/70 p-2 rounded-xl border border-sky-200">
                    <span className="text-sm font-extrabold text-sky-800 block">{overview.onBreakNow}</span>
                    <span className="text-[9px] uppercase tracking-wider text-sky-700 font-semibold">Break</span>
                  </div>
                  <div className="bg-slate-100 p-2 rounded-xl border border-slate-200">
                    <span className="text-sm font-extrabold text-slate-700 block">{overview.offlineNow}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Offline</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Accumulated Active Hours */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm transition-all hover:border-slate-300">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Total Active Time Today
                </span>
                <h3 className="text-3xl font-black text-slate-900 font-sans tracking-tight mt-1.5">
                  {formatDuration(overview.totalActiveSecondsToday)}
                </h3>
                <div className="mt-2.5 flex items-center gap-2 text-[11px] font-medium">
                  <span className="text-amber-700 font-semibold">Idle: {formatDuration(overview.totalIdleSecondsToday)}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-sky-700 font-semibold">Break: {formatDuration(overview.totalBreakSecondsToday)}</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Card 4: Desktop Agent Hub */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm transition-all hover:border-slate-300">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900 block">
                  Workstation Agent Hub
                </span>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Native Windows Telemetry v1.0.0
                </p>
                <div className="mt-3 flex items-center gap-2.5">
                  <a
                    href={getDesktopAgentDownloadUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all hover:scale-105"
                  >
                    <Download className="w-3.5 h-3.5" /> Download (.exe)
                  </a>
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Auto Win32
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
                <Laptop className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* PROMINENT LIVE TELEMETRY RADAR & CURRENT APPLICATION STREAM */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-emerald-800 text-xs font-black tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                LIVE APPLICATION FOCUS RADAR
              </div>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Currently tracking active software windows across team workstations
              </span>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
              {currentlyActiveWorkers.length} Active Workstations
            </span>
          </div>

          {/* Currently Working Spotlight Grid */}
          {currentlyActiveWorkers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {currentlyActiveWorkers.map((worker) => {
                const u = worker.userId;
                const workerName = u ? `${u.firstName} ${u.lastName}` : 'Employee';
                const visuals = getAppVisuals(worker.currentApplication);
                const Icon = visuals.icon;

                return (
                  <div
                    key={worker._id}
                    className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between group shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-black text-white font-bold text-xs ring-2 ring-emerald-400 flex items-center justify-center shrink-0">
                        {workerName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">
                          {workerName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {worker.employeeCode} • {worker.department}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${visuals.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[130px]">{worker.currentApplication}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Live in app
                        </span>
                        {worker.todayActiveSeconds > 0 && (
                          <span className="text-slate-500 font-mono">
                            • {formatDuration(worker.todayActiveSeconds)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
              <Monitor className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                No active workstation application detected right now.
              </p>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                When employees start work on their desktop agent or web portal, their real-time application focus streams directly here.
              </p>
            </div>
          )}

          {/* Dedicated Recent Activity & Application Usage Stream */}
          {recentLiveEvents.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-black" />
                  Recent Activity Stream (Tracked Software & Elapsed Duration)
                </span>
                <span className="text-[10px] text-slate-700 font-semibold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  Active OS Telemetry
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {recentLiveEvents.slice(0, 6).map((ev) => {
                  const visuals = getAppVisuals(ev.app);
                  const Icon = visuals.icon;
                  return (
                    <div
                      key={ev.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        ev.isLiveNow
                          ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-xl border shrink-0 ${visuals.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-slate-900 text-xs truncate max-w-[110px]">{ev.name}</strong>
                            {ev.isLiveNow ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                                LIVE
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium truncate">{ev.app}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold font-mono text-emerald-700 block">
                          {formatDuration(ev.durationSeconds || 0)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{ev.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Filter and View Control Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { label: 'All Team', value: 'ALL', count: overview.totalEmployees },
              { label: 'Active', value: ActivityState.ACTIVE, count: overview.activeNow },
              { label: 'Idle', value: ActivityState.IDLE, count: overview.idleNow },
              { label: 'On Break', value: ActivityState.BREAK, count: overview.onBreakNow },
              { label: 'Offline', value: ActivityState.OFFLINE, count: overview.offlineNow }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === tab.value
                    ? 'bg-black text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    statusFilter === tab.value
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search, Dept Filter, View Mode */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search team member..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium transition-colors"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: Table or Grid Cards */}
        {viewMode === 'table' ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Live Status</th>
                    <th className="px-6 py-4">Tracking Source</th>
                    <th className="px-6 py-4">Active Application</th>
                    <th className="px-6 py-4">Active Today</th>
                    <th className="px-6 py-4">Idle Time</th>
                    <th className="px-6 py-4">Break Time</th>
                    <th className="px-6 py-4">Last Activity</th>
                    <th className="px-6 py-4 text-right">Analytics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-14 text-center text-slate-400">
                        <Users className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                        No team members match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const user = emp.userId;
                      const name = user ? `${user.firstName} ${user.lastName}` : 'Employee';
                      const lastActive = emp.lastActiveAt
                        ? new Date(emp.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'N/A';

                      const statusRing =
                        emp.currentStatus === ActivityState.ACTIVE
                          ? 'ring-2 ring-emerald-500/80 shadow-xs'
                          : emp.currentStatus === ActivityState.IDLE
                          ? 'ring-2 ring-amber-500/80'
                          : emp.currentStatus === ActivityState.BREAK
                          ? 'ring-2 ring-sky-500/80'
                          : 'ring-1 ring-slate-300';

                      const visuals = getAppVisuals(emp.currentApplication);
                      const Icon = visuals.icon;

                      return (
                        <tr key={emp._id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl bg-black text-white font-bold flex items-center justify-center text-xs ${statusRing}`}
                              >
                                {name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 group-hover:text-black transition-colors">
                                  {name}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {emp.employeeCode} • {emp.department}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={emp.currentStatus} />
                          </td>
                          <td className="px-6 py-4">
                            {emp.currentStatus === ActivityState.OFFLINE ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                OFFLINE
                              </span>
                            ) : emp.currentDeviceId ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                <Laptop className="w-3.5 h-3.5 text-slate-700" /> DESKTOP AGENT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Radio className="w-3.5 h-3.5 text-amber-700" /> WEB WORKSPACE
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {emp.currentStatus === ActivityState.OFFLINE ? (
                              <span className="text-slate-400 font-normal">None (Offline)</span>
                            ) : emp.currentApplication ? (
                              <div className="flex flex-col gap-1 items-start">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${visuals.color}`}>
                                  <Icon className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate max-w-[170px]">{emp.currentApplication}</span>
                                </div>
                                {emp.currentWebsite?.domain && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                                    <Globe className="w-3 h-3 text-cyan-700" />
                                    {emp.currentWebsite.domain}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">No active application</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-emerald-700 font-mono">
                            {formatDuration(emp.todayActiveSeconds)}
                          </td>
                          <td className="px-6 py-4 text-amber-700 font-semibold font-mono">
                            {formatDuration(emp.todayIdleSeconds)}
                          </td>
                          <td className="px-6 py-4 text-sky-700 font-semibold font-mono">
                            {formatDuration(emp.todayBreakSeconds)}
                          </td>
                          <td className="px-6 py-4 text-slate-500">{lastActive}</td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              to={`/dashboard/employees/${emp._id}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-black bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg transition-all"
                            >
                              Timeline <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid Cards View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEmployees.map((emp) => {
              const user = emp.userId;
              const name = user ? `${user.firstName} ${user.lastName}` : 'Employee';
              const totalToday = (emp.todayActiveSeconds || 0) + (emp.todayIdleSeconds || 0);
              const activePct = totalToday > 0 ? Math.round((emp.todayActiveSeconds / totalToday) * 100) : 0;
              const visuals = getAppVisuals(emp.currentApplication);
              const Icon = visuals.icon;

              return (
                <div
                  key={emp._id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-black text-white font-bold flex items-center justify-center text-sm">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-black transition-colors">
                          {name}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {emp.employeeCode} • {emp.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={emp.currentStatus} />
                    </div>
                  </div>

                  {/* Current Active App Spotlight */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">Current Focus</span>
                    {emp.currentStatus === ActivityState.OFFLINE ? (
                      <span className="text-xs font-semibold text-slate-400">None (Offline)</span>
                    ) : emp.currentApplication ? (
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs font-bold ${visuals.color}`}>
                          <Icon className="w-3 h-3" />
                          <span className="truncate max-w-[110px]">{emp.currentApplication}</span>
                        </div>
                        {emp.currentWebsite?.domain && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                            <Globe className="w-2.5 h-2.5 text-cyan-700" />
                            {emp.currentWebsite.domain}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No active application</span>
                    )}
                  </div>

                  {/* Productivity Ratio Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">
                        Active Work: <strong className="text-emerald-700 font-mono">{formatDuration(emp.todayActiveSeconds)}</strong>
                      </span>
                      <span className="text-emerald-700">{activePct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-black rounded-full transition-all"
                        style={{ width: `${activePct}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      Idle: {formatDuration(emp.todayIdleSeconds)} • Break: {formatDuration(emp.todayBreakSeconds)}
                    </span>
                    <Link
                      to={`/dashboard/employees/${emp._id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-black"
                    >
                      View Day <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 21: APPLICATION USAGE ANALYTICS */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-black" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Application Usage Analytics</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Persisted
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregate time spent across all registered workstation applications for {activityDateFilter}
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 self-start sm:self-auto">
              Total Recorded Time:{' '}
              <strong className="text-emerald-700 ml-1 font-mono">{formatDuration(totalAppUsageSeconds)}</strong>
            </div>
          </div>

          {appUsageAnalytics.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
              <Monitor className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              No persisted application usage records found for this date.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
              {appUsageAnalytics.slice(0, 10).map((app, idx) => {
                const visuals = getAppVisuals(app.applicationName);
                const Icon = visuals.icon;
                const pct = totalAppUsageSeconds > 0 ? Math.round((app.totalSeconds / totalAppUsageSeconds) * 100) : 0;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between gap-3 group shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-lg border shrink-0 ${visuals.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate">
                            {app.applicationName}
                          </p>
                          <span className="text-[10px] text-slate-500">{app.category || 'Other'}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 font-mono">{pct}%</span>
                    </div>

                    <div>
                      <div className="flex justify-between items-baseline text-xs mb-1.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Duration</span>
                        <strong className="text-slate-900 font-mono text-sm font-bold">
                          {formatDuration(app.totalSeconds)}
                        </strong>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-black rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 20: PERSISTED APPLICATION ACTIVITY RECORDS TABLE */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Application Activity Records</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  MongoDB Source of Truth
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Authoritative chronological application session logs with duration and status
              </p>
            </div>
            {isActivityLoading && (
              <span className="text-xs text-slate-600 font-semibold animate-pulse">
                Synchronizing activity...
              </span>
            )}
          </div>

          {/* Section 20 Filters: Application, Category, Employee, Date, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Filter 1: Application */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by app (e.g. Code, Chrome)..."
                value={activityAppFilter}
                onChange={(e) => setActivityAppFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium"
              />
            </div>

            {/* Filter 2: Category */}
            <div>
              <select
                value={activityCategoryFilter}
                onChange={(e) => setActivityCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              >
                <option value="ALL">All Categories</option>
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Communication">Communication</option>
                <option value="Browsers">Browsers</option>
                <option value="Productivity">Productivity</option>
                <option value="Marketing">Marketing</option>
                <option value="Project Management">Project Management</option>
                <option value="File Management">File Management</option>
                <option value="Media">Media</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Filter 3: Employee */}
            <div>
              <select
                value={activityEmployeeFilter}
                onChange={(e) => setActivityEmployeeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              >
                <option value="ALL">All Employees</option>
                {employees.map((emp) => {
                  const empName = emp.userId ? `${emp.userId.firstName} ${emp.userId.lastName}` : emp.employeeCode;
                  return (
                    <option key={emp._id} value={emp._id}>
                      {empName} ({emp.employeeCode})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Filter 4: Date */}
            <div className="relative flex items-center">
              <input
                type="date"
                value={activityDateFilter}
                onChange={(e) => setActivityDateFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>

            {/* Filter 5: Status */}
            <div>
              <select
                value={activityStatusFilter}
                onChange={(e) => setActivityStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="IDLE">Idle</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Activity Records Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Application</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Started</th>
                  <th className="px-5 py-3.5">Last Seen</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {activityRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <Clock className="w-7 h-7 text-slate-400 mx-auto mb-2 opacity-50" />
                      No activity session records match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  activityRecords.map((rec, i) => {
                    const visuals = getAppVisuals(rec.applicationName);
                    const Icon = visuals.icon;
                    const u = rec.employeeId?.userId;
                    const empName = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Employee' : 'Employee';
                    const startedFormatted = rec.startedAt
                      ? new Date(rec.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—';
                    const lastSeenFormatted = rec.lastSeenAt || rec.endedAt
                      ? new Date(rec.lastSeenAt || rec.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—';
                    const isLive = rec.isLiveNow || rec.status === 'ACTIVE';

                    return (
                      <tr key={rec._id || rec.eventId || i} className="hover:bg-slate-50 transition-colors group">
                        {/* Application */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg border shrink-0 ${visuals.color}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 group-hover:text-black transition-colors block truncate max-w-[180px]">
                                {rec.applicationName}
                              </span>
                              {rec.processName && (
                                <span className="text-[10px] text-slate-500 font-mono block">
                                  {rec.processName}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 bg-slate-100 rounded-full text-[11px] font-semibold text-slate-700 border border-slate-200">
                            {rec.category || 'Other'}
                          </span>
                        </td>

                        {/* Employee */}
                        <td className="px-5 py-3.5">
                          <div>
                            <span className="font-semibold text-slate-900 block">{empName}</span>
                            <span className="text-[10px] text-slate-500">{rec.employeeId?.employeeCode || ''}</span>
                          </div>
                        </td>

                        {/* Started */}
                        <td className="px-5 py-3.5 font-mono text-slate-600">{startedFormatted}</td>

                        {/* Last Seen */}
                        <td className="px-5 py-3.5 font-mono text-slate-500">{lastSeenFormatted}</td>

                        {/* Duration */}
                        <td className="px-5 py-3.5 font-mono font-bold text-emerald-700">
                          {formatDuration(rec.durationSeconds || rec.todayTotalSeconds || 0)}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          {isLive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              Active
                            </span>
                          ) : rec.type === 'IDLE_INTERVAL' || rec.status === 'IDLE' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Idle
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add New Team Member</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium"
                    placeholder="Arun"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium"
                    placeholder="Kumar"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium"
                  placeholder="arun@company.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee Code</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium uppercase"
                    placeholder="HP-005"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-semibold"
                  >
                    <option value={UserRole.EMPLOYEE}>Employee (Workforce)</option>
                    <option value={UserRole.MANAGER}>Manager / Team Lead</option>
                    <option value={UserRole.HR}>HR (Admin / Owner)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium"
                    placeholder="Engineering"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-medium"
                    placeholder="Senior QA Engineer"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-black hover:bg-slate-800 text-white font-bold shadow-sm transition-all hover:scale-105"
                >
                  {isSubmitting ? 'Creating...' : 'Create Employee Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
