'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/Header';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { formatDuration } from '../../lib/utils';
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
  Download
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

          // Compute overview stats instantly in-memory for smooth 60fps UI
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
                name: `${targetEmp.userId?.firstName || 'Employee'}`,
                status: data.status,
                app: data.currentApplication,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
        email: newEmail,
        firstName: newFirstName,
        lastName: newLastName,
        employeeCode: newCode,
        department: newDept,
        designation: newTitle,
        role: newRole
      });

      setIsAddModalOpen(false);
      setNewEmail('');
      setNewFirstName('');
      setNewLastName('');
      setNewCode('');
      setNewTitle('');
      await fetchDashboardData();
    } catch (err: any) {
      setModalError(err.response?.data?.message || err.message || 'Failed to create employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const user = emp.userId;
    const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase();
    const code = (emp.employeeCode || '').toLowerCase();
    const email = (user?.email || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = fullName.includes(query) || code.includes(query) || email.includes(query);
    const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.currentStatus === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  const totalWorkingSeconds = overview.totalActiveSecondsToday + overview.totalIdleSecondsToday;
  const activeRatio = totalWorkingSeconds > 0 ? Math.round((overview.totalActiveSecondsToday / totalWorkingSeconds) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <Header
        title="Live Team Activity"
        description="Real-time workplace presence, active/idle time, and current application focus."
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/reports"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Export Reports
            </Link>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-105"
            >
              <UserPlus className="w-4 h-4" /> Add Employee
            </button>
          </div>
        }
      />

      <main className="p-8 space-y-8 flex-1 overflow-y-auto">
        {/* Metric Overview Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3.5">
          <StatCard
            title="Total Team"
            value={overview.totalEmployees}
            icon={Users}
            color="slate"
          />
          <StatCard
            title="Active Now"
            value={overview.activeNow}
            icon={Activity}
            color="emerald"
            subtitle={`${activeRatio}% Active Ratio`}
          />
          <StatCard
            title="Idle Now"
            value={overview.idleNow}
            icon={Moon}
            color="amber"
          />
          <StatCard
            title="On Break"
            value={overview.onBreakNow}
            icon={Coffee}
            color="cyan"
          />
          <StatCard
            title="Offline"
            value={overview.offlineNow}
            icon={Clock}
            color="slate"
          />
          <StatCard
            title="Active Today"
            value={formatDuration(overview.totalActiveSecondsToday)}
            icon={Zap}
            color="indigo"
          />
          <StatCard
            title="Idle Today"
            value={formatDuration(overview.totalIdleSecondsToday)}
            icon={Moon}
            color="amber"
          />
          <StatCard
            title="Break Today"
            value={formatDuration(overview.totalBreakSecondsToday)}
            icon={Coffee}
            color="cyan"
          />
        </div>

        {/* Live Filter Pills Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { label: 'All Employees', value: 'ALL', count: overview.totalEmployees },
              { label: 'Active 🟢', value: ActivityState.ACTIVE, count: overview.activeNow },
              { label: 'Idle 🟡', value: ActivityState.IDLE, count: overview.idleNow },
              { label: 'Break ☕', value: ActivityState.BREAK, count: overview.onBreakNow },
              { label: 'Offline ⚫', value: ActivityState.OFFLINE, count: overview.offlineNow }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === tab.value
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search, Dept Filter, View Switcher */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, code, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'cards' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
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
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Current Application</th>
                    <th className="px-6 py-3.5">Active Time Today</th>
                    <th className="px-6 py-3.5">Idle Time</th>
                    <th className="px-6 py-3.5">Break Time</th>
                    <th className="px-6 py-3.5">Last Seen</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                        No team members match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const user = emp.userId;
                      const name = user ? `${user.firstName} ${user.lastName}` : 'Employee';
                      const lastActive = emp.lastActiveAt
                        ? new Date(emp.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'N/A';

                      return (
                        <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-50 to-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-200/60 shadow-xs">
                                {name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {name}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {emp.employeeCode} • {emp.department} • {emp.designation}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={emp.currentStatus} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
                                <Monitor className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-bold text-slate-800 truncate max-w-[170px]">
                                {emp.currentStatus === ActivityState.OFFLINE
                                  ? '—'
                                  : emp.currentApplication || 'Desktop / System'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-emerald-600">
                            {formatDuration(emp.todayActiveSeconds)}
                          </td>
                          <td className="px-6 py-4 text-amber-600 font-semibold">
                            {formatDuration(emp.todayIdleSeconds)}
                          </td>
                          <td className="px-6 py-4 text-cyan-600 font-semibold">
                            {formatDuration(emp.todayBreakSeconds)}
                          </td>
                          <td className="px-6 py-4 text-slate-500">{lastActive}</td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              to={`/dashboard/employees/${emp._id}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((emp) => {
              const user = emp.userId;
              const name = user ? `${user.firstName} ${user.lastName}` : 'Employee';
              const totalToday = (emp.todayActiveSeconds || 0) + (emp.todayIdleSeconds || 0);
              const activePct = totalToday > 0 ? Math.round((emp.todayActiveSeconds / totalToday) * 100) : 0;

              return (
                <div
                  key={emp._id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4 group hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-100">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {name}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {emp.employeeCode} • {emp.department}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={emp.currentStatus} />
                  </div>

                  {/* Current Active App */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">Current Focus</span>
                    <span className="font-bold text-xs text-slate-800 truncate max-w-[140px]">
                      {emp.currentStatus === ActivityState.OFFLINE ? 'None (Offline)' : emp.currentApplication || 'Desktop'}
                    </span>
                  </div>

                  {/* Metrics Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Active Work: {formatDuration(emp.todayActiveSeconds)}</span>
                      <span className="text-emerald-600">{activePct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${activePct}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Idle: {formatDuration(emp.todayIdleSeconds)} • Break: {formatDuration(emp.todayBreakSeconds)}
                    </span>
                    <Link
                      to={`/dashboard/employees/${emp._id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add New Team Member</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
                    placeholder="Arun"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
                    placeholder="Kumar"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
                  placeholder="arun@company.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Employee Code</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
                    placeholder="EMP-006"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value={UserRole.EMPLOYEE}>Employee</option>
                    <option value={UserRole.MANAGER}>Manager</option>
                    <option value={UserRole.ADMIN}>HR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
                    placeholder="Engineering"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
                    placeholder="QA Engineer"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 transition-all"
                >
                  {isSubmitting ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
