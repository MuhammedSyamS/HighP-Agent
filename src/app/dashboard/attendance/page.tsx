'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Coffee,
  Moon,
  Laptop,
  Globe,
  Monitor,
  Sparkles,
  ArrowUpRight,
  Filter,
  X,
  Layers,
  Code2,
  CalendarDays,
  TrendingUp,
  BarChart3,
  Award
} from 'lucide-react';
import { api } from '../../../lib/api';
import { StatusBadge } from '../../../components/StatusBadge';
import { TimelineVisualizer } from '../../../components/TimelineVisualizer';
import { formatDuration, formatPercent, getLocalDateString } from '../../../lib/utils';
import { ActivityState } from '@highp/shared';
import { getSocket } from '../../../lib/socket';

interface EmployeeRosterItem {
  employeeId: string;
  name: string;
  email: string;
  employeeCode: string;
  department: string;
  designation: string;
  currentStatus: string;
  attendanceStatus: 'PRESENT_ACTIVE' | 'SHIFT_COMPLETED' | 'ON_BREAK' | 'ABSENT' | string;
  shiftStartedAt: string | null;
  shiftEndedAt: string | null;
  totalShiftSeconds: number;
  totalActiveSeconds: number;
  totalIdleSeconds: number;
  totalBreakSeconds: number;
}

interface MonthlyDayMeta {
  day: number;
  date: string;
  dayOfWeek: string;
  isWeekend: boolean;
  isToday: boolean;
  isFuture: boolean;
}

interface MonthlyEmployeeDay {
  day: number;
  date: string;
  dayOfWeek: string;
  isWeekend: boolean;
  isToday: boolean;
  isFuture: boolean;
  status: 'PRESENT_ACTIVE' | 'PRESENT' | 'ABSENT' | 'WEEKEND' | 'FUTURE';
  shiftSeconds: number;
  activeSeconds: number;
  idleSeconds: number;
  breakSeconds: number;
  firstStart: string | null;
  lastEnd: string | null;
}

interface MonthlyEmployeeItem {
  employeeId: string;
  name: string;
  email: string;
  employeeCode: string;
  department: string;
  designation: string;
  currentStatus: string;
  presentDays: number;
  absentDays: number;
  attendanceRate: number;
  totalShiftSeconds: number;
  totalActiveSeconds: number;
  totalIdleSeconds: number;
  totalBreakSeconds: number;
  averageDailyActiveSeconds: number;
  activeFocusPercent: number;
  dailyAttendance: MonthlyEmployeeDay[];
}

interface MonthlySummary {
  totalEmployees: number;
  totalWorkingDaysInMonth: number;
  workingDaysElapsed: number;
  companyTotalShiftSeconds: number;
  companyTotalActiveSeconds: number;
  companyTotalIdleSeconds: number;
  companyTotalBreakSeconds: number;
  avgAttendanceRate: number;
  companyActiveFocusPercent: number;
  totalPresentDays: number;
}

