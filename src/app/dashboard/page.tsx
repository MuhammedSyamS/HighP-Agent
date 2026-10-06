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
  ChevronDown,
  ChevronUp,
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
  Cpu,
  PieChart,
  Calendar,
  CalendarCheck,
  Check
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
  const [dashboardTab, setDashboardTab] = useState<'employees' | 'attendance' | 'apps' | 'activity'>('employees');
  const [isLoading, setLoading] = useState(true);

  // Dedicated Attendance Roster State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceRoster, setAttendanceRoster] = useState<any[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('ALL');
  const [expandedAttendanceSessions, setExpandedAttendanceSessions] = useState<Record<string, boolean>>({});

  const toggleAttendanceExpand = (empId: string) => {
    setExpandedAttendanceSessions((prev) => ({ ...prev, [empId]: !prev[empId] }));
  };

  const formatTimeOnly = (dateVal?: string | Date | null) => {
    if (!dateVal) return null;
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  };

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
  const [activityViewMode, setActivityViewMode] = useState<'grouped' | 'raw'>('grouped');
  const [expandedAdminKeys, setExpandedAdminKeys] = useState<Record<string, boolean>>({});

  const toggleAdminExpand = (key: string) => {
    setExpandedAdminKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const groupedActivityRecords = React.useMemo(() => {
    const map = new Map<string, any>();

    for (const rec of activityRecords) {
      const u = rec.employeeId?.userId;
      const empId = rec.employeeId?._id || 'unknown';
      const appName = (rec.applicationName || 'Unknown').trim();
      const groupKey = `${empId}_${appName}`;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          groupKey,
          applicationName: appName,
          processName: rec.processName,
          category: rec.category || 'Other',
          employeeId: rec.employeeId,
          employeeName: u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Employee' : 'Employee',
          employeeCode: rec.employeeId?.employeeCode || '',
          totalDurationSeconds: 0,
          sessionCount: 0,
          earliestStarted: rec.startedAt,
          latestLastSeen: rec.lastSeenAt || rec.endedAt || rec.startedAt,
          isLiveNow: !!rec.isLiveNow,
          sessions: []
        });
      }

      const item = map.get(groupKey)!;
      item.totalDurationSeconds += (rec.durationSeconds || rec.todayTotalSeconds || 0);
      item.sessionCount += 1;
      if (rec.isLiveNow) item.isLiveNow = true;
      if (!item.processName && rec.processName) item.processName = rec.processName;

      if (rec.startedAt && new Date(rec.startedAt) < new Date(item.earliestStarted)) {
        item.earliestStarted = rec.startedAt;
      }
      const end = rec.lastSeenAt || rec.endedAt || rec.startedAt;
      if (end && new Date(end) > new Date(item.latestLastSeen)) {
        item.latestLastSeen = end;
      }

      item.sessions.push({
        id: rec._id || rec.eventId,
        startedAt: rec.startedAt,
        endedAt: rec.endedAt || rec.lastSeenAt,
        durationSeconds: rec.durationSeconds || 0,
        isLiveNow: !!rec.isLiveNow,
        processName: rec.processName
      });
    }

    for (const item of map.values()) {
      item.sessions.sort((a: any, b: any) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    }

    return Array.from(map.values()).sort((a, b) => b.totalDurationSeconds - a.totalDurationSeconds);
  }, [activityRecords]);

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

  const fetchAttendanceRoster = useCallback(async (targetDate?: string) => {
    setIsAttendanceLoading(true);
    try {
      const d = targetDate || attendanceDate;
      const res = await api.get(`/attendance/roster?date=${d}`);
      if (res.data?.data) {
        setAttendanceRoster(res.data.data.roster || []);
        setAttendanceSummary(res.data.data.summary || null);
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching attendance roster:', err);
    } finally {
      setIsAttendanceLoading(false);
    }
  }, [attendanceDate]);

  useEffect(() => {
    fetchAttendanceRoster(attendanceDate);
  }, [attendanceDate, fetchAttendanceRoster]);

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

      const handleSessionChange = () => {
        fetchDashboardData();
        fetchAttendanceRoster();
      };

      socket.on('agent:current-application', handleCurrentApplication);
      socket.on('employee:telemetry_updated', handleTelemetryUpdated);
      socket.on('employee:status_changed', handleStatusChange);
      socket.on('employee:activity_changed', handleActivityChange);
      socket.on('employee:session_started', handleSessionChange);
      socket.on('employee:session_ended', handleSessionChange);
      socket.on('employee:break_started', fetchDashboardData);
      socket.on('employee:break_ended', fetchDashboardData);

      return () => {
        socket.off('agent:current-application', handleCurrentApplication);
        socket.off('employee:telemetry_updated', handleTelemetryUpdated);
        socket.off('employee:status_changed', handleStatusChange);
        socket.off('employee:activity_changed', handleActivityChange);
        socket.off('employee:session_started', handleSessionChange);
        socket.off('employee:session_ended', handleSessionChange);
        socket.off('employee:break_started', fetchDashboardData);
        socket.off('employee:break_ended', fetchDashboardData);
      };
    }
  }, [fetchDashboardData, fetchAttendanceRoster]);

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
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC] text-slate-900 selection:bg-indigo-600 selection:text-white">
      <Header
        title="Executive Intelligence Dashboard"
        description="Real-time workforce presence, foreground workstation applications, and telemetry analytics."
        actions={
          <div className="flex items-center gap-2 sm:gap-2.5">
            <a
              href={getDesktopAgentDownloadUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-all shadow-2xs hover:border-slate-300 min-h-[40px]"
              title="Download Desktop Telemetry Agent"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" /> Desktop Agent (.exe)
            </a>
            <Link
              to="/dashboard/reports"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-all shadow-2xs hover:border-slate-300 min-h-[40px]"
            >
              <TrendingUp className="w-3.5 h-3.5 text-slate-500" /> Export Reports
            </Link>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm hover:shadow transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[40px] shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" /> <span className="hidden xs:inline">Add Team Member</span><span className="xs:hidden">Add Member</span>
            </button>
          </div>
        }
      />

      <main className="p-3.5 xs:p-5 sm:p-8 space-y-6 sm:space-y-7 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Executive KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Active Workforce */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Active Workforce
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                    {overview.activeNow}
                  </h3>
                  <span className="text-xs font-medium text-slate-500">
                    / {overview.totalEmployees} registered
                  </span>
                </div>
                <div className="mt-3.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {activeRatio}% Active Ratio
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card 2: Total Active Work Time */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Active Time Today
                </span>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2 font-mono">
                  {formatDuration(overview.totalActiveSecondsToday)}
                </h3>
                <div className="mt-3.5 flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Idle: <strong className="font-mono">{formatDuration(overview.totalIdleSecondsToday)}</strong>
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-sky-700">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    Break: <strong className="font-mono">{formatDuration(overview.totalBreakSecondsToday)}</strong>
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card 3: Live Presence Breakdown */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Workforce Presence
              </span>

              {/* Segmented ratio bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden mt-3 mb-3.5 gap-0.5">
                <div
                  style={{ width: `${overview.totalEmployees > 0 ? (overview.activeNow / overview.totalEmployees) * 100 : 0}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title="Active"
                />
                <div
                  style={{ width: `${overview.totalEmployees > 0 ? (overview.idleNow / overview.totalEmployees) * 100 : 0}%` }}
                  className="bg-amber-400 transition-all duration-500"
                  title="Idle"
                />
                <div
                  style={{ width: `${overview.totalEmployees > 0 ? (overview.onBreakNow / overview.totalEmployees) * 100 : 0}%` }}
                  className="bg-sky-500 transition-all duration-500"
                  title="Break"
                />
                <div
                  style={{ width: `${overview.totalEmployees > 0 ? (overview.offlineNow / overview.totalEmployees) * 100 : 100}%` }}
                  className="bg-slate-300 transition-all duration-500"
                  title="Offline"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                  </span>
                  <span className="font-bold text-slate-900">{overview.activeNow}</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Idle
                  </span>
                  <span className="font-bold text-slate-900">{overview.idleNow}</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-sky-500" /> Break
                  </span>
                  <span className="font-bold text-slate-900">{overview.onBreakNow}</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-slate-300" /> Offline
                  </span>
                  <span className="font-bold text-slate-500">{overview.offlineNow}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Workforce Productivity Index */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Productivity Velocity
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                    {activeRatio}%
                  </h3>
                  <span className="text-xs font-semibold text-indigo-600">
                    {activeRatio >= 75 ? 'Optimal' : activeRatio >= 40 ? 'Moderate' : 'Ramping up'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-3.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, activeRatio)}%` }}
                  />
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Agent Quick Access Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-5 sm:p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center text-indigo-300 shrink-0">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-white text-sm sm:text-base">
                  HighP Desktop Agent v1.0.0 for Windows
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Ready to Deploy
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Runs silently in the system tray. Continuously tracks active desktop software windows, browser URLs, and auto-detects idle pauses.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-stretch md:self-auto shrink-0">
            <a
              href={getDesktopAgentDownloadUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-4 h-4" /> Download Agent (.exe)
            </a>
          </div>
        </div>

        {/* LIVE WORKSTATION RADAR */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-emerald-800 text-xs font-extrabold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                LIVE WORKSTATION RADAR
              </div>
              <span className="text-xs text-slate-500">
                Active foreground applications on employee workstations
              </span>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              {currentlyActiveWorkers.length} Active Workstations
            </span>
          </div>

          {/* Currently Working Spotlight Grid */}
          {currentlyActiveWorkers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentlyActiveWorkers.map((worker) => {
                const u = worker.userId;
                const workerName = u ? `${u.firstName} ${u.lastName}` : 'Employee';
                const visuals = getAppVisuals(worker.currentApplication);
                const Icon = visuals.icon;

                return (
                  <div
                    key={worker._id}
                    className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-indigo-300 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-extrabold text-xs ring-2 ring-emerald-400 flex items-center justify-center shrink-0">
                          {workerName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-600 transition-colors">
                            {workerName}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {worker.employeeCode} • {worker.department}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Live
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Active Application
                        </span>
                        {worker.todayActiveSeconds > 0 && (
                          <span className="font-mono text-emerald-700 font-bold text-xs">
                            {formatDuration(worker.todayActiveSeconds)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${visuals.color}`}>
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate max-w-[170px]">{worker.currentApplication}</span>
                        </div>
                        {(worker.currentWebsite?.domain || worker.currentWebsiteDomain) && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-xl border border-cyan-200">
                            <Globe className="w-3.5 h-3.5 text-cyan-700" />
                            {worker.currentWebsite?.domain || worker.currentWebsiteDomain}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 px-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2.5">
              <Monitor className="w-9 h-9 text-slate-300 mx-auto" />
              <h5 className="text-xs font-bold text-slate-700">
                No active workstation application detected right now
              </h5>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                When team members start work on their desktop agent or employee web portal, their active software windows will stream live here.
              </p>
            </div>
          )}

          {/* Dedicated Recent Activity & Application Usage Stream */}
          {recentLiveEvents.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                  Recent Application Switches
                </span>
                <span className="text-[10px] text-slate-500 font-semibold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                  Telemetry Stream
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentLiveEvents.slice(0, 6).map((ev) => {
                  const visuals = getAppVisuals(ev.app);
                  const Icon = visuals.icon;
                  return (
                    <div
                      key={ev.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                        ev.isLiveNow
                          ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs'
                          : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-xl border shrink-0 ${visuals.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-slate-900 text-xs truncate max-w-[120px]">{ev.name}</strong>
                            {ev.isLiveNow ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
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

        {/* Granular Section Switcher Tabs */}
        <div className="bg-slate-200/60 p-1.5 rounded-2xl inline-flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setDashboardTab('employees')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              dashboardTab === 'employees'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Team Workstation Roster</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
              dashboardTab === 'employees' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/80 text-slate-600'
            }`}>
              {filteredEmployees.length}
            </span>
          </button>

          <button
            onClick={() => setDashboardTab('attendance')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              dashboardTab === 'attendance'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-indigo-600" />
            <span>Attendance & Work Logs</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
              dashboardTab === 'attendance' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/80 text-slate-600'
            }`}>
              {attendanceSummary ? `${attendanceSummary.presentCount}/${attendanceSummary.totalEmployees}` : 'Daily'}
            </span>
          </button>

          <button
            onClick={() => setDashboardTab('apps')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              dashboardTab === 'apps'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <PieChart className="w-4 h-4 text-indigo-600" />
            <span>Top Software Analytics</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
              dashboardTab === 'apps' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/80 text-slate-600'
            }`}>
              {appUsageAnalytics.length}
            </span>
          </button>

          <button
            onClick={() => setDashboardTab('activity')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              dashboardTab === 'activity'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>Live OS Telemetry Logs</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
              dashboardTab === 'activity' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/80 text-slate-600'
            }`}>
              {activityRecords.length}
            </span>
          </button>
        </div>

        {dashboardTab === 'employees' && (
          <div className="space-y-6">
            {/* Filter and View Control Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0 w-full lg:w-auto">
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[38px] ${
                      statusFilter === tab.value
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-mono font-bold ${
                        statusFilter === tab.value
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search, Dept Filter, View Mode */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                <div className="relative w-full sm:w-56 lg:w-60">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium transition-colors min-h-[40px]"
                  />
                </div>

                <div className="flex items-center gap-2.5">
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="flex-1 sm:flex-initial px-3 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 min-h-[40px]"
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-2 rounded-lg text-xs transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                        viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                      title="Table View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`p-2 rounded-lg text-xs transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                        viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                      title="Grid Cards View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* View Mode: Table or Grid Cards */}
            {viewMode === 'table' ? (
              <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Tracking Source</th>
                        <th className="px-6 py-4">Current Focus Application</th>
                        <th className="px-6 py-4 text-emerald-800">Start Work</th>
                        <th className="px-6 py-4 text-slate-800">End Work</th>
                        <th className="px-6 py-4">Active Work</th>
                        <th className="px-6 py-4">Idle Time</th>
                        <th className="px-6 py-4">Break Time</th>
                        <th className="px-6 py-4">Last Activity</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="px-6 py-14 text-center text-slate-400">
                            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            No team members match the selected criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map((emp) => {
                          const user = emp.userId;
                          const name = user ? `${user.firstName} ${user.lastName}` : 'Employee';
                          const lastActive = emp.lastActiveAt
                            ? new Date(emp.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—';

                          const statusRing =
                            emp.currentStatus === ActivityState.ACTIVE
                              ? 'ring-2 ring-emerald-500/80 shadow-xs'
                              : emp.currentStatus === ActivityState.IDLE
                              ? 'ring-2 ring-amber-500/80'
                              : emp.currentStatus === ActivityState.BREAK
                              ? 'ring-2 ring-sky-500/80'
                              : 'ring-1 ring-slate-200';

                          const visuals = getAppVisuals(emp.currentApplication);
                          const Icon = visuals.icon;

                          return (
                            <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-6 py-4.5">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-xs shrink-0 ${statusRing}`}
                                  >
                                    {name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                      {name}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                      {emp.employeeCode} • {emp.department}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4.5">
                                <StatusBadge status={emp.currentStatus} />
                              </td>
                              <td className="px-6 py-4.5">
                                {emp.currentStatus === ActivityState.OFFLINE ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                    Offline
                                  </span>
                                ) : emp.currentDeviceId ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                    <Laptop className="w-3.5 h-3.5 text-slate-600" /> Desktop Agent
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    <Radio className="w-3.5 h-3.5 text-amber-700" /> Web Workspace
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4.5">
                                {emp.currentStatus === ActivityState.OFFLINE ? (
                                  <span className="text-slate-400 font-normal">None (Offline)</span>
                                ) : emp.currentApplication ? (
                                  <div className="flex flex-col gap-1 items-start">
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${visuals.color}`}>
                                      <Icon className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate max-w-[170px]">{emp.currentApplication}</span>
                                    </div>
                                    {(emp.currentWebsite?.domain || emp.currentWebsiteDomain) && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                                        <Globe className="w-3 h-3 text-cyan-700" />
                                        {emp.currentWebsite?.domain || emp.currentWebsiteDomain}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">No active window</span>
                                )}
                              </td>
                              {/* Start Work Timestamp */}
                              <td className="px-6 py-4.5 font-mono text-xs whitespace-nowrap">
                                {emp.todayShiftStartedAt ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    {formatTimeOnly(emp.todayShiftStartedAt)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-medium">Not Started</span>
                                )}
                              </td>
                              {/* End Work Timestamp */}
                              <td className="px-6 py-4.5 font-mono text-xs whitespace-nowrap">
                                {emp.todayShiftEndedAt ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                    {formatTimeOnly(emp.todayShiftEndedAt)}
                                  </span>
                                ) : (emp.todayAttendanceStatus === 'PRESENT' || emp.currentStatus !== 'OFFLINE') && emp.todayShiftStartedAt ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                    Working Now
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-medium">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4.5 font-bold text-emerald-700 font-mono">
                                {formatDuration(emp.todayActiveSeconds)}
                              </td>
                              <td className="px-6 py-4.5 text-amber-700 font-semibold font-mono">
                                {formatDuration(emp.todayIdleSeconds)}
                              </td>
                              <td className="px-6 py-4.5 text-sky-700 font-semibold font-mono">
                                {formatDuration(emp.todayBreakSeconds)}
                              </td>
                              <td className="px-6 py-4.5 text-slate-500 font-mono text-xs">{lastActive}</td>
                              <td className="px-6 py-4.5 text-right">
                                <Link
                                  to={`/dashboard/employees/${emp._id}`}
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/80 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                                >
                                  View <ArrowUpRight className="w-3.5 h-3.5" />
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
                      className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between gap-5 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-sm shadow-xs ring-2 ring-indigo-50">
                            {name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                              {name}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                              {emp.employeeCode} • {emp.department}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={emp.currentStatus} />
                      </div>

                      {/* Current Active App Spotlight */}
                      <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Current Focus</span>
                        {emp.currentStatus === ActivityState.OFFLINE ? (
                          <span className="text-xs font-semibold text-slate-400">None (Offline)</span>
                        ) : emp.currentApplication ? (
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${visuals.color}`}>
                              <Icon className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[120px]">{emp.currentApplication}</span>
                            </div>
                            {(emp.currentWebsite?.domain || emp.currentWebsiteDomain) && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                                <Globe className="w-3 h-3 text-cyan-700" />
                                {emp.currentWebsite?.domain || emp.currentWebsiteDomain}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No active window</span>
                        )}
                      </div>

                      {/* Start Work & End Work Timings */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" /> Start Work
                          </span>
                          <span className="font-mono font-bold text-slate-900 text-xs mt-1 block">
                            {emp.todayShiftStartedAt ? formatTimeOnly(emp.todayShiftStartedAt) : 'Not Started'}
                          </span>
                        </div>
                        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-slate-500" /> End Work
                          </span>
                          <span className="font-mono font-bold text-slate-900 text-xs mt-1 block">
                            {emp.todayShiftEndedAt ? (
                              formatTimeOnly(emp.todayShiftEndedAt)
                            ) : (emp.todayAttendanceStatus === 'PRESENT' || emp.currentStatus !== 'OFFLINE') && emp.todayShiftStartedAt ? (
                              <span className="text-emerald-700 inline-flex items-center gap-1 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Working Now
                              </span>
                            ) : (
                              '—'
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Productivity Ratio Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500">
                            Active Work: <strong className="text-emerald-700 font-mono">{formatDuration(emp.todayActiveSeconds)}</strong>
                          </span>
                          <span className="text-emerald-700 font-bold">{activePct}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all"
                            style={{ width: `${activePct}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500 font-medium">
                          Idle: {formatDuration(emp.todayIdleSeconds)} • Break: {formatDuration(emp.todayBreakSeconds)}
                        </span>
                        <Link
                          to={`/dashboard/employees/${emp._id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          View Day <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION: ATTENDANCE & SHIFT LOGS */}
        {dashboardTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Attendance Controls & Date Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                      Daily Attendance Roster
                    </h3>
                    <p className="text-xs text-slate-500">
                      Authoritative clock-in, clock-out, and daily work hours across your organization
                    </p>
                  </div>
                </div>
              </div>

              {/* Date Selector & Today shortcut */}
              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <div className="relative flex items-center">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="pl-9 pr-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setAttendanceDate(new Date().toISOString().slice(0, 10))}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition-colors"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Attendance KPI Summary Cards */}
            {attendanceSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Present Today
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h4 className="text-2xl sm:text-3xl font-black text-emerald-600">
                      {attendanceSummary.presentCount}
                    </h4>
                    <span className="text-xs font-semibold text-slate-500">
                      / {attendanceSummary.totalEmployees} ({attendanceSummary.attendanceRate}%)
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-2.5 inline-block">
                    {attendanceSummary.attendanceRate}% Attendance Rate
                  </span>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Currently Working Now
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h4 className="text-2xl sm:text-3xl font-black text-slate-900">
                      {attendanceSummary.workingNowCount}
                    </h4>
                    <span className="text-xs font-semibold text-slate-500">active sessions</span>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 mt-2.5 inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    On Workstations
                  </span>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Completed Work (Clocked Out)
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h4 className="text-2xl sm:text-3xl font-black text-slate-700">
                      {attendanceSummary.completedShiftCount}
                    </h4>
                    <span className="text-xs font-semibold text-slate-500">ended work</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 mt-2.5 inline-block">
                    Clocked Out
                  </span>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Absent / Not Marked
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h4 className="text-2xl sm:text-3xl font-black text-rose-600">
                      {attendanceSummary.absentCount}
                    </h4>
                    <span className="text-xs font-semibold text-slate-500">not clocked in</span>
                  </div>
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 mt-2.5 inline-block">
                    No Attendance Logged
                  </span>
                </div>
              </div>
            )}

            {/* Attendance Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { label: 'All Team', value: 'ALL' },
                  { label: 'Working Now', value: 'PRESENT_ACTIVE' },
                  { label: 'Completed Work', value: 'SHIFT_COMPLETED' },
                  { label: 'Absent', value: 'ABSENT' }
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setAttendanceStatusFilter(f.value)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      attendanceStatusFilter === f.value
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by name or code..."
                  value={attendanceSearchTerm}
                  onChange={(e) => setAttendanceSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium transition-colors"
                />
              </div>
            </div>

            {/* Main Attendance Roster Table */}
            <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Attendance Status</th>
                      <th className="px-6 py-4 text-emerald-800">Start Work (Clock In)</th>
                      <th className="px-6 py-4 text-slate-800">End Work (Clock Out)</th>
                      <th className="px-6 py-4">Total Work Time</th>
                      <th className="px-6 py-4">Active Work</th>
                      <th className="px-6 py-4">Idle / Away</th>
                      <th className="px-6 py-4">Break Time</th>
                      <th className="px-6 py-4">Work Sessions</th>
                      <th className="px-6 py-4 text-right">Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {isAttendanceLoading ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-14 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span>Loading attendance records for {attendanceDate}...</span>
                          </div>
                        </td>
                      </tr>
                    ) : attendanceRoster.filter((item) => {
                        const q = attendanceSearchTerm.toLowerCase();
                        const matchesSearch =
                          item.name.toLowerCase().includes(q) ||
                          item.email.toLowerCase().includes(q) ||
                          (item.employeeCode || '').toLowerCase().includes(q);
                        const matchesStatus =
                          attendanceStatusFilter === 'ALL' || item.attendanceStatus === attendanceStatusFilter;
                        return matchesSearch && matchesStatus;
                      }).length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-14 text-center text-slate-400">
                          <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          No attendance records found matching this criteria for {attendanceDate}.
                        </td>
                      </tr>
                    ) : (
                      attendanceRoster
                        .filter((item) => {
                          const q = attendanceSearchTerm.toLowerCase();
                          const matchesSearch =
                            item.name.toLowerCase().includes(q) ||
                            item.email.toLowerCase().includes(q) ||
                            (item.employeeCode || '').toLowerCase().includes(q);
                          const matchesStatus =
                            attendanceStatusFilter === 'ALL' || item.attendanceStatus === attendanceStatusFilter;
                          return matchesSearch && matchesStatus;
                        })
                        .map((att) => {
                          const isExpanded = !!expandedAttendanceSessions[att.employeeId];
                          return (
                            <React.Fragment key={att.employeeId}>
                              <tr className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-6 py-4.5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-xs shrink-0 ring-1 ring-slate-200">
                                      {att.name.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                        {att.name}
                                      </p>
                                      <p className="text-[11px] text-slate-500">
                                        {att.employeeCode} • {att.department || 'Operations'}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 py-4.5 whitespace-nowrap">
                                  {att.attendanceStatus === 'PRESENT_ACTIVE' ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                      Working Now
                                    </span>
                                  ) : att.attendanceStatus === 'SHIFT_COMPLETED' ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs">
                                      <Check className="w-3.5 h-3.5 text-slate-600" />
                                      Completed Work
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
                                      <X className="w-3.5 h-3.5 text-rose-500" />
                                      Absent / Not Clocked
                                    </span>
                                  )}
                                </td>

                                {/* Start Work (Clock In) */}
                                <td className="px-6 py-4.5 font-mono text-xs whitespace-nowrap">
                                  {att.shiftStartedAt ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                                      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      {formatTimeOnly(att.shiftStartedAt)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-medium">Not Started</span>
                                  )}
                                </td>

                                {/* End Work (Clock Out) */}
                                <td className="px-6 py-4.5 font-mono text-xs whitespace-nowrap">
                                  {att.shiftEndedAt ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                      {formatTimeOnly(att.shiftEndedAt)}
                                    </span>
                                  ) : att.shiftStartedAt ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                      Working Now
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-medium">—</span>
                                  )}
                                </td>

                                <td className="px-6 py-4.5 font-bold text-slate-900 font-mono">
                                  {formatDuration(att.totalShiftSeconds)}
                                </td>
                                <td className="px-6 py-4.5 font-bold text-emerald-700 font-mono">
                                  {formatDuration(att.totalActiveSeconds)}
                                </td>
                                <td className="px-6 py-4.5 text-amber-700 font-semibold font-mono">
                                  {formatDuration(att.totalIdleSeconds)}
                                </td>
                                <td className="px-6 py-4.5 text-sky-700 font-semibold font-mono">
                                  {formatDuration(att.totalBreakSeconds)}
                                </td>

                                {/* Work Sessions Count & Expand Trigger */}
                                <td className="px-6 py-4.5 whitespace-nowrap">
                                  {att.sessionsCount > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleAttendanceExpand(att.employeeId)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                                      title="Toggle session details"
                                    >
                                      <span>{att.sessionsCount} {att.sessionsCount === 1 ? 'session' : 'sessions'}</span>
                                      {isExpanded ? (
                                        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                      )}
                                    </button>
                                  ) : (
                                    <span className="text-slate-400 font-medium">—</span>
                                  )}
                                </td>

                                <td className="px-6 py-4.5 text-right whitespace-nowrap">
                                  <Link
                                    to={`/dashboard/employees/${att.employeeId}`}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                                  >
                                    View <ArrowUpRight className="w-3.5 h-3.5" />
                                  </Link>
                                </td>
                              </tr>

                              {/* Expandable Sessions Drawer */}
                              {isExpanded && att.sessions && att.sessions.length > 0 && (
                                <tr className="bg-slate-50/80">
                                  <td colSpan={10} className="px-8 py-3.5 border-y border-slate-200">
                                    <div className="space-y-2">
                                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Work Sessions for {att.name} on {attendanceDate}:
                                      </p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                        {att.sessions.map((sess: any, sIdx: number) => (
                                          <div
                                            key={sess._id || sIdx}
                                            className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs text-xs space-y-1"
                                          >
                                            <div className="flex items-center justify-between font-bold">
                                              <span className="text-slate-800">Session #{sIdx + 1}</span>
                                              <span className="text-emerald-700 font-mono">
                                                {formatDuration(sess.durationSeconds || 0)}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                                              <span>Start: {formatTimeOnly(sess.startedAt) || '—'}</span>
                                              <span>
                                                End: {sess.endedAt ? formatTimeOnly(sess.endedAt) : (
                                                  <span className="text-emerald-600 font-bold">In Progress</span>
                                                )}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 21: APPLICATION USAGE ANALYTICS */}
        {dashboardTab === 'apps' && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Software Usage Analytics</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Aggregated
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Authoritative time spent across detected workstation applications for {activityDateFilter}
                </p>
              </div>
              <div className="text-xs font-semibold px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 self-start sm:self-auto">
                Total Monitored Time:{' '}
                <strong className="text-emerald-700 ml-1 font-mono text-sm">{formatDuration(totalAppUsageSeconds)}</strong>
              </div>
            </div>

            {appUsageAnalytics.length === 0 ? (
              <div className="p-12 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs space-y-2">
                <Monitor className="w-9 h-9 text-slate-400 mx-auto opacity-50" />
                <p className="font-semibold text-slate-700">No application usage recorded for this date.</p>
                <p className="text-[11px] text-slate-400">Activity accumulates as team members work in desktop applications.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {appUsageAnalytics.map((app, idx) => {
                  const visuals = getAppVisuals(app.applicationName);
                  const Icon = visuals.icon;
                  const pct = totalAppUsageSeconds > 0 ? Math.round((app.totalSeconds / totalAppUsageSeconds) * 100) : 0;

                  return (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-indigo-300 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2.5 rounded-xl border shrink-0 ${visuals.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-600 transition-colors">
                              {app.applicationName}
                            </p>
                            <span className="text-[11px] text-slate-500 font-medium">{app.category || 'Other'}</span>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-slate-800 font-mono">{pct}%</span>
                      </div>

                      <div>
                        <div className="flex justify-between items-baseline text-xs mb-2">
                          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Total Usage</span>
                          <strong className="text-slate-900 font-mono text-sm font-extrabold">
                            {formatDuration(app.totalSeconds)}
                          </strong>
                        </div>
                        <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all"
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
        )}

        {/* SECTION 20: PERSISTED APPLICATION ACTIVITY RECORDS TABLE */}
        {dashboardTab === 'activity' && (
          <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden space-y-5 p-6 sm:p-7 animate-in fade-in duration-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">OS Telemetry Event Records</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    MongoDB Audit Log
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Chronological workstation window switches, process events, and idle intervals
                </p>
              </div>
              {isActivityLoading && (
                <span className="text-xs text-indigo-600 font-bold animate-pulse flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  Synchronizing records...
                </span>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter by app name..."
                  value={activityAppFilter}
                  onChange={(e) => setActivityAppFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <select
                  value={activityCategoryFilter}
                  onChange={(e) => setActivityCategoryFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
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

              <div>
                <select
                  value={activityEmployeeFilter}
                  onChange={(e) => setActivityEmployeeFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
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

              <div>
                <input
                  type="date"
                  value={activityDateFilter}
                  onChange={(e) => setActivityDateFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <select
                  value={activityStatusFilter}
                  onChange={(e) => setActivityStatusFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="IDLE">Idle</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            {/* Table View Mode Switcher & Counter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActivityViewMode('grouped')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activityViewMode === 'grouped'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Grouped by Software ({groupedActivityRecords.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivityViewMode('raw')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activityViewMode === 'raw'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Raw Switches ({activityRecords.length})</span>
                </button>
              </div>

              <span className="text-xs text-slate-500 font-medium">
                {activityViewMode === 'grouped'
                  ? `Consolidates repeated usage of the same application into expandable timestamp sessions.`
                  : `Showing sequential switch-by-switch log.`}
              </span>
            </div>

            {/* Activity Records Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Application</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">First Started</th>
                    <th className="px-5 py-3.5">Last Seen</th>
                    <th className="px-5 py-3.5">Total Duration</th>
                    <th className="px-5 py-3.5 text-right">{activityViewMode === 'grouped' ? 'Sessions & Timestamps' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {activityViewMode === 'grouped' ? (
                    groupedActivityRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          <Clock className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                          No activity session records match your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      groupedActivityRecords.map((grp) => {
                        const visuals = getAppVisuals(grp.applicationName);
                        const Icon = visuals.icon;
                        const startedFormatted = grp.earliestStarted
                          ? new Date(grp.earliestStarted).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—';
                        const lastSeenFormatted = grp.latestLastSeen
                          ? new Date(grp.latestLastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—';
                        const isExpanded = !!expandedAdminKeys[grp.groupKey];

                        return (
                          <React.Fragment key={grp.groupKey}>
                            <tr className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className={`p-1.5 rounded-lg border shrink-0 ${visuals.color}`}>
                                    <Icon className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block truncate max-w-[180px]">
                                      {grp.applicationName}
                                    </span>
                                    {grp.processName && (
                                      <span className="text-[10px] text-slate-500 font-mono block">
                                        {grp.processName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-3.5">
                                <span className="px-2.5 py-1 bg-slate-100 rounded-full text-[11px] font-semibold text-slate-700 border border-slate-200">
                                  {grp.category || 'Other'}
                                </span>
                              </td>

                              <td className="px-5 py-3.5">
                                <div>
                                  <span className="font-semibold text-slate-900 block">{grp.employeeName}</span>
                                  <span className="text-[10px] text-slate-500">{grp.employeeCode || ''}</span>
                                </div>
                              </td>

                              <td className="px-5 py-3.5 font-mono text-slate-600">{startedFormatted}</td>
                              <td className="px-5 py-3.5 font-mono text-slate-500">{lastSeenFormatted}</td>

                              <td className="px-5 py-3.5 font-mono font-bold text-emerald-700 text-sm">
                                {formatDuration(grp.totalDurationSeconds)}
                              </td>

                              <td className="px-5 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {grp.isLiveNow && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                      Live
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => toggleAdminExpand(grp.groupKey)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-200 text-xs font-bold transition-all shadow-2xs"
                                  >
                                    <span>{isExpanded ? 'Hide' : `View Timestamps (${grp.sessionCount})`}</span>
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Accordion Sub-Row for Timestamps */}
                            {isExpanded && (
                              <tr className="bg-slate-50/70 border-b border-slate-200">
                                <td colSpan={7} className="px-6 py-3.5">
                                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 pb-2 border-b border-slate-100">
                                      <span>Detailed Sessions for {grp.applicationName}</span>
                                      <span className="text-slate-400 font-medium">{grp.sessionCount} recorded intervals</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                                      {grp.sessions.map((sess: any, sIdx: number) => {
                                        const sStart = sess.startedAt ? new Date(sess.startedAt) : null;
                                        const sEnd = sess.endedAt ? new Date(sess.endedAt) : null;
                                        const sStartStr =
                                          sStart && !isNaN(sStart.getTime())
                                            ? sStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                            : '—';
                                        const sEndStr =
                                          sEnd && !isNaN(sEnd.getTime())
                                            ? sEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                            : 'Now';

                                        return (
                                          <div
                                            key={sess.id || sIdx}
                                            className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs"
                                          >
                                            <div className="flex items-center gap-1.5">
                                              <span className="w-4 h-4 rounded bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                #{grp.sessions.length - sIdx}
                                              </span>
                                              <span className="font-mono text-slate-700">
                                                {sStartStr} → {sEndStr}
                                              </span>
                                            </div>
                                            <span className="font-mono font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                                              {formatDuration(sess.durationSeconds)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )
                  ) : (
                    activityRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          <Clock className="w-7 h-7 text-slate-300 mx-auto mb-2" />
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
                          <tr key={rec._id || rec.eventId || i} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className={`p-1.5 rounded-lg border shrink-0 ${visuals.color}`}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block truncate max-w-[180px]">
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

                            <td className="px-5 py-3.5">
                              <span className="px-2.5 py-1 bg-slate-100 rounded-full text-[11px] font-semibold text-slate-700 border border-slate-200">
                                {rec.category || 'Other'}
                              </span>
                            </td>

                            <td className="px-5 py-3.5">
                              <div>
                                <span className="font-semibold text-slate-900 block">{empName}</span>
                                <span className="text-[10px] text-slate-500">{rec.employeeId?.employeeCode || ''}</span>
                              </div>
                            </td>

                            <td className="px-5 py-3.5 font-mono text-slate-600">{startedFormatted}</td>
                            <td className="px-5 py-3.5 font-mono text-slate-500">{lastSeenFormatted}</td>

                            <td className="px-5 py-3.5 font-mono font-bold text-emerald-700">
                              {formatDuration(rec.durationSeconds || rec.todayTotalSeconds || 0)}
                            </td>

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
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 font-medium min-h-[42px]"
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
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 font-medium min-h-[42px]"
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
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 font-medium min-h-[42px]"
                  placeholder="arun@company.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee Code</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 font-medium uppercase min-h-[42px]"
                    placeholder="HP-005"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 font-semibold min-h-[42px]"
                  >
                    <option value={UserRole.EMPLOYEE}>Employee (Workforce)</option>
                    <option value={UserRole.MANAGER}>Manager / Team Lead</option>
                    <option value={UserRole.HR}>HR (Admin / Owner)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 font-medium min-h-[42px]"
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
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 font-medium min-h-[42px]"
                    placeholder="Senior QA Engineer"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-105 min-h-[44px]"
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
