'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/Header';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { formatDuration } from '../../lib/utils';
import { getDesktopAgentDownloadUrl } from '../../lib/constants';
import {
  Users,
  Activity,
  Moon,
  Coffee,
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
  Check
} from 'lucide-react';
import { ActivityState, IDashboardOverview, UserRole } from '@highp/shared';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [recentLiveEvents, setRecentLiveEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Employee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDept, setNewDept] = useState('Engineering');
  const [newRole, setNewRole] = useState(UserRole.EMPLOYEE);
  const [newTitle, setNewTitle] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [overviewRes, employeesRes] = await Promise.all([
        api.get('/employees/overview'),
        api.get('/employees')
      ]);

      if (overviewRes.data?.data) {
        setOverview(overviewRes.data.data);
      }
      if (employeesRes.data?.data) {
        setEmployees(employeesRes.data.data);
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
                currentApplication: data.currentApplication,
                lastActiveAt: data.lastActiveAt,
                todayActiveSeconds: data.todayActiveSeconds ?? emp.todayActiveSeconds,
                todayIdleSeconds: data.todayIdleSeconds ?? emp.todayIdleSeconds,
                todayBreakSeconds: data.todayBreakSeconds ?? emp.todayBreakSeconds
              };
            }
            return emp;
          });

          // Compute overview stats instantly in-memory
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
          if (targetEmp) {
            setRecentLiveEvents((rev) => [
              {
                id: Date.now(),
                name: `${targetEmp.userId?.firstName || 'Employee'} ${targetEmp.userId?.lastName || ''}`,
                status: data.status,
                app: data.currentApplication || 'System / Desktop',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              },
              ...rev.slice(0, 9)
            ]);
          }

          return updatedList;
        });
      };

      const handleActivityChange = (data: any) => {
        setEmployees((prev) =>
          prev.map((emp) => {
            if (emp._id === data.employeeId) {
              return {
                ...emp,
                currentApplication: data.currentApplication
              };
            }
            return emp;
          })
        );
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

    const matchesSearch = !q || fullName.includes(q) || email.includes(q) || code.includes(q);
    const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.currentStatus === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));
  const totalWorkingSeconds = overview.totalActiveSecondsToday + overview.totalIdleSecondsToday;
  const activeRatio = totalWorkingSeconds > 0 ? Math.round((overview.totalActiveSecondsToday / totalWorkingSeconds) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0B0F19] text-slate-100 selection:bg-indigo-600 selection:text-white">
      <Header
        title="Live Team Telemetry"
        description="Real-time workplace presence, active/idle time, and current application focus."
        actions={
          <div className="flex items-center gap-2.5">
            <a
              href={getDesktopAgentDownloadUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-sm"
              title="Download Desktop Telemetry Agent"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" /> Desktop Agent (.exe)
            </a>
            <Link
              to="/dashboard/reports"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-sm"
            >
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> Export Reports
            </Link>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Team Member
            </button>
          </div>
        }
      />

      <main className="p-4 sm:p-8 space-y-6 sm:space-y-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Executive KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Active Workforce Pulse */}
          <div className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl transition-all hover:border-emerald-500/40 group">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
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
                    / {overview.totalEmployees} Team
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {activeRatio}% Productive
                  </span>
                  <span className="text-[11px] text-slate-400">live ratio</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Card 2: Presence Breakdown */}
          <div className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl transition-all hover:border-indigo-500/40 group">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between relative z-10">
              <div className="w-full">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Live Presence Matrix
                </span>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-emerald-500/20">
                    <span className="text-xs font-bold text-emerald-400 block">{overview.activeNow}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Active</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-amber-500/20">
                    <span className="text-xs font-bold text-amber-400 block">{overview.idleNow}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Idle</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-cyan-500/20">
                    <span className="text-xs font-bold text-cyan-400 block">{overview.onBreakNow}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Break</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-700/40">
                    <span className="text-xs font-bold text-slate-400 block">{overview.offlineNow}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Offline</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Today's Accumulated Hours */}
          <div className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl transition-all hover:border-indigo-500/40 group">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Active Time Today
                </span>
                <h3 className="text-3xl font-black text-white font-sans tracking-tight mt-1.5">
                  {formatDuration(overview.totalActiveSecondsToday)}
                </h3>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <span className="text-amber-400 font-semibold">Idle: {formatDuration(overview.totalIdleSecondsToday)}</span>
                  <span>•</span>
                  <span className="text-cyan-400 font-semibold">Break: {formatDuration(overview.totalBreakSecondsToday)}</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm shrink-0">
                <Zap className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Card 4: Desktop Agent Health & Deploy */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/60 via-slate-900/70 to-slate-900/60 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-5 shadow-xl transition-all hover:border-indigo-500/50 group">
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block">
                  Workstation Agent Hub
                </span>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  HighP Desktop Agent v1.0.0
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={getDesktopAgentDownloadUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Download (.exe)
                  </a>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    1-Click Silent
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-sm shrink-0">
                <Laptop className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Live Activity Radar & Real-Time Stream */}
        {recentLiveEvents.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-lg flex items-center gap-3 overflow-hidden animate-in fade-in">
            <div className="flex items-center gap-2 shrink-0 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE STREAM
            </div>
            <div className="flex-1 min-w-0 overflow-x-auto whitespace-nowrap text-xs text-slate-300 flex items-center gap-4">
              {recentLiveEvents.slice(0, 3).map((ev) => (
                <span key={ev.id} className="inline-flex items-center gap-1.5 font-medium">
                  <strong className="text-white">{ev.name}</strong>
                  <span className="text-slate-400">switched to</span>
                  <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-[11px] font-mono">
                    {ev.app}
                  </code>
                  <span className="text-slate-500 text-[10px]">({ev.time})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Control Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-xl">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { label: 'All Team', value: 'ALL', count: overview.totalEmployees },
              { label: 'Active', value: ActivityState.ACTIVE, count: overview.activeNow, color: 'text-emerald-400' },
              { label: 'Idle', value: ActivityState.IDLE, count: overview.idleNow, color: 'text-amber-400' },
              { label: 'On Break', value: ActivityState.BREAK, count: overview.onBreakNow, color: 'text-cyan-400' },
              { label: 'Offline', value: ActivityState.OFFLINE, count: overview.offlineNow, color: 'text-slate-400' }
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

          {/* Search, Dept Filter, View Switcher */}
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
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Live Status</th>
                    <th className="px-6 py-4">Foreground Application</th>
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
                      <td colSpan={8} className="px-6 py-14 text-center text-slate-400">
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
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                                <Monitor className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                                {emp.currentStatus === ActivityState.OFFLINE
                                  ? '—'
                                  : emp.currentApplication || 'System / Desktop'}
                              </span>
                            </div>
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

              return (
                <div
                  key={emp._id}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl hover:border-indigo-500/40 transition-all space-y-4 group hover:-translate-y-0.5 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-950 to-indigo-800 text-indigo-200 font-black flex items-center justify-center text-sm border border-indigo-500/30">
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
                    <StatusBadge status={emp.currentStatus} />
                  </div>

                  {/* Current Active App Spotlight */}
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400">Current App Focus</span>
                    <span className="font-bold text-xs text-indigo-300 truncate max-w-[150px]">
                      {emp.currentStatus === ActivityState.OFFLINE ? 'None (Offline)' : emp.currentApplication || 'System Desktop'}
                    </span>
                  </div>

                  {/* Productivity Ratio Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Active Work: <strong className="text-emerald-400 font-mono">{formatDuration(emp.todayActiveSeconds)}</strong></span>
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