interface MonthlyAttendanceData {
  year: number;
  month: number;
  monthLabel: string;
  daysInMonth: number;
  workingDaysElapsed: number;
  totalWorkingDaysInMonth: number;
  summary: MonthlySummary;
  days: MonthlyDayMeta[];
  employees: MonthlyEmployeeItem[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AttendanceDataPage() {
  // View mode switcher: 'daily' vs 'monthly'
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  // Daily Mode States
  const [dateStr, setDateStr] = useState<string>(() => getLocalDateString());
  const [roster, setRoster] = useState<EmployeeRosterItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Daily Summary counts
  const [summary, setSummary] = useState({
    presentCount: 0,
    workingNowCount: 0,
    completedShiftCount: 0,
    absentCount: 0,
    totalActiveSeconds: 0,
    totalIdleSeconds: 0
  });

  // Modal for Selected Employee Full Tracking (Daily)
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<{
    profile: any;
    currentSession: any;
    todaySessions: any[];
    topApps: any[];
    topWebsites: any[];
    timelineEvents: any[];
  } | null>(null);
  const [modalTab, setModalTab] = useState<'timeline' | 'apps' | 'websites' | 'sessions'>('timeline');

  // Monthly Mode States
  const todayDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(() => todayDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => todayDate.getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendanceData | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState<boolean>(false);
  const [monthlyError, setMonthlyError] = useState<string>('');
  const [monthlyDeptFilter, setMonthlyDeptFilter] = useState<string>('ALL');
  const [monthlyRateFilter, setMonthlyRateFilter] = useState<string>('ALL');
  const [selectedMonthlyEmp, setSelectedMonthlyEmp] = useState<MonthlyEmployeeItem | null>(null);

  // Fetch Daily Attendance Roster
  const fetchRoster = useCallback(async (targetDate: string) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/attendance/roster?date=${targetDate}`);
      if (res.data?.data) {
        const d = res.data.data;
        const items: EmployeeRosterItem[] = d.roster || [];
        setRoster(items);

        const totalAct = items.reduce((acc, r) => acc + (r.totalActiveSeconds || 0), 0);
        const totalIdl = items.reduce((acc, r) => acc + (r.totalIdleSeconds || 0), 0);

        setSummary({
          presentCount: d.summary?.presentCount ?? d.presentCount ?? 0,
          workingNowCount: d.summary?.workingNowCount ?? d.workingNowCount ?? 0,
          completedShiftCount: d.summary?.completedShiftCount ?? d.completedShiftCount ?? 0,
          absentCount: d.summary?.absentCount ?? d.absentCount ?? 0,
          totalActiveSeconds: totalAct,
          totalIdleSeconds: totalIdl
        });
      }
    } catch (err: any) {
      console.error('[Attendance] Failed to fetch roster:', err);
      setError(err.response?.data?.message || 'Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Monthly Attendance Data
  const fetchMonthlyAttendance = useCallback(async (year: number, month: number) => {
    try {
      setMonthlyLoading(true);
      setMonthlyError('');
      const res = await api.get(`/attendance/monthly?year=${year}&month=${month}`);
      if (res.data?.data) {
        setMonthlyData(res.data.data);
      }
    } catch (err: any) {
      console.error('[Attendance] Failed to fetch monthly attendance:', err);
      setMonthlyError(err.response?.data?.message || 'Failed to load monthly attendance data.');
    } finally {
      setMonthlyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'daily') {
      fetchRoster(dateStr);
      const interval = setInterval(() => fetchRoster(dateStr), 15000);
      return () => clearInterval(interval);
    } else {
      fetchMonthlyAttendance(selectedYear, selectedMonth);
      const interval = setInterval(() => fetchMonthlyAttendance(selectedYear, selectedMonth), 30000);
      return () => clearInterval(interval);
    }
  }, [viewMode, dateStr, selectedYear, selectedMonth, fetchRoster, fetchMonthlyAttendance]);

  // Real-time socket sync
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const handleStatusChange = () => {
        if (viewMode === 'daily') {
          fetchRoster(dateStr);
        } else {
          fetchMonthlyAttendance(selectedYear, selectedMonth);
        }
      };
      socket.on('employee:status_changed', handleStatusChange);
      socket.on('employee:session_started', handleStatusChange);
      socket.on('employee:session_ended', handleStatusChange);
      return () => {
        socket.off('employee:status_changed', handleStatusChange);
        socket.off('employee:session_started', handleStatusChange);
        socket.off('employee:session_ended', handleStatusChange);
      };
    }
  }, [viewMode, dateStr, selectedYear, selectedMonth, fetchRoster, fetchMonthlyAttendance]);

  // Fetch Full Tracking for Selected Employee (Daily Modal)
  const openFullTracking = async (empId: string) => {
    setSelectedEmpId(empId);
    setDetailLoading(true);
    setDetailData(null);
    setModalTab('timeline');
    try {
      const [empRes, timelineRes] = await Promise.all([
        api.get(`/employees/${empId}`),
        api.get(`/activity/${empId}/timeline?date=${dateStr}`).catch(() => ({ data: { data: { events: [] } } }))
      ]);

      if (empRes.data?.data) {
        setDetailData({
          profile: empRes.data.data.profile,
          currentSession: empRes.data.data.currentSession,
          todaySessions: empRes.data.data.todaySessions || [],
          topApps: empRes.data.data.topApps || [],
          topWebsites: empRes.data.data.topWebsites || [],
          timelineEvents: timelineRes.data?.data?.events || []
        });
      }
    } catch (err: any) {
      console.error('[Attendance] Error fetching employee full tracking:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Daily Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - 1);
    setDateStr(getLocalDateString(d));
  };

  const handleNextDay = () => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    setDateStr(getLocalDateString(d));
  };

  const handleToday = () => {
    setDateStr(getLocalDateString());
  };

  // Monthly Date Navigation Helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  };

  // Filtered Daily Roster
  const departments = useMemo(() => {
    const depts = new Set<string>();
    roster.forEach((r) => {
      if (r.department) depts.add(r.department);
    });
    return Array.from(depts);
  }, [roster]);

  const filteredRoster = useMemo(() => {
    return roster.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.department || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PRESENT_ACTIVE' && (item.attendanceStatus === 'PRESENT_ACTIVE' || item.currentStatus === 'ACTIVE')) ||
        (statusFilter === 'SHIFT_COMPLETED' && item.attendanceStatus === 'SHIFT_COMPLETED') ||
        (statusFilter === 'ON_BREAK' && (item.attendanceStatus === 'ON_BREAK' || item.currentStatus === 'BREAK')) ||
        (statusFilter === 'IDLE' && item.currentStatus === 'IDLE') ||
        (statusFilter === 'ABSENT' && item.attendanceStatus === 'ABSENT');

      const matchesDept = deptFilter === 'ALL' || item.department === deptFilter;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [roster, searchQuery, statusFilter, deptFilter]);

  // Filtered Monthly Employees
  const monthlyDepartments = useMemo(() => {
    if (!monthlyData?.employees) return [];
    const depts = new Set<string>();
    monthlyData.employees.forEach((e) => {
      if (e.department) depts.add(e.department);
    });
    return Array.from(depts);
  }, [monthlyData]);

  const filteredMonthlyEmployees = useMemo(() => {
    if (!monthlyData?.employees) return [];
    return monthlyData.employees.filter((emp) => {
      const matchesSearch =
        searchQuery === '' ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.department || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = monthlyDeptFilter === 'ALL' || emp.department === monthlyDeptFilter;

      let matchesRate = true;
      if (monthlyRateFilter === 'HIGH') matchesRate = emp.attendanceRate >= 90;
      else if (monthlyRateFilter === 'MED') matchesRate = emp.attendanceRate >= 70 && emp.attendanceRate < 90;
      else if (monthlyRateFilter === 'LOW') matchesRate = emp.attendanceRate < 70;

      return matchesSearch && matchesDept && matchesRate;
    });
  }, [monthlyData, searchQuery, monthlyDeptFilter, monthlyRateFilter]);

  // Export Daily CSV
  const exportDailyCsv = () => {
    if (roster.length === 0) return;
    const headers = [
      'Employee Code',
      'Name',
      'Email',
      'Department',
      'Designation',
      'Attendance Status',
      'Clock In',
      'Clock Out',
      'Total Work Time (HH:MM)',
      'Active Work Time (HH:MM)',
      'Idle Time (HH:MM)',
      'Break Time (HH:MM)'
    ];

    const rows = filteredRoster.map((r) => [
      `"${r.employeeCode}"`,
      `"${r.name}"`,
      `"${r.email}"`,
      `"${r.department || 'N/A'}"`,
      `"${r.designation || 'N/A'}"`,
      `"${r.attendanceStatus}"`,
      `"${r.shiftStartedAt ? new Date(r.shiftStartedAt).toLocaleTimeString() : 'N/A'}"`,
      `"${r.shiftEndedAt ? new Date(r.shiftEndedAt).toLocaleTimeString() : r.attendanceStatus === 'PRESENT_ACTIVE' ? 'Working Now' : 'N/A'}"`,
      `"${formatDuration(r.totalShiftSeconds)}"`,
      `"${formatDuration(r.totalActiveSeconds)}"`,
      `"${formatDuration(r.totalIdleSeconds)}"`,
      `"${formatDuration(r.totalBreakSeconds)}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HighP_Daily_Attendance_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Monthly CSV
  const exportMonthlyCsv = async () => {
    try {
      const res = await api.get(
        `/attendance/monthly?year=${selectedYear}&month=${selectedMonth}&exportCsv=true`,
        { responseType: 'text' }
      );
      if (res.data) {
        const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute(
          'download',
          `HighP_Monthly_Attendance_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      console.error('[Attendance] Failed to export monthly CSV:', err);
      alert('Failed to generate monthly attendance CSV. Please try again.');
    }
  };

  const isDailyToday = dateStr === getLocalDateString();
  const isCurrentMonthSelected =
    selectedYear === todayDate.getFullYear() && selectedMonth === todayDate.getMonth() + 1;

  return (
    <div className="flex-1 bg-[#F8FAFC] min-h-screen text-slate-800 p-6 sm:p-10 space-y-8">
      {/* TOP HEADER & VIEW MODE SWITCHER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Workforce Telemetry & Attendance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
            {viewMode === 'daily' ? 'Daily Attendance Roster' : 'Monthly Attendance & Time Accounting'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            {viewMode === 'daily'
              ? 'Real-time daily attendance roster, verified check-in/out timestamps, active focus, and idle duration.'
              : 'Complete month-long attendance records, working days attended, active focus percentages, and calendar breakdown.'}
          </p>
        </div>

        {/* View Switcher Pill & Date/Month Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Segmented View Mode Toggle */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-2xl border border-slate-300 shadow-2xs">
            <button
              onClick={() => setViewMode('daily')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'daily'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Daily Roster</span>
            </button>

            <button
              onClick={() => setViewMode('monthly')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'monthly'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Monthly Attendance</span>
            </button>
          </div>

          {/* Controls for DAILY mode */}
          {viewMode === 'daily' ? (
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                <button
                  onClick={handlePrevDay}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 px-3 py-1 font-bold text-xs text-slate-800 font-mono">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleNextDay}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {!isDailyToday && (
                <button
                  onClick={handleToday}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors"
                >
                  Go to Today
                </button>
              )}

              <button
                onClick={exportDailyCsv}
                disabled={roster.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export Daily CSV</span>
              </button>
            </div>
          ) : (
            /* Controls for MONTHLY mode */
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-800">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-transparent font-bold text-xs text-slate-800 border-none focus:outline-none cursor-pointer"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={idx} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-transparent font-bold text-xs text-slate-800 border-none focus:outline-none cursor-pointer"
                  >
                    {[2024, 2025, 2026, 2027].map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {!isCurrentMonthSelected && (
                <button
                  onClick={handleCurrentMonth}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors"
                >
                  This Month
                </button>
              )}

              <button
                onClick={exportMonthlyCsv}
                disabled={!monthlyData?.employees?.length}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Export Monthly CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ERRORS */}
      {(error || monthlyError) && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{viewMode === 'daily' ? error : monthlyError}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 1: DAILY ROSTER                                      */}
      {/* ======================================================== */}
      {viewMode === 'daily' && (
        <div className="space-y-8 animate-fade-in">
          {/* DAILY KPI METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Workforce</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-sans">{roster.length}</p>
              <span className="text-[11px] font-semibold text-slate-500 mt-1 block">Registered employees</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Working Now</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-800 mt-2 font-sans">{summary.workingNowCount}</p>
              <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">Active on workstations</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-sky-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Completed Work</span>
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-sky-900 mt-2 font-sans">{summary.completedShiftCount}</p>
              <span className="text-[11px] font-semibold text-slate-500 mt-1 block">Clocked out today</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Not Clocked In</span>
                <XCircle className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-700 mt-2 font-sans">{summary.absentCount}</p>
              <span className="text-[11px] font-semibold text-slate-400 mt-1 block">No attendance yet</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Total Active Hours</span>
                <Monitor className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-indigo-900 mt-2 font-sans">
                {formatDuration(summary.totalActiveSeconds)}
              </p>
              <span className="text-[11px] font-semibold text-indigo-600 mt-1 block">Productive work focus</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Total Idle Time</span>
                <Moon className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-amber-800 mt-2 font-sans">
                {formatDuration(summary.totalIdleSeconds)}
              </p>
              <span className="text-[11px] font-semibold text-amber-600 mt-1 block">Away from mouse/kb</span>
            </div>
          </div>

          {/* DAILY ROSTER TABLE & FILTERS */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, employee code, department, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Attendance ({roster.length})</option>
                    <option value="PRESENT_ACTIVE">🟢 Working Now ({summary.workingNowCount})</option>
                    <option value="SHIFT_COMPLETED">🔵 Clocked Out / Completed ({summary.completedShiftCount})</option>
                    <option value="ON_BREAK">☕ On Break</option>
                    <option value="IDLE">🟡 Idle / Inactive</option>
                    <option value="ABSENT">⚪ Not Clocked In ({summary.absentCount})</option>
                  </select>
                </div>

                {departments.length > 0 && (
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* DAILY TABLE */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Dept & Designation</th>
                    <th className="py-3.5 px-4">Attendance Status</th>
                    <th className="py-3.5 px-4 font-mono">Clock In</th>
                    <th className="py-3.5 px-4 font-mono">Clock Out</th>
                    <th className="py-3.5 px-4 font-mono">Work Duration</th>
                    <th className="py-3.5 px-4 font-mono text-emerald-700">Active Work</th>
                    <th className="py-3.5 px-4 font-mono text-amber-700">Idle Time</th>
                    <th className="py-3.5 px-4 font-mono text-indigo-700">Breaks</th>
                    <th className="py-3.5 px-4 text-right">Full Tracking</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-semibold">Loading Attendance Data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No attendance records match your search or filter for {dateStr}.
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map((emp) => {
                      const isPresent = emp.attendanceStatus === 'PRESENT_ACTIVE' || emp.currentStatus === 'ACTIVE';
                      const isShiftDone = emp.attendanceStatus === 'SHIFT_COMPLETED';
                      const isBreak = emp.currentStatus === 'BREAK';
                      const isIdle = emp.currentStatus === 'IDLE';

                      return (
                        <tr
                          key={emp.employeeId}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => openFullTracking(emp.employeeId)}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                {emp.name.charAt(0) || 'E'}
                              </div>
                              <div className="min-w-0">
                                <span className="font-extrabold text-slate-900 block truncate group-hover:text-indigo-600 transition-colors">
                                  {emp.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">{emp.employeeCode}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 block">{emp.department || 'General'}</span>
                            <span className="text-[10px] text-slate-400 block">{emp.designation || 'Staff'}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            {isPresent ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Working Now
                              </span>
                            ) : isBreak ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                <Coffee className="w-3 h-3 text-sky-600" />
                                On Break
                              </span>
                            ) : isIdle ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Moon className="w-3 h-3 text-amber-600" />
                                Idle / Away
                              </span>
                            ) : isShiftDone ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-50 text-slate-400 border border-slate-200">
                                <XCircle className="w-3 h-3 text-slate-400" />
                                Not In
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                            {emp.shiftStartedAt ? (
                              new Date(emp.shiftStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                            {emp.shiftEndedAt ? (
                              new Date(emp.shiftEndedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            ) : isPresent || isIdle || isBreak ? (
                              <span className="text-emerald-600 font-bold inline-flex items-center gap-1 text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Working Now
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {emp.totalShiftSeconds > 0 ? formatDuration(emp.totalShiftSeconds) : '—'}
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                            {emp.totalActiveSeconds > 0 ? formatDuration(emp.totalActiveSeconds) : '0m'}
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-amber-600">
                            {emp.totalIdleSeconds > 0 ? formatDuration(emp.totalIdleSeconds) : '0m'}
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                            {emp.totalBreakSeconds > 0 ? formatDuration(emp.totalBreakSeconds) : '0m'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openFullTracking(emp.employeeId);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: MONTHLY ATTENDANCE                                */}
      {/* ======================================================== */}
      {viewMode === 'monthly' && (
        <div className="space-y-8 animate-fade-in">
          {/* MONTHLY KPI SUMMARY CARDS */}
          {monthlyData?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Average Attendance Rate */}
              <div className="bg-white p-5 rounded-2xl border border-indigo-200/90 bg-indigo-50/20 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Attendance Rate</span>
                  <Award className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-indigo-950 mt-2 font-sans">
                  {monthlyData.summary.avgAttendanceRate}%
                </p>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, monthlyData.summary.avgAttendanceRate)}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Workforce average</span>
              </div>

              {/* Total Work Time for Month */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Work Time</span>
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-sans">
                  {formatDuration(monthlyData.summary.companyTotalShiftSeconds)}
                </p>
                <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Logged across team</span>
              </div>

              {/* Active Focus Time */}
              <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Active Work</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-900 mt-2 font-sans">
                  {formatDuration(monthlyData.summary.companyTotalActiveSeconds)}
                </p>
                <span className="text-[10px] font-semibold text-emerald-600 mt-1 block">
                  {monthlyData.summary.companyActiveFocusPercent}% focus ratio
                </span>
              </div>

              {/* Idle Time */}
              <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Inactivity / Idle</span>
                  <Moon className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-amber-900 mt-2 font-sans">
                  {formatDuration(monthlyData.summary.companyTotalIdleSeconds)}
                </p>
                <span className="text-[10px] font-semibold text-amber-600 mt-1 block">Unattended workstations</span>
              </div>

              {/* Breaks */}
              <div className="bg-white p-5 rounded-2xl border border-sky-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Total Breaks</span>
                  <Coffee className="w-4 h-4 text-sky-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-sky-900 mt-2 font-sans">
                  {formatDuration(monthlyData.summary.companyTotalBreakSeconds)}
                </p>
                <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Official recorded breaks</span>
              </div>

              {/* Working Days Elapsed */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Working Days</span>
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-sans">
                  {monthlyData.summary.workingDaysElapsed}
                  <span className="text-base text-slate-400 font-normal"> / {monthlyData.summary.totalWorkingDaysInMonth}</span>
                </p>
                <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Standard days in month</span>
              </div>
            </div>
          )}

          {/* MONTHLY CONTROLS & MATRIX TABLE */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search monthly records by employee, code, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Attendance Rate Filter */}
                <select
                  value={monthlyRateFilter}
                  onChange={(e) => setMonthlyRateFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Attendance Rates</option>
                  <option value="HIGH">🟢 High Attendance (&ge; 90%)</option>
                  <option value="MED">🟡 Average Attendance (70-89%)</option>
                  <option value="LOW">🔴 Low Attendance (&lt; 70%)</option>
                </select>

                {/* Department Filter */}
                {monthlyDepartments.length > 0 && (
                  <select
                    value={monthlyDeptFilter}
                    onChange={(e) => setMonthlyDeptFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Departments</option>
                    {monthlyDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* MONTHLY CALENDAR ATTENDANCE SHEET */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 sticky left-0 bg-slate-50/95 z-20 shadow-xs min-w-[200px]">
                      Employee
                    </th>
                    <th className="py-3.5 px-3 min-w-[85px] text-center">Rate</th>
                    <th className="py-3.5 px-3 min-w-[70px] text-center">Present</th>
                    <th className="py-3.5 px-3 min-w-[90px] text-right font-mono">Work Time</th>
                    <th className="py-3.5 px-3 min-w-[85px] text-right font-mono text-emerald-700">Active</th>

                    {/* Day-by-Day Columns (1 to 28/29/30/31) */}
                    {monthlyData?.days?.map((d) => (
                      <th
                        key={d.day}
                        className={`py-2 px-1 text-center min-w-[38px] border-l border-slate-200 ${
                          d.isToday
                            ? 'bg-indigo-50/80 text-indigo-700'
                            : d.isWeekend
                            ? 'bg-slate-100/60 text-slate-400'
                            : 'text-slate-600'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-medium block">{d.dayOfWeek.slice(0, 2)}</span>
                          <span className={`text-[11px] font-black font-mono block ${d.isToday ? 'text-indigo-600' : ''}`}>
                            {d.day}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {monthlyLoading ? (
                    <tr>
                      <td colSpan={36} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-semibold">Aggregating Monthly Attendance Records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredMonthlyEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={36} className="py-16 text-center text-slate-400">
                        No employees found for this month or matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredMonthlyEmployees.map((emp) => (
                      <tr
                        key={emp.employeeId}
                        onClick={() => setSelectedMonthlyEmp(emp)}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      >
                        {/* Sticky Employee Column */}
                        <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-slate-50/95 z-10 shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                              {emp.name.charAt(0) || 'E'}
                            </div>
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-900 block truncate group-hover:text-indigo-600 transition-colors">
                                {emp.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {emp.employeeCode} • {emp.department || 'Staff'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Attendance Rate */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-black ${
                              emp.attendanceRate >= 90
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : emp.attendanceRate >= 70
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {emp.attendanceRate}%
                          </span>
                        </td>

                        {/* Present Days */}
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          {emp.presentDays}
                          <span className="text-[10px] text-slate-400 font-normal">
                            /{monthlyData?.summary?.workingDaysElapsed || 0}
                          </span>
                        </td>

                        {/* Total Work Hours */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {emp.totalShiftSeconds > 0 ? (emp.totalShiftSeconds / 3600).toFixed(1) + 'h' : '0h'}
                        </td>

                        {/* Active Hours */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          {emp.totalActiveSeconds > 0 ? (emp.totalActiveSeconds / 3600).toFixed(1) + 'h' : '0h'}
                        </td>

                        {/* Day-by-Day Status Cells */}
                        {emp.dailyAttendance.map((d) => {
                          const isLive = d.status === 'PRESENT_ACTIVE';
                          const isPresent = d.status === 'PRESENT';
                          const isWeekend = d.isWeekend;
                          const isFuture = d.isFuture;
                          const isAbsent = d.status === 'ABSENT';

                          const shiftHrs = d.shiftSeconds > 0 ? (d.shiftSeconds / 3600).toFixed(1) + 'h' : '';

                          return (
                            <td
                              key={d.day}
                              title={`${d.dayOfWeek}, ${d.date}\nStatus: ${d.status}\nWork: ${formatDuration(
                                d.shiftSeconds
                              )}\nActive: ${formatDuration(d.activeSeconds)}\nIdle: ${formatDuration(
                                d.idleSeconds
                              )}\nBreak: ${formatDuration(d.breakSeconds)}`}
                              className={`py-2 px-1 text-center border-l border-slate-100 ${
                                d.isToday ? 'bg-indigo-50/40' : isWeekend ? 'bg-slate-50/40' : ''
                              }`}
                            >
                              {isLive ? (
                                <div className="inline-flex flex-col items-center justify-center w-7 h-7 rounded-lg bg-emerald-500 text-white font-black text-[9px] shadow-2xs animate-pulse">
                                  <span>{shiftHrs || 'Live'}</span>
                                </div>
                              ) : isPresent ? (
                                <div className="inline-flex flex-col items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[9px]">
                                  <span>{shiftHrs || 'P'}</span>
                                </div>
                              ) : isWeekend ? (
                                <span className="text-[10px] text-slate-300 font-mono">·</span>
                              ) : isFuture ? (
                                <span className="text-[10px] text-slate-200 font-mono">—</span>
                              ) : isAbsent ? (
                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-md text-rose-500 font-black text-[10px]">
                                  A
                                </div>
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Monthly Legend */}
            <div className="flex items-center gap-6 text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex-wrap">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                  Live
                </span>
                <span>Active Right Now</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-bold flex items-center justify-center">
                  8h
                </span>
                <span>Present (Hours Logged)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 text-rose-500 text-[10px] font-black flex items-center justify-center">
                  A
                </span>
                <span>Absent (Working Day)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300 text-[11px] font-bold">·</span>
                <span>Weekend / Rest Day</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-200 text-[11px] font-bold">—</span>
                <span>Future Day</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: DAILY EMPLOYEE FULL TRACKING                     */}
      {/* ======================================================== */}
      {selectedEmpId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-md shadow-indigo-600/20">
                  {detailData?.profile?.userId?.firstName?.charAt(0) || 'E'}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      {detailData?.profile?.userId?.firstName} {detailData?.profile?.userId?.lastName}
                    </h2>
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md">
                      {detailData?.profile?.employeeCode}
                    </span>
                    <StatusBadge status={detailData?.profile?.currentStatus || ActivityState.OFFLINE} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {detailData?.profile?.department || 'Engineering'} • {detailData?.profile?.designation || 'Staff'} • Full Tracking on {dateStr}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedEmpId(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading ? (
                <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-wider">Loading Full Employee Tracking...</span>
                </div>
              ) : !detailData ? (
                <div className="py-24 text-center text-slate-400">Failed to load detailed telemetry.</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Clock In
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-800 font-mono mt-1 block">
                        {detailData.profile.todayShiftStartedAt
                          ? new Date(detailData.profile.todayShiftStartedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '—'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Clock Out
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-800 font-mono mt-1 block">
                        {detailData.profile.todayShiftEndedAt
                          ? new Date(detailData.profile.todayShiftEndedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : detailData.profile.currentStatus === 'ACTIVE'
                          ? 'Working Now'
                          : '—'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                        Active Focus
                      </span>
                      <span className="text-base sm:text-lg font-black text-emerald-800 font-mono mt-1 block">
                        {formatDuration(detailData.profile.todayActiveSeconds)}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                        Idle Duration
                      </span>
                      <span className="text-base sm:text-lg font-black text-amber-800 font-mono mt-1 block">
                        {formatDuration(detailData.profile.todayIdleSeconds)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                      onClick={() => setModalTab('timeline')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        modalTab === 'timeline'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      Activity Timeline Feed ({detailData.timelineEvents.length})
                    </button>
                    <button
                      onClick={() => setModalTab('apps')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        modalTab === 'apps'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      Applications ({detailData.topApps.length})
                    </button>
                    <button
                      onClick={() => setModalTab('websites')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        modalTab === 'websites'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      Websites ({detailData.topWebsites.length})
                    </button>
                    <button
                      onClick={() => setModalTab('sessions')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        modalTab === 'sessions'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      Work Sessions ({detailData.todaySessions.length})
                    </button>
                  </div>

                  {modalTab === 'timeline' && (
                    <div>
                      <TimelineVisualizer events={detailData.timelineEvents} dateStr={dateStr} />
                    </div>
                  )}

                  {modalTab === 'apps' && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Desktop Applications Tracked
                      </h4>
                      {detailData.topApps.length === 0 ? (
                        <p className="text-xs text-slate-400 py-8 text-center">No desktop applications recorded for this date.</p>
                      ) : (
                        <div className="space-y-3">
                          {detailData.topApps.map((app, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:bg-slate-100/60 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Code2 className="w-4 h-4 text-indigo-600 shrink-0" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-900 block">{app.applicationName}</span>
                                    <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-semibold">{app.category || 'Other'}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                                    {app.lastUsedAt ? `Last active: ${new Date(app.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Tracked today'}
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono font-bold text-indigo-700">{formatDuration(app.totalSeconds)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {modalTab === 'websites' && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Domains & Web Platforms Visited
                      </h4>
                      {detailData.topWebsites.length === 0 ? (
                        <p className="text-xs text-slate-400 py-8 text-center">No web domain activity recorded for this date.</p>
                      ) : (
                        <div className="space-y-3">
                          {detailData.topWebsites.map((web, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:bg-slate-100/60 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-900 block font-mono">{web.domain}</span>
                                    <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-semibold">
                                      {web.browser || 'Google Chrome'}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                                    {web.lastUsedAt ? `Last visited: ${new Date(web.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Visited today'}
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono font-bold text-emerald-700">{formatDuration(web.totalSeconds)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {modalTab === 'sessions' && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Work Attendance Sessions
                      </h4>
                      {detailData.todaySessions.length === 0 ? (
                        <p className="text-xs text-slate-400 py-8 text-center">No work sessions logged for this date.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                          {detailData.todaySessions.map((sess, idx) => (
                            <div key={idx} className="p-4 flex items-center justify-between text-xs bg-slate-50/50">
                              <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                                <div>
                                  <span className="font-extrabold text-slate-900 block">
                                    Session #{idx + 1} • {sess.status}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {new Date(sess.startedAt).toLocaleTimeString()} →{' '}
                                    {sess.endedAt ? new Date(sess.endedAt).toLocaleTimeString() : 'Active Now'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right font-mono">
                                <span className="font-bold text-slate-800 block">
                                  Active: {formatDuration(sess.activeSeconds || 0)}
                                </span>
                                <span className="text-[10px] text-amber-600 font-semibold block">
                                  Idle: {formatDuration(sess.idleSeconds || 0)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedEmpId(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                Close Full Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: MONTHLY EMPLOYEE BREAKDOWN MODAL                 */}
      {/* ======================================================== */}
      {selectedMonthlyEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-md shadow-indigo-600/20">
                  {selectedMonthlyEmp.name.charAt(0) || 'E'}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      {selectedMonthlyEmp.name}
                    </h2>
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md">
                      {selectedMonthlyEmp.employeeCode}
                    </span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-black ${
                        selectedMonthlyEmp.attendanceRate >= 90
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : selectedMonthlyEmp.attendanceRate >= 70
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {selectedMonthlyEmp.attendanceRate}% Attendance
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedMonthlyEmp.department || 'General'} • {selectedMonthlyEmp.designation || 'Staff'} • {monthlyData?.monthLabel} Monthly Breakdown
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMonthlyEmp(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Monthly KPI Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Days Present
                  </span>
                  <span className="text-lg font-black text-slate-900 font-sans mt-1 block">
                    {selectedMonthlyEmp.presentDays}
                    <span className="text-xs text-slate-400 font-normal"> / {monthlyData?.summary?.workingDaysElapsed || 0} days</span>
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Total Work Duration
                  </span>
                  <span className="text-lg font-black text-slate-900 font-mono mt-1 block">
                    {formatDuration(selectedMonthlyEmp.totalShiftSeconds)}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    Active Focus
                  </span>
                  <span className="text-lg font-black text-emerald-800 font-mono mt-1 block">
                    {formatDuration(selectedMonthlyEmp.totalActiveSeconds)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                    {selectedMonthlyEmp.activeFocusPercent}% focus
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                    Idle / Inactivity
                  </span>
                  <span className="text-lg font-black text-amber-800 font-mono mt-1 block">
                    {formatDuration(selectedMonthlyEmp.totalIdleSeconds)}
                  </span>
                </div>
              </div>

              {/* Day-by-Day Monthly Log */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Day-by-Day Attendance History ({monthlyData?.monthLabel})
                </h4>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedMonthlyEmp.dailyAttendance.map((d) => {
                    const isAttended = d.status === 'PRESENT' || d.status === 'PRESENT_ACTIVE';
                    const isWeekend = d.isWeekend;
                    const isFuture = d.isFuture;

                    return (
                      <div
                        key={d.day}
                        className={`p-3.5 flex items-center justify-between text-xs transition-colors ${
                          d.isToday ? 'bg-indigo-50/50' : isWeekend ? 'bg-slate-50/40 text-slate-400' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl font-mono font-bold flex flex-col items-center justify-center text-xs shrink-0 ${
                              d.status === 'PRESENT_ACTIVE'
                                ? 'bg-emerald-500 text-white'
                                : isAttended
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isWeekend
                                ? 'bg-slate-100 text-slate-400'
                                : isFuture
                                ? 'bg-slate-50 text-slate-300'
                                : 'bg-rose-50 text-rose-600 border border-rose-200'
                            }`}
                          >
                            <span className="text-[8px] uppercase">{d.dayOfWeek.slice(0, 2)}</span>
                            <span>{d.day}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 block font-sans">
                                {d.date} ({d.dayOfWeek})
                              </span>
                              {d.isToday && (
                                <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  TODAY
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  d.status === 'PRESENT_ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : isAttended
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : isWeekend
                                    ? 'bg-slate-100 text-slate-500'
                                    : isFuture
                                    ? 'text-slate-400'
                                    : 'bg-rose-50 text-rose-600'
                                }`}
                              >
                                {d.status === 'PRESENT_ACTIVE'
                                  ? 'Active Now'
                                  : isAttended
                                  ? 'Present'
                                  : isWeekend
                                  ? 'Weekend'
                                  : isFuture
                                  ? 'Upcoming'
                                  : 'Absent'}
                              </span>
                            </div>

                            <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                              {d.firstStart ? `In: ${new Date(d.firstStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '—'}{' '}
                              {d.lastEnd ? `• Out: ${new Date(d.lastEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Durations & Split Bar */}
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 block">
                            {d.shiftSeconds > 0 ? formatDuration(d.shiftSeconds) : isWeekend ? 'Rest Day' : '—'}
                          </span>

                          {d.shiftSeconds > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden flex">
                                <div
                                  className="bg-emerald-500 h-1.5"
                                  style={{ width: `${Math.round((d.activeSeconds / d.shiftSeconds) * 100)}%` }}
                                  title={`Active: ${formatDuration(d.activeSeconds)}`}
                                />
                                <div
                                  className="bg-amber-400 h-1.5"
                                  style={{ width: `${Math.round((d.idleSeconds / d.shiftSeconds) * 100)}%` }}
                                  title={`Idle: ${formatDuration(d.idleSeconds)}`}
                                />
                                <div
                                  className="bg-sky-400 h-1.5"
                                  style={{ width: `${Math.round((d.breakSeconds / d.shiftSeconds) * 100)}%` }}
                                  title={`Break: ${formatDuration(d.breakSeconds)}`}
                                />
                              </div>
                              <span className="text-[10px] text-emerald-700 font-mono font-bold">
                                {formatDuration(d.activeSeconds)} act
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedMonthlyEmp(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                Close Monthly View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
