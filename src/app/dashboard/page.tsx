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

// Helper to provide colorful brand-aware application icons
const getAppVisuals = (appName?: string) => {
  const name = (appName || '').toLowerCase();
  if (name.includes('brave')) {
    return { icon: Compass, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
  }
  if (name.includes('chrome')) {
    return { icon: Globe, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  }
  if (name.includes('edge')) {
    return { icon: Globe, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
  }
  if (name.includes('firefox')) {
    return { icon: Globe, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  }
  if (name.includes('code') || name.includes('antigravity') || name.includes('studio') || name.includes('cursor')) {
    return { icon: Code2, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
  }
  if (name.includes('figma') || name.includes('photoshop') || name.includes('illustrator') || name.includes('blender')) {
    return { icon: Palette, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
  }
  if (name.includes('terminal') || name.includes('powershell') || name.includes('cmd') || name.includes('bash')) {
    return { icon: Terminal, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  }
  if (name.includes('slack') || name.includes('teams') || name.includes('discord')) {
    return { icon: MessageSquare, color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' };
  }
  if (name.includes('excel') || name.includes('sheet') || name.includes('word') || name.includes('notion')) {
    return { icon: FileSpreadsheet, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
  }
  if (name.includes('explorer')) {
    return { icon: Folder, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  }
  return { icon: Monitor, color: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20' };
};

export default function DashboardOverviewPage() {
  const [overview, setOverview] = useState<IDashboardOverview>({
    totalEmployees: 0,
    activeNow: 0,
    idleNow: 0,
    onBreakNow: 0,
    offlineNow: 0,
    currentlyWorking: 0,
    totalActiveSecondsToday: 0,
    totalIdleSecondsToday: 0,
    totalBreakSecondsToday: 0
  });

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

      socket.on('employee:status_changed', handleStatusChange);
      socket.on('employee:activity_changed', handleActivityChange);
      socket.on('employee:session_started', fetchDashboardData);
      socket.on('employee:session_ended', fetchDashboardData);
      socket.on('employee:break_started', fetchDashboardData);
      socket.on('employee:break_ended', fetchDashboardData);

      return () => {
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
    <div className="flex-1 flex flex-col min-h-0 bg-[#090D16] text-slate-100 selection:bg-indigo-600 selection:text-white relative">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none -z-0" />

      <Header
        title="Workforce Intelligence Hub"
        description="Real-time employee presence, foreground workstation applications, and telemetry analytics."
        actions={
          <div className="flex items-center gap-2.5">
            <a
              href={getDesktopAgentDownloadUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all shadow-md shadow-indigo-500/5 hover:border-indigo-500/60"
              title="Download Desktop Telemetry Agent"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" /> Desktop Agent (.exe)
            </a>
            <Link
              to="/dashboard/reports"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-all shadow-sm"
            >
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> Export Reports
            </Link>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Team Member
            </button>
          </div>
        }
      />

      <main className="p-4 sm:p-8 space-y-6 sm:space-y-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full z-10">
        {/* Executive KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Active Workforce Pulse */}
          <div className="relative overflow-hidden bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl transition-all hover:border-emerald-500/40 group">
            <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Workforce Active Now
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <h3 className="text-3xl font-black text-white font-sans tracking-tight">
                    {overview.activeNow}
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">
                    / {overview.totalEmployees} Total
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {activeRatio}% Productive
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">live efficiency</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card 2: Presence Matrix */}
          <div className="relative overflow-hidden bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl transition-all hover:border-indigo-500/40 group">
            <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between relative z-10">
              <div className="w-full">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Presence Distribution
                </span>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-950/70 p-2 rounded-xl border border-emerald-500/30">
                    <span className="text-sm font-extrabold text-emerald-400 block">{overview.activeNow}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Active</span>
                  </div>
                  <div className="bg-slate-950/70 p-2 rounded-xl border border-amber-500/30">
                    <span className="text-sm font-extrabold text-amber-400 block">{overview.idleNow}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Idle</span>
                  </div>
                  <div className="bg-slate-950/70 p-2 rounded-xl border border-cyan-500/30">
                    <span className="text-sm font-extrabold text-cyan-400 block">{overview.onBreakNow}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Break</span>
                  </div>
                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                    <span className="text-sm font-extrabold text-slate-400 block">{overview.offlineNow}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Offline</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Accumulated Active Hours */}
          <div className="relative overflow-hidden bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl transition-all hover:border-indigo-500/40 group">
            <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Active Time Today
                </span>
                <h3 className="text-3xl font-black text-white font-sans tracking-tight mt-1.5">
                  {formatDuration(overview.totalActiveSecondsToday)}
                </h3>
                <div className="mt-2.5 flex items-center gap-2 text-[11px] font-medium">
                  <span className="text-amber-400 font-semibold">Idle: {formatDuration(overview.totalIdleSecondsToday)}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-cyan-400 font-semibold">Break: {formatDuration(overview.totalBreakSecondsToday)}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card 4: Desktop Agent Hub */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-slate-950/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-5 shadow-xl transition-all hover:border-indigo-500/60 group">
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block">
                  Workstation Agent Hub
                </span>
                <p className="text-xs text-slate-300 mt-1 font-medium">
                  Native Windows Telemetry v1.0.0
                </p>
                <div className="mt-3 flex items-center gap-2.5">
                  <a
                    href={getDesktopAgentDownloadUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all hover:scale-105"
                  >
                    <Download className="w-3.5 h-3.5" /> Download (.exe)
                  </a>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Auto Win32
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                <Laptop className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* PROMINENT LIVE TELEMETRY RADAR & CURRENT APPLICATION STREAM */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-2xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-400 text-xs font-black tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE APPLICATION FOCUS RADAR
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">
                Currently tracking active software windows across team workstations
              </span>
            </div>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
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
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex items-center justify-between group shadow-md"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-950 to-indigo-800 border border-indigo-500/30 flex items-center justify-center text-white font-bold text-xs ring-2 ring-emerald-500/60 shrink-0">
                        {workerName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-xs truncate group-hover:text-indigo-300 transition-colors">
                          {workerName}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
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
                        <span className="font-semibold text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Live in app
                        </span>
                        {worker.todayActiveSeconds > 0 && (
                          <span className="text-slate-400 font-mono">
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
            <div className="p-6 rounded-xl bg-slate-950/50 border border-slate-800/60 text-center space-y-2">
              <Monitor className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">
                No active workstation application detected right now.
              </p>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                When employees start work on their desktop agent or web portal, their real-time application focus streams directly here.
              </p>
            </div>
          )}

          {/* Dedicated Recent Activity & Application Usage Stream */}
          {recentLiveEvents.length > 0 && (
            <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  Recent Activity Stream (Tracked Software & Elapsed Duration)
                </span>
                <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
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
                          ? 'bg-slate-950/90 border-emerald-500/50 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/20'
                          : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-xl border shrink-0 ${visuals.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-white text-xs truncate max-w-[110px]">{ev.name}</strong>
                            {ev.isLiveNow ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                                LIVE
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium truncate">{ev.app}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold font-mono text-emerald-400 block">
                          {formatDuration(ev.durationSeconds || 0)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{ev.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Filter and View Control Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-xl">
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
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    statusFilter === tab.value
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
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
                className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-medium transition-colors"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-white">
                  {d}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'cards' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
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
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 text-[11px]">
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
                <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-14 text-center text-slate-400">
                        <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
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
                          ? 'ring-2 ring-emerald-500/80 shadow-md shadow-emerald-500/20'
                          : emp.currentStatus === ActivityState.IDLE
                          ? 'ring-2 ring-amber-500/80'
                          : emp.currentStatus === ActivityState.BREAK
                          ? 'ring-2 ring-cyan-500/80'
                          : 'ring-1 ring-slate-700';

                      const visuals = getAppVisuals(emp.currentApplication);
                      const Icon = visuals.icon;

                      return (
                        <tr key={emp._id} className="hover:bg-slate-800/40 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-950 to-indigo-800 text-indigo-200 font-black flex items-center justify-center text-xs border border-indigo-500/30 ${statusRing}`}
                              >
                                {name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                                  {name}
                                </p>
                                <p className="text-[11px] text-slate-400">
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
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800/80 text-slate-400 border border-slate-700">
                                OFFLINE
                              </span>
                            ) : emp.currentDeviceId ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                <Laptop className="w-3.5 h-3.5 text-indigo-400" /> DESKTOP AGENT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                <Radio className="w-3.5 h-3.5 text-amber-400" /> WEB WORKSPACE
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {emp.currentStatus === ActivityState.OFFLINE ? (
                              <span className="text-slate-500 font-normal">None (Offline)</span>
                            ) : emp.currentApplication ? (
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${visuals.color}`}>
                                <Icon className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate max-w-[170px]">{emp.currentApplication}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500">No active application</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-emerald-400 font-mono">
                            {formatDuration(emp.todayActiveSeconds)}
                          </td>
                          <td className="px-6 py-4 text-amber-400 font-semibold font-mono">
                            {formatDuration(emp.todayIdleSeconds)}
                          </td>
                          <td className="px-6 py-4 text-cyan-400 font-semibold font-mono">
                            {formatDuration(emp.todayBreakSeconds)}
                          </td>
                          <td className="px-6 py-4 text-slate-400">{lastActive}</td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              to={`/dashboard/employees/${emp._id}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-all"
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
                  className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-4 group backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-950 to-indigo-800 text-indigo-200 font-black flex items-center justify-center text-sm border border-indigo-500/30">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                          {name}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {emp.employeeCode} • {emp.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={emp.currentStatus} />
                    </div>
                  </div>

                  {/* Current Active App Spotlight */}
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400">Current App Focus</span>
                    {emp.currentStatus === ActivityState.OFFLINE ? (
                      <span className="text-xs font-semibold text-slate-500">None (Offline)</span>
                    ) : emp.currentApplication ? (
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs font-bold ${visuals.color}`}>
                        <Icon className="w-3 h-3" />
                        <span className="truncate max-w-[130px]">{emp.currentApplication}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">No active application</span>
                    )}
                  </div>

                  {/* Productivity Ratio Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">
                        Active Work: <strong className="text-emerald-400 font-mono">{formatDuration(emp.todayActiveSeconds)}</strong>
                      </span>
                      <span className="text-emerald-400">{activePct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all"
                        style={{ width: `${activePct}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      Idle: {formatDuration(emp.todayIdleSeconds)} • Break: {formatDuration(emp.todayBreakSeconds)}
                    </span>
                    <Link
                      to={`/dashboard/employees/${emp._id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                    >
                      View Day <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Add New Team Member</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-medium"
                    placeholder="Arun"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-medium"
                    placeholder="Kumar"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-medium"
                  placeholder="arun@company.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Employee Code</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-medium uppercase"
                    placeholder="HP-005"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value={UserRole.EMPLOYEE} className="bg-slate-900">Employee (Workforce)</option>
                    <option value={UserRole.MANAGER} className="bg-slate-900">Manager / Team Lead</option>
                    <option value={UserRole.HR} className="bg-slate-900">HR (Admin / Owner)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-medium"
                    placeholder="Engineering"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-medium"
                    placeholder="Senior QA Engineer"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
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
