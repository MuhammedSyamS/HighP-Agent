'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/authContext';
import { getSocket } from '../../../lib/socket';
import { formatDuration, getLocalDateString } from '../../../lib/utils';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Coffee,
  Calendar,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Edit2,
  FileText,
  Printer,
  ChevronDown,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  X,
  RefreshCw,
  Coins,
  Sliders,
  Plus,
  Minus,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  Check,
  Info,
  CreditCard,
  Settings2,
  Building2,
  CheckSquare,
  Square,
  Users,
  Award,
  FileCheck
} from 'lucide-react';
import { PayrollSummary, PayrollEmployeeItem, PayrollDailyEntry } from '@highp/shared';

// Converts numerical currency amount into official Indian English words (Lakhs & Crores)
function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Rupees Zero Only';
  const rounded = Math.floor(num);
  const paise = Math.round((num - rounded) * 100);

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  }

  let words = 'Rupees ' + inWords(rounded).trim();
  if (paise > 0) {
    words += ' and ' + inWords(paise).trim() + ' Paise';
  }
  return words + ' Only';
}

type DateFilterType = 'today' | 'week' | 'month' | 'last_month' | 'custom';

export default function PayrollDashboardPage() {
  const { company, user } = useAuth();

  const [dateFilter, setDateFilter] = useState<DateFilterType>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [payIdleTime, setPayIdleTime] = useState<boolean>(true);

  const [payrollData, setPayrollData] = useState<PayrollSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Selected employee for detailed payslip modal
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [empDetailLoading, setEmpDetailLoading] = useState<boolean>(false);
  const [empDetailData, setEmpDetailData] = useState<{
    profile: any;
    summary: PayrollEmployeeItem;
    dailyBreakdown: PayrollDailyEntry[];
  } | null>(null);

  // Edit rate and overtime modal state
  const [editingEmp, setEditingEmp] = useState<PayrollEmployeeItem | null>(null);
  const [editRateValue, setEditRateValue] = useState<number>(25);
  const [editCurrency, setEditCurrency] = useState<string>('INR');
  const [editOtMultiplier, setEditOtMultiplier] = useState<number>(1.5);
  const [editStdHours, setEditStdHours] = useState<number>(8);
  const [editOtRateMode, setEditOtRateMode] = useState<'MULTIPLIER' | 'FIXED'>('MULTIPLIER');
  const [editOtFixedRate, setEditOtFixedRate] = useState<number>(0);
  const [editOtEnabled, setEditOtEnabled] = useState<boolean>(true);
  const [editCustomOtPayment, setEditCustomOtPayment] = useState<number>(0);
  const [editBonus, setEditBonus] = useState<number>(0);
  const [editDeductions, setEditDeductions] = useState<number>(0);
  const [editPayrollNotes, setEditPayrollNotes] = useState<string>('');
  const [isSavingRate, setIsSavingRate] = useState<boolean>(false);
  const [rateSuccessMsg, setRateSuccessMsg] = useState<string>('');
  const [editModalTab, setEditModalTab] = useState<'overtime' | 'base' | 'adjustments'>('overtime');

  // Payment Settlement state
  const [settlementEmp, setSettlementEmp] = useState<PayrollEmployeeItem | null>(null);
  const [settlementStatus, setSettlementStatus] = useState<'PENDING' | 'APPROVED' | 'PAID'>('PAID');
  const [settlementMethod, setSettlementMethod] = useState<'BANK_TRANSFER' | 'UPI' | 'CASH' | 'CHEQUE'>('BANK_TRANSFER');
  const [settlementRef, setSettlementRef] = useState<string>('');
  const [settlementDate, setSettlementDate] = useState<string>(getLocalDateString(new Date()));
  const [isSavingSettlement, setIsSavingSettlement] = useState<boolean>(false);
  const [settlementSuccessMsg, setSettlementSuccessMsg] = useState<string>('');

  // Bulk Company Policy Modal state
  const [isBulkPolicyModalOpen, setIsBulkPolicyModalOpen] = useState<boolean>(false);
  const [bulkStdHours, setBulkStdHours] = useState<number>(8);
  const [bulkOtMultiplier, setBulkOtMultiplier] = useState<number>(1.5);
  const [bulkOtRateMode, setBulkOtRateMode] = useState<'MULTIPLIER' | 'FIXED'>('MULTIPLIER');
  const [bulkOtFixedRate, setBulkOtFixedRate] = useState<number>(250);
  const [bulkOtEnabled, setBulkOtEnabled] = useState<boolean>(true);
  const [bulkHourlyRate, setBulkHourlyRate] = useState<number>(25);
  const [bulkCurrency, setBulkCurrency] = useState<string>('INR');
  const [isApplyingBulkPolicy, setIsApplyingBulkPolicy] = useState<boolean>(false);
  const [bulkPolicySuccessMsg, setBulkPolicySuccessMsg] = useState<string>('');

  // Payout Status filter state ('ALL', 'PENDING', 'APPROVED', 'PAID')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'PAID'>('ALL');

  // Multi-select and Bulk Settlement state
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [isBulkSettlementOpen, setIsBulkSettlementOpen] = useState<boolean>(false);
  const [bulkSettlementStatus, setBulkSettlementStatus] = useState<'PENDING' | 'APPROVED' | 'PAID'>('PAID');
  const [bulkSettlementMethod, setBulkSettlementMethod] = useState<'BANK_TRANSFER' | 'UPI' | 'CASH' | 'CHEQUE'>('BANK_TRANSFER');
  const [bulkSettlementRef, setBulkSettlementRef] = useState<string>('');
  const [bulkSettlementDate, setBulkSettlementDate] = useState<string>(getLocalDateString(new Date()));
  const [isSavingBulkSettlement, setIsSavingBulkSettlement] = useState<boolean>(false);
  const [bulkSettlementSuccessMsg, setBulkSettlementSuccessMsg] = useState<string>('');

  // Payslip modal format ('formal' Indian salary slip vs 'itemized' log)
  const [payslipFormat, setPayslipFormat] = useState<'formal' | 'itemized'>('formal');

  // Calculate default dates according to dateFilter
  const calculateDates = useCallback((filter: DateFilterType) => {
    const today = new Date();
    const todayStr = getLocalDateString(today);

    if (filter === 'today') {
      return { start: todayStr, end: todayStr };
    } else if (filter === 'week') {
      const day = today.getDay(); // 0 is Sunday
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(today);
      monday.setDate(diff);
      return { start: getLocalDateString(monday), end: todayStr };
    } else if (filter === 'month') {
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      return { start: `${y}-${m}-01`, end: todayStr };
    } else if (filter === 'last_month') {
      const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const y = prev.getFullYear();
      const m = String(prev.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      return { start: `${y}-${m}-01`, end: `${y}-${m}-${lastDay}` };
    }
    return { start: startDate || todayStr, end: endDate || todayStr };
  }, [startDate, endDate]);

  useEffect(() => {
    if (dateFilter !== 'custom') {
      const dates = calculateDates(dateFilter);
      setStartDate(dates.start);
      setEndDate(dates.end);
    }
  }, [dateFilter, calculateDates]);

  const fetchPayroll = useCallback(async () => {
    if (!startDate || !endDate) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/payroll/summary', {
        params: {
          startDate,
          endDate,
          department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
          payIdleTime
        }
      });
      if (res.data?.success && res.data?.data) {
        setPayrollData(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch payroll:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch payroll summary.');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, departmentFilter, payIdleTime]);

  useEffect(() => {
    fetchPayroll();

    const socket = getSocket();
    if (!socket) return;

    socket.on('employee:deleted', fetchPayroll);
    socket.on('employee:created', fetchPayroll);

    return () => {
      socket.off('employee:deleted', fetchPayroll);
      socket.off('employee:created', fetchPayroll);
    };
  }, [fetchPayroll]);

  // Load employee detail for payslip modal
  const handleOpenPayslip = async (empId: string) => {
    setSelectedEmpId(empId);
    setEmpDetailLoading(true);
    try {
      const res = await api.get(`/payroll/employee/${empId}`, {
        params: {
          startDate,
          endDate,
          payIdleTime
        }
      });
      if (res.data?.success && res.data?.data) {
        setEmpDetailData(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch employee payslip:', err);
    } finally {
      setEmpDetailLoading(false);
    }
  };

  const handleOpenEditRate = (emp: PayrollEmployeeItem) => {
    setEditingEmp(emp);
    setEditRateValue(emp.hourlyRate != null ? emp.hourlyRate : 25);
    setEditCurrency(emp.currency || 'INR');
    setEditOtMultiplier(emp.overtimeMultiplier != null ? emp.overtimeMultiplier : 1.5);
    setEditStdHours(emp.standardDailyHours != null ? emp.standardDailyHours : 8);
    setEditOtRateMode(emp.overtimeRateMode === 'FIXED' ? 'FIXED' : 'MULTIPLIER');
    setEditOtFixedRate(
      emp.overtimeFixedRate != null && emp.overtimeFixedRate > 0
        ? emp.overtimeFixedRate
        : Math.round((emp.hourlyRate || 25) * (emp.overtimeMultiplier || 1.5) * 100) / 100
    );
    setEditOtEnabled(emp.overtimeEnabled !== false);
    setEditCustomOtPayment(emp.customOvertimePayment || 0);
    setEditBonus(emp.bonus || 0);
    setEditDeductions(emp.deductions || 0);
    setEditPayrollNotes(emp.payrollNotes || '');
    setRateSuccessMsg('');
    setEditModalTab('overtime');
  };

  const handleSaveRate = async () => {
    if (!editingEmp) return;
    setIsSavingRate(true);
    setRateSuccessMsg('');
    try {
      await api.patch(`/payroll/employee/${editingEmp.employeeId}/rate`, {
        hourlyRate: editRateValue,
        currency: editCurrency,
        overtimeMultiplier: editOtMultiplier,
        standardDailyHours: editStdHours,
        overtimeRateMode: editOtRateMode,
        overtimeFixedRate: editOtFixedRate,
        overtimeEnabled: editOtEnabled,
        customOvertimePayment: editCustomOtPayment,
        bonus: editBonus,
        deductions: editDeductions,
        payrollNotes: editPayrollNotes
      });
      setRateSuccessMsg('Payroll and overtime settings saved successfully!');

      if (selectedEmpId === editingEmp.employeeId) {
        handleOpenPayslip(editingEmp.employeeId);
      }

      setTimeout(() => {
        setEditingEmp(null);
        fetchPayroll();
      }, 700);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update payroll details');
    } finally {
      setIsSavingRate(false);
    }
  };

  const handleExportCsv = () => {
    const url = `/api/payroll/export?startDate=${startDate}&endDate=${endDate}&payIdleTime=${payIdleTime}${departmentFilter !== 'ALL' ? `&department=${departmentFilter}` : ''}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payroll_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenSettlement = (emp: PayrollEmployeeItem) => {
    setSettlementEmp(emp);
    setSettlementStatus(emp.paymentStatus || 'PAID');
    setSettlementMethod(emp.paymentMethod || 'BANK_TRANSFER');
    setSettlementRef(emp.paymentReference || '');
    setSettlementDate(emp.paymentDate || getLocalDateString(new Date()));
    setSettlementSuccessMsg('');
  };

  const handleSaveSettlement = async () => {
    if (!settlementEmp) return;
    setIsSavingSettlement(true);
    setSettlementSuccessMsg('');
    try {
      await api.patch(`/payroll/employee/${settlementEmp.employeeId}/payout-status`, {
        paymentStatus: settlementStatus,
        paymentMethod: settlementMethod,
        paymentReference: settlementRef,
        paymentDate: settlementDate
      });
      setSettlementSuccessMsg(`Payout marked as ${settlementStatus}!`);
      setTimeout(() => {
        setSettlementEmp(null);
        fetchPayroll();
      }, 700);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update payout status');
    } finally {
      setIsSavingSettlement(false);
    }
  };

  const handleApplyBulkPolicy = async () => {
    setIsApplyingBulkPolicy(true);
    setBulkPolicySuccessMsg('');
    try {
      const res = await api.post('/payroll/bulk-policy', {
        standardDailyHours: bulkStdHours,
        overtimeMultiplier: bulkOtMultiplier,
        overtimeRateMode: bulkOtRateMode,
        overtimeFixedRate: bulkOtFixedRate,
        overtimeEnabled: bulkOtEnabled,
        defaultHourlyRate: bulkHourlyRate,
        defaultCurrency: bulkCurrency
      });
      setBulkPolicySuccessMsg(res.data?.message || 'Company policy applied successfully!');
      setTimeout(() => {
        setIsBulkPolicyModalOpen(false);
        fetchPayroll();
      }, 900);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to apply company policy');
    } finally {
      setIsApplyingBulkPolicy(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedEmpIds.length === filteredEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(filteredEmployees.map((e) => e.employeeId));
    }
  };

  const handleToggleSelectEmp = (empId: string) => {
    setSelectedEmpIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleOpenBulkSettlement = (status: 'PAID' | 'APPROVED' = 'PAID') => {
    setBulkSettlementStatus(status);
    setBulkSettlementMethod('BANK_TRANSFER');
    setBulkSettlementRef(`BATCH-${getLocalDateString(new Date()).replace(/-/g, '')}`);
    setBulkSettlementDate(getLocalDateString(new Date()));
    setBulkSettlementSuccessMsg('');
    setIsBulkSettlementOpen(true);
  };

  const handleSaveBulkSettlement = async () => {
    if (selectedEmpIds.length === 0) return;
    setIsSavingBulkSettlement(true);
    setBulkSettlementSuccessMsg('');
    try {
      const res = await api.patch('/payroll/bulk-payout-status', {
        employeeIds: selectedEmpIds,
        paymentStatus: bulkSettlementStatus,
        paymentMethod: bulkSettlementMethod,
        paymentReference: bulkSettlementRef,
        paymentDate: bulkSettlementDate
      });
      setBulkSettlementSuccessMsg(
        res.data?.message || `Settlement status updated for ${selectedEmpIds.length} employees.`
      );
      setTimeout(() => {
        setIsBulkSettlementOpen(false);
        setSelectedEmpIds([]);
        fetchPayroll();
      }, 800);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update bulk settlement status');
    } finally {
      setIsSavingBulkSettlement(false);
    }
  };

  // Departments list for filter
  const departments = useMemo(() => {
    if (!payrollData?.items) return ['ALL'];
    const depts = new Set<string>();
    payrollData.items.forEach((i) => {
      if (i.department) depts.add(i.department);
    });
    return ['ALL', ...Array.from(depts)];
  }, [payrollData]);

  // Counts by payout status
  const payoutStatusCounts = useMemo(() => {
    if (!payrollData?.items) return { ALL: 0, PENDING: 0, APPROVED: 0, PAID: 0 };
    let pending = 0;
    let approved = 0;
    let paid = 0;
    payrollData.items.forEach((i) => {
      if (i.paymentStatus === 'PAID') paid++;
      else if (i.paymentStatus === 'APPROVED') approved++;
      else pending++;
    });
    return { ALL: payrollData.items.length, PENDING: pending, APPROVED: approved, PAID: paid };
  }, [payrollData]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    if (!payrollData?.items) return [];
    return payrollData.items.filter((emp) => {
      const matchesSearch =
        searchQuery === '' ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PENDING' && (emp.paymentStatus === 'PENDING' || !emp.paymentStatus)) ||
        emp.paymentStatus === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [payrollData, searchQuery, departmentFilter, statusFilter]);

  // Aggregate stats for selected employees
  const selectedEmployeesSummary = useMemo(() => {
    if (!payrollData?.items || selectedEmpIds.length === 0) {
      return { count: 0, totalNet: 0, totalHours: 0 };
    }
    const selected = payrollData.items.filter((emp) => selectedEmpIds.includes(emp.employeeId));
    const totalNet = selected.reduce((sum, e) => {
      const net = e.netPay ?? (e.grossPay + (e.bonus || 0) - (e.deductions || 0));
      return sum + net;
    }, 0);
    const totalHours = selected.reduce((sum, e) => sum + e.totalHours, 0);
    return {
      count: selected.length,
      totalNet: Math.round(totalNet * 100) / 100,
      totalHours: Math.round(totalHours * 10) / 10
    };
  }, [payrollData, selectedEmpIds]);

  const currencySymbol = useMemo(() => {
    const c = payrollData?.currency || 'INR';
    if (c === 'EUR') return '€';
    if (c === 'GBP') return '£';
    if (c === 'USD') return '$';
    if (c === 'CAD' || c === 'AUD') return '$';
    return '₹';
  }, [payrollData?.currency]);

  return (
    <div className="p-4 sm:p-7 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Payroll & Hourly Salary Calculation
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Accurate time-tracked compensation, overtime multipliers & idle activity accounting
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsBulkPolicyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-violet-50 hover:bg-violet-100 text-violet-700 transition-colors"
            title="Configure company-wide overtime and shift policy"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Company Policy
          </button>
          <button
            onClick={fetchPayroll}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Refresh payroll data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCsv}
            disabled={isLoading || !payrollData?.items?.length}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Configuration Toolbar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Date Filters */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto text-xs font-bold">
            {(['today', 'week', 'month', 'last_month', 'custom'] as DateFilterType[]).map((f) => {
              const labels: Record<DateFilterType, string> = {
                today: 'Today',
                week: 'This Week',
                month: 'This Month',
                last_month: 'Last Month',
                custom: 'Custom Range'
              };
              const active = dateFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => setDateFilter(f)}
                  className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                    active
                      ? 'bg-white text-indigo-700 shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>

          {/* Billable Idle Time Policy Toggle */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-2xl">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-700">Idle Time Billable:</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-xl text-[11px] font-bold">
              <button
                onClick={() => setPayIdleTime(true)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  payIdleTime
                    ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Pay employees for total shift time (Active + Idle)"
              >
                Paid (Active + Idle)
              </button>
              <button
                onClick={() => setPayIdleTime(false)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  !payIdleTime
                    ? 'bg-white text-rose-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Deduct inactive desk time, paying only verified active software time"
              >
                Deduct Idle (Active Only)
              </button>
            </div>
          </div>
        </div>

        {/* Date inputs (if custom) + Search & Department Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-slate-100 flex-wrap">
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>
          )}

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee, designation, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Department:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? 'All Departments' : d}
                </option>
              ))}
            </select>
          </div>

          {/* Payout Status Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-bold overflow-x-auto">
            {(['ALL', 'PENDING', 'APPROVED', 'PAID'] as const).map((st) => {
              const count = payoutStatusCounts[st];
              const active = statusFilter === st;
              const labels = {
                ALL: 'All Statuses',
                PENDING: 'Pending',
                APPROVED: 'Approved',
                PAID: 'Paid'
              };
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    active
                      ? 'bg-white text-indigo-700 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{labels[st]}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 font-extrabold'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Take-Home Payroll */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Net Payout
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
              {currencySymbol}
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {currencySymbol}
              {payrollData ? (payrollData.totalNetPay ?? payrollData.totalGrossPay).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>Gross: {currencySymbol}{payrollData ? payrollData.totalGrossPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
            <span className="text-emerald-600 font-bold">
              {payrollData?.settlementRate ? `${payrollData.settlementRate}% Settled` : 'Take-home'}
            </span>
          </div>
          {payrollData && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-emerald-600">Paid: {currencySymbol}{(payrollData.totalPaidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                <span className="text-amber-600">Pending: {currencySymbol}{(payrollData.totalPendingAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, payrollData.settlementRate || 0))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Total Paid Hours */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Paid Hours
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-indigo-700 tracking-tight">
              {payrollData ? payrollData.totalBillableHours.toFixed(1) : '0.0'} <span className="text-base font-bold text-indigo-400">hrs</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <span className="text-emerald-600 font-bold">{payrollData ? payrollData.totalActiveHours.toFixed(1) : 0}h active</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">{payrollData ? payrollData.totalIdleHours.toFixed(1) : 0}h idle</span>
          </div>
        </div>

        {/* Overtime Pay & Hours */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Overtime Compensation
            </span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-violet-700 tracking-tight">
              {currencySymbol}
              {payrollData ? payrollData.totalOvertimePay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>{payrollData ? payrollData.totalOvertimeHours.toFixed(1) : 0} overtime hrs logged</span>
            <span className="text-violet-600 font-bold">OT Premium</span>
          </div>
        </div>

        {/* Bonus & Deductions / Idle Impact */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Incentives & Deductions
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              <span className="text-emerald-600">+{currencySymbol}{payrollData ? (payrollData.totalBonus || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}</span>
              <span className="text-slate-300 mx-1.5">/</span>
              <span className="text-rose-600">-{currencySymbol}{payrollData ? (payrollData.totalDeductions || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <span>
              Net Adj: {((payrollData?.totalBonus || 0) - (payrollData?.totalDeductions || 0)) >= 0 ? '+' : ''}
              {currencySymbol}{((payrollData?.totalBonus || 0) - (payrollData?.totalDeductions || 0)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Payroll Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Employee Compensation Roster
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Period: {startDate} to {endDate} ({filteredEmployees.length} Employee{filteredEmployees.length === 1 ? '' : 's'})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Avg Wage:</span>
            <span className="text-xs font-mono font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-xl">
              {currencySymbol}{payrollData?.avgHourlyRate.toFixed(2)}/hr
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 pl-5 pr-2 font-extrabold w-10">
                  <input
                    type="checkbox"
                    checked={filteredEmployees.length > 0 && selectedEmpIds.length === filteredEmployees.length}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title="Select / Deselect all"
                  />
                </th>
                <th className="py-3.5 px-3 font-extrabold">Employee</th>
                <th className="py-3.5 px-3 font-extrabold">Base Wage & OT Mode</th>
                <th className="py-3.5 px-3 font-extrabold text-emerald-700">Active Work</th>
                <th className="py-3.5 px-3 font-extrabold text-indigo-700">Paid Hours</th>
                <th className="py-3.5 px-3 font-extrabold">Regular Pay</th>
                <th className="py-3.5 px-3 font-extrabold text-violet-700">Overtime</th>
                <th className="py-3.5 px-3 font-extrabold text-amber-700">Bonus / Ded.</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-900">Net Salary</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-800">Payout Status</th>
                <th className="py-3.5 pl-3 pr-6 font-extrabold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 font-semibold">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    Calculating payroll and overtime compensation...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 font-semibold">
                    No employee payroll records found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const effectiveOtRate = emp.effectiveOtRate ?? (
                    emp.overtimeRateMode === 'FIXED'
                      ? (emp.overtimeFixedRate || 0)
                      : emp.hourlyRate * (emp.overtimeMultiplier || 1.5)
                  );
                  const netPay = emp.netPay ?? (emp.grossPay + (emp.bonus || 0) - (emp.deductions || 0));
                  const isSelected = selectedEmpIds.includes(emp.employeeId);
                  const totalTime = emp.activeSeconds + emp.idleSeconds;
                  const activeRatio = totalTime > 0 ? Math.round((emp.activeSeconds / totalTime) * 100) : 100;

                  return (
                    <tr
                      key={emp.employeeId}
                      className={`transition-colors ${
                        isSelected ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-4 pl-5 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectEmp(emp.employeeId)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Employee Info */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {emp.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-900 block truncate hover:text-indigo-600 transition-colors">
                              {emp.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <span className="font-mono text-slate-500">{emp.employeeCode}</span>
                              <span>•</span>
                              <span>{emp.designation || emp.department || 'Staff'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Hourly Rate & OT Mode */}
                      <td className="py-4 px-3 font-mono">
                        <div className="flex flex-col gap-1 items-start">
                          <button
                            onClick={() => handleOpenEditRate(emp)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-800 font-bold transition-all text-xs"
                            title="Click to edit rate & overtime"
                          >
                            <span>{currencySymbol}{emp.hourlyRate.toFixed(2)}/h</span>
                            <Edit2 className="w-2.5 h-2.5 text-slate-400" />
                          </button>
                          <div>
                            {emp.overtimeEnabled === false ? (
                              <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                                OT Disabled
                              </span>
                            ) : emp.overtimeRateMode === 'FIXED' ? (
                              <span className="text-[10px] text-violet-700 font-bold bg-violet-50 px-1.5 py-0.5 rounded">
                                Fixed {currencySymbol}{emp.overtimeFixedRate || 0}/h OT
                              </span>
                            ) : (
                              <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                                {emp.overtimeMultiplier || 1.5}x ({currencySymbol}{effectiveOtRate.toFixed(1)}/h)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Active Work Time & Ratio */}
                      <td className="py-4 px-3 font-mono font-bold text-emerald-600">
                        {formatDuration(emp.activeSeconds)}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[9px] font-sans font-bold px-1.5 py-0.2 rounded-full ${
                              activeRatio >= 80
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {activeRatio}% Active
                          </span>
                          {emp.idleSeconds > 0 && (
                            <span className="text-[10px] text-amber-600 font-normal font-mono">
                              +{formatDuration(emp.idleSeconds)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Billable Hours */}
                      <td className="py-4 px-3 font-mono font-extrabold text-indigo-700">
                        {emp.totalHours.toFixed(1)} hrs
                        <span className="block text-[10px] text-slate-400 font-semibold font-sans">
                          {emp.daysWorked} shift{emp.daysWorked === 1 ? '' : 's'} · {emp.daysWorked > 0 ? (emp.totalHours / emp.daysWorked).toFixed(1) : 0}h/avg
                        </span>
                      </td>

                      {/* Regular Pay */}
                      <td className="py-4 px-3 font-mono font-bold text-slate-700">
                        {currencySymbol}{emp.regularPay.toFixed(2)}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {emp.regularHours.toFixed(1)}h regular
                        </span>
                      </td>

                      {/* Overtime Pay */}
                      <td className="py-4 px-3 font-mono font-bold text-violet-700">
                        {(emp.overtimeHours > 0 || (emp.customOvertimePayment && emp.customOvertimePayment > 0)) ? (
                          <>
                            <div>{currencySymbol}{emp.overtimePay.toFixed(2)}</div>
                            <div className="text-[10px] text-violet-500 font-normal">
                              +{emp.overtimeHours.toFixed(1)}h logged
                              {emp.customOvertimePayment ? ` (+${currencySymbol}${emp.customOvertimePayment} adj)` : ''}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Bonus / Deductions */}
                      <td className="py-4 px-3 font-mono text-xs">
                        {((emp.bonus || 0) > 0 || (emp.deductions || 0) > 0) ? (
                          <div className="space-y-0.5">
                            {(emp.bonus || 0) > 0 && (
                              <div className="text-emerald-600 font-bold text-[11px]">
                                +{currencySymbol}{(emp.bonus || 0).toFixed(2)}
                              </div>
                            )}
                            {(emp.deductions || 0) > 0 && (
                              <div className="text-rose-600 font-bold text-[11px]">
                                -{currencySymbol}{(emp.deductions || 0).toFixed(2)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Net Salary */}
                      <td className="py-4 px-3 font-mono">
                        <div className="text-sm font-black text-slate-900">
                          {currencySymbol}{netPay.toFixed(2)}
                        </div>
                        {((emp.bonus || 0) > 0 || (emp.deductions || 0) > 0) && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            Gross: {currencySymbol}{emp.grossPay.toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Payout Settlement Status */}
                      <td className="py-4 px-3 font-mono">
                        <button
                          onClick={() => handleOpenSettlement(emp)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-extrabold text-[11px] transition-all border ${
                            emp.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 shadow-2xs'
                              : emp.paymentStatus === 'APPROVED'
                              ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                          }`}
                          title="Click to update settlement & payment method"
                        >
                          {emp.paymentStatus === 'PAID' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Paid</span>
                            </>
                          ) : emp.paymentStatus === 'APPROVED' ? (
                            <>
                              <Check className="w-3 h-3 text-blue-600" />
                              <span>Approved</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>Pending</span>
                            </>
                          )}
                        </button>
                        {emp.paymentReference && (
                          <span className="block text-[10px] text-slate-400 font-sans mt-0.5 truncate max-w-[100px]" title={emp.paymentReference}>
                            Ref: {emp.paymentReference}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-3 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditRate(emp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-extrabold text-xs transition-colors"
                            title="Edit Hourly Rate, Overtime & Adjustments"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Edit Pay</span>
                          </button>
                          <button
                            onClick={() => handleOpenPayslip(emp.employeeId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Payslip</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FLOATING BATCH ACTION DOCK */}
      {selectedEmpIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200 flex-wrap sm:flex-nowrap justify-between">
          <div className="flex items-center gap-3 pr-3 border-r border-slate-700">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md shadow-indigo-600/30">
              {selectedEmpIds.length}
            </div>
            <div>
              <span className="text-xs font-bold block text-slate-100 leading-tight">
                {selectedEmpIds.length} Employee{selectedEmpIds.length > 1 ? 's' : ''} Selected
              </span>
              <span className="text-[10px] text-slate-400">
                {selectedEmployeesSummary.totalHours.toFixed(1)} total hours
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
            <span className="text-xs text-slate-400 font-medium">Batch Net:</span>
            <span className="text-sm font-mono font-black text-emerald-400">
              {currencySymbol}{selectedEmployeesSummary.totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenBulkSettlement('PAID')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30 active:scale-95"
              title="Mark all selected employees as Paid"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Paid</span>
            </button>
            <button
              onClick={() => handleOpenBulkSettlement('APPROVED')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30 active:scale-95"
              title="Mark all selected employees as Approved"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark Approved</span>
            </button>
            <button
              onClick={() => setSelectedEmpIds([])}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* DETAILED PAYSLIP MODAL */}
      {selectedEmpId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/20">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Salary Slip & Earnings Statement
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {company?.name || 'HighP Organization'} • Period: {startDate} to {endDate}
                  </p>
                </div>
              </div>

              {/* Format Switcher & Actions */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setPayslipFormat('formal')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      payslipFormat === 'formal'
                        ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Official Slip
                  </button>
                  <button
                    onClick={() => setPayslipFormat('itemized')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      payslipFormat === 'itemized'
                        ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Daily Log
                  </button>
                </div>

                <button
                  onClick={() => {
                    const currentEmp = payrollData?.items.find((i) => i.employeeId === selectedEmpId);
                    if (currentEmp) handleOpenEditRate(currentEmp);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs transition-colors"
                  title="Edit Overtime & Payroll Settings"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Edit Pay</span>
                </button>
                <button
                  onClick={() => {
                    const currentEmp = payrollData?.items.find((i) => i.employeeId === selectedEmpId);
                    if (currentEmp) handleOpenSettlement(currentEmp);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors"
                  title="Update Payout Settlement"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Settle</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                  title="Print Payslip"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedEmpId(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {empDetailLoading ? (
                <div className="py-16 text-center text-slate-400 font-semibold">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  Generating payslip breakdown...
                </div>
              ) : empDetailData ? (
                <>
                  {payslipFormat === 'formal' ? (
                    /* ============================================================ */
                    /* OFFICIAL INDIAN FORMAL SALARY CERTIFICATE / PAYSLIP VIEW     */
                    /* ============================================================ */
                    <div className="space-y-6 bg-white p-2">
                      {/* Formal Letterhead */}
                      <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                              {company?.name || 'HighP Technologies'}
                            </h2>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Automated Productivity & Compensation System • Employee Pay Voucher
                          </p>
                        </div>
                        <div className="text-left sm:text-right font-mono">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            Payslip Ref No.
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            SLIP-{empDetailData.summary.employeeCode}-{startDate.replace(/-/g, '')}
                          </span>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5 font-sans">
                            Period: {startDate} to {endDate}
                          </div>
                        </div>
                      </div>

                      {/* Employee Profile Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Employee Name
                          </span>
                          <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                            {empDetailData.summary.name}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            ID: {empDetailData.summary.employeeCode}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Department & Role
                          </span>
                          <span className="text-sm font-bold text-slate-800 block mt-0.5 truncate">
                            {empDetailData.summary.designation || 'Staff'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {empDetailData.summary.department || 'General'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Base Wage & Mode
                          </span>
                          <span className="text-sm font-mono font-extrabold text-indigo-700 block mt-0.5">
                            {currencySymbol}{empDetailData.summary.hourlyRate.toFixed(2)}/hr
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Shift: {empDetailData.summary.standardDailyHours || 8}h/day
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Settlement Status
                          </span>
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                empDetailData.summary.paymentStatus === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : empDetailData.summary.paymentStatus === 'APPROVED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {empDetailData.summary.paymentStatus === 'PAID' ? '✓ Settled & Paid' : empDetailData.summary.paymentStatus === 'APPROVED' ? 'Approved for Payout' : 'Pending Settlement'}
                            </span>
                          </div>
                          {empDetailData.summary.paymentMethod && (
                            <span className="text-[10px] text-slate-400 block mt-1">
                              Via {empDetailData.summary.paymentMethod.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Attendance & Time Compliance Summary */}
                      <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                        <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900 mb-2.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          Attendance & Activity Compliance Summary
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                          <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Shifts Worked</span>
                            <span className="font-extrabold text-slate-900 font-mono text-sm">
                              {empDetailData.summary.daysWorked} Days
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Regular Hours</span>
                            <span className="font-extrabold text-slate-900 font-mono text-sm">
                              {empDetailData.summary.regularHours.toFixed(1)} hrs
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                            <span className="text-[10px] text-violet-600 block font-bold uppercase">Overtime Logged</span>
                            <span className="font-extrabold text-violet-700 font-mono text-sm">
                              {empDetailData.summary.overtimeHours.toFixed(1)} hrs
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                            <span className="text-[10px] text-emerald-600 block font-bold uppercase">Active Work</span>
                            <span className="font-extrabold text-emerald-700 font-mono text-sm">
                              {formatDuration(empDetailData.summary.activeSeconds)}
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Productivity Index</span>
                            <span className="font-extrabold text-indigo-700 font-mono text-sm">
                              {Math.round(
                                (empDetailData.summary.activeSeconds /
                                  Math.max(1, empDetailData.summary.activeSeconds + empDetailData.summary.idleSeconds)) *
                                  100
                              )}
                              % Active
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Standard Two-Column Earnings vs Deductions Table */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Column 1: Earnings */}
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                          <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
                              Earnings
                            </span>
                            <span className="text-xs font-bold text-slate-500">Amount ({currencySymbol})</span>
                          </div>
                          <div className="divide-y divide-slate-100 text-xs font-mono">
                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-slate-700 font-sans">
                                Regular Wage ({empDetailData.summary.regularHours.toFixed(1)} hrs @ {currencySymbol}{empDetailData.summary.hourlyRate}/h)
                              </span>
                              <span className="font-bold text-slate-900">
                                {currencySymbol}{empDetailData.summary.regularPay.toFixed(2)}
                              </span>
                            </div>

                            <div className="px-4 py-2.5 flex items-center justify-between">
                              <span className="text-slate-700 font-sans">
                                Overtime Compensation ({empDetailData.summary.overtimeHours.toFixed(1)} hrs)
                              </span>
                              <span className="font-bold text-violet-700">
                                +{currencySymbol}{empDetailData.summary.overtimePay.toFixed(2)}
                              </span>
                            </div>

                            {(empDetailData.summary.customOvertimePayment || 0) > 0 && (
                              <div className="px-4 py-2.5 flex items-center justify-between">
                                <span className="text-slate-700 font-sans">Manual OT Adjustment</span>
                                <span className="font-bold text-violet-700">
                                  +{currencySymbol}{(empDetailData.summary.customOvertimePayment || 0).toFixed(2)}
                                </span>
                              </div>
                            )}

                            {(empDetailData.summary.bonus || 0) > 0 && (
                              <div className="px-4 py-2.5 flex items-center justify-between">
                                <span className="text-slate-700 font-sans">Performance Bonus / Incentive</span>
                                <span className="font-bold text-emerald-600">
                                  +{currencySymbol}{(empDetailData.summary.bonus || 0).toFixed(2)}
                                </span>
                              </div>
                            )}

                            <div className="px-4 py-3 bg-slate-50/70 flex items-center justify-between border-t border-slate-200 font-bold">
                              <span className="text-slate-900 font-sans uppercase text-[11px] tracking-wider">
                                Total Gross Earnings
                              </span>
                              <span className="text-sm font-black text-slate-900">
                                {currencySymbol}{empDetailData.summary.grossPay.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Deductions */}
                        <div className="border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between">
                          <div>
                            <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                              <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
                                Deductions
                              </span>
                              <span className="text-xs font-bold text-slate-500">Amount ({currencySymbol})</span>
                            </div>
                            <div className="divide-y divide-slate-100 text-xs font-mono">
                              {!payIdleTime && empDetailData.summary.idleSeconds > 0 && (
                                <div className="px-4 py-2.5 flex items-center justify-between">
                                  <span className="text-slate-700 font-sans">
                                    Unpaid Inactivity ({formatDuration(empDetailData.summary.idleSeconds)})
                                  </span>
                                  <span className="font-bold text-rose-600">
                                    Excluded
                                  </span>
                                </div>
                              )}

                              {(empDetailData.summary.deductions || 0) > 0 ? (
                                <div className="px-4 py-2.5 flex items-center justify-between">
                                  <span className="text-slate-700 font-sans">
                                    Standard Deductions / TDS
                                  </span>
                                  <span className="font-bold text-rose-600">
                                    -{currencySymbol}{(empDetailData.summary.deductions || 0).toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <div className="px-4 py-2.5 flex items-center justify-between text-slate-400 font-sans">
                                  <span>Statutory / Tax Deductions</span>
                                  <span>{currencySymbol}0.00</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="px-4 py-3 bg-slate-50/70 flex items-center justify-between border-t border-slate-200 font-bold text-xs font-mono">
                            <span className="text-slate-900 font-sans uppercase text-[11px] tracking-wider">
                              Total Deductions
                            </span>
                            <span className="text-sm font-black text-rose-600">
                              -{currencySymbol}{(empDetailData.summary.deductions || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Net Take-Home Salary Block */}
                      <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">
                            Net Take-Home Salary Payable
                          </span>
                          <span className="text-3xl font-black text-emerald-950 font-mono mt-1 block">
                            {currencySymbol}{(empDetailData.summary.netPay ?? empDetailData.summary.grossPay).toFixed(2)}
                          </span>
                          <span className="text-xs font-semibold text-emerald-900 mt-1 block">
                            Amount in Words: {numberToIndianWords(empDetailData.summary.netPay ?? empDetailData.summary.grossPay)}
                          </span>
                        </div>

                        {empDetailData.summary.paymentReference && (
                          <div className="text-left sm:text-right font-mono text-xs text-emerald-900 bg-white/70 px-4 py-2 rounded-xl border border-emerald-200">
                            <span className="text-[10px] text-emerald-700 uppercase font-bold block">
                              Transaction Reference
                            </span>
                            <span className="font-black text-slate-900">{empDetailData.summary.paymentReference}</span>
                            {empDetailData.summary.paymentDate && (
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                Disbursed: {empDetailData.summary.paymentDate}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Official Signatures Section */}
                      <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-300 text-xs">
                        <div>
                          <div className="border-b border-slate-400 w-44 mb-2" />
                          <span className="font-bold text-slate-900 block">Employee Signature</span>
                          <span className="text-[10px] text-slate-500">I confirm the above hours and wages are verified.</span>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="border-b border-slate-400 w-44 mb-2" />
                          <span className="font-bold text-slate-900 block">Authorized Signatory</span>
                          <span className="text-[10px] text-slate-500 font-medium">For {company?.name || 'Company Seal'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ============================================================ */
                    /* ITEMIZED LOG BREAKDOWN VIEW                                  */
                    /* ============================================================ */
                    <>
                      {/* Employee & Compensation Summary Card */}
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Employee Name
                          </span>
                          <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                            {empDetailData.summary.name}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {empDetailData.summary.employeeCode}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Role & Dept
                          </span>
                          <span className="font-bold text-slate-800 text-sm mt-0.5 block truncate">
                            {empDetailData.summary.designation || 'Staff'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {empDetailData.summary.department || 'General'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Base Wage & OT Rate
                          </span>
                          <span className="font-mono font-extrabold text-indigo-700 text-sm mt-0.5 block">
                            {currencySymbol}{empDetailData.summary.hourlyRate.toFixed(2)}/hr
                          </span>
                          <span className="text-[11px] text-violet-600 font-semibold block">
                            {empDetailData.summary.overtimeEnabled === false ? (
                              'OT Disabled'
                            ) : empDetailData.summary.overtimeRateMode === 'FIXED' ? (
                              `OT: Fixed ${currencySymbol}${empDetailData.summary.overtimeFixedRate || 0}/hr`
                            ) : (
                              `OT: ${empDetailData.summary.overtimeMultiplier || 1.5}x (${currencySymbol}${(empDetailData.summary.effectiveOtRate || empDetailData.summary.hourlyRate * (empDetailData.summary.overtimeMultiplier || 1.5)).toFixed(2)}/hr)`
                            )}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Net Take-Home Salary
                          </span>
                          <span className="font-mono font-black text-emerald-600 text-base mt-0.5 block">
                            {currencySymbol}{(empDetailData.summary.netPay ?? empDetailData.summary.grossPay).toFixed(2)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Gross: {currencySymbol}{empDetailData.summary.grossPay.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Earnings Calculation Breakdown Box */}
                      <div className="bg-gradient-to-r from-indigo-50/80 to-violet-50/80 border border-indigo-100 rounded-2xl p-4.5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                              Compensation Breakdown
                            </h4>
                            <p className="text-xs text-indigo-700/90 mt-0.5">
                              Standard Shift Threshold: {empDetailData.summary.standardDailyHours || 8}h/day
                            </p>
                          </div>
                          <div className="text-right shrink-0 font-mono space-y-0.5">
                            <div className="text-xs text-slate-700">
                              Regular Pay: <span className="font-bold text-slate-900">{currencySymbol}{empDetailData.summary.regularPay.toFixed(2)}</span>
                              <span className="text-[10px] text-slate-400 ml-1">({empDetailData.summary.regularHours.toFixed(1)}h)</span>
                            </div>
                            <div className="text-xs text-violet-700 font-semibold">
                              Overtime Pay: <span className="font-bold">+{currencySymbol}{empDetailData.summary.overtimePay.toFixed(2)}</span>
                              <span className="text-[10px] text-violet-500 ml-1">({empDetailData.summary.overtimeHours.toFixed(1)}h)</span>
                            </div>
                            {(empDetailData.summary.customOvertimePayment || 0) > 0 && (
                              <div className="text-[11px] text-violet-600 font-medium">
                                Manual OT Adj: +{currencySymbol}{(empDetailData.summary.customOvertimePayment || 0).toFixed(2)}
                              </div>
                            )}
                            {(empDetailData.summary.bonus || 0) > 0 && (
                              <div className="text-xs text-emerald-600 font-bold">
                                Bonus / Incentive: +{currencySymbol}{(empDetailData.summary.bonus || 0).toFixed(2)}
                              </div>
                            )}
                            {(empDetailData.summary.deductions || 0) > 0 && (
                              <div className="text-xs text-rose-600 font-bold">
                                Deductions: -{currencySymbol}{(empDetailData.summary.deductions || 0).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>

                        {empDetailData.summary.payrollNotes && (
                          <div className="pt-2 border-t border-indigo-100/60 text-xs text-indigo-950 flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 shrink-0 text-indigo-600 mt-0.5" />
                            <div>
                              <span className="font-bold">Payroll Notes: </span>
                              <span>{empDetailData.summary.payrollNotes}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Daily Itemized Breakdown Table */}
                      <div>
                        <h4 className="text-xs font-black text-slate-900 mb-2.5 uppercase tracking-wider">
                          Daily Attendance & Wage Records
                        </h4>
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                                <th className="py-2.5 px-3 font-extrabold">Date</th>
                                <th className="py-2.5 px-3 font-extrabold">Active Work</th>
                                <th className="py-2.5 px-3 font-extrabold">Idle Time</th>
                                <th className="py-2.5 px-3 font-extrabold">Billable Hours</th>
                                <th className="py-2.5 px-3 font-extrabold">Reg / OT</th>
                                <th className="py-2.5 px-3 font-extrabold text-right">Daily Earnings</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono">
                              {empDetailData.dailyBreakdown.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="py-6 text-center text-slate-400 font-sans">
                                    No attendance records recorded for this date range.
                                  </td>
                                </tr>
                              ) : (
                                empDetailData.dailyBreakdown.map((row) => (
                                  <tr key={row.date} className="hover:bg-slate-50/60">
                                    <td className="py-2.5 px-3 font-bold text-slate-800">
                                      {row.date} <span className="text-[10px] text-slate-400 font-normal">({row.dayOfWeek})</span>
                                    </td>
                                    <td className="py-2.5 px-3 text-emerald-600 font-bold">
                                      {formatDuration(row.activeSeconds)}
                                    </td>
                                    <td className="py-2.5 px-3 text-amber-600">
                                      {formatDuration(row.idleSeconds)}
                                    </td>
                                    <td className="py-2.5 px-3 text-indigo-700 font-bold">
                                      {(row.billableSeconds / 3600).toFixed(1)} hrs
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-600">
                                      {row.regularHours.toFixed(1)}h {row.overtimeHours > 0 ? `+ ${row.overtimeHours.toFixed(1)}h OT` : ''}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-black text-slate-900">
                                      {currencySymbol}{row.dailyEarnings.toFixed(2)}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedEmpId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE EDIT PAYROLL & OVERTIME MODAL */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-500/20">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Edit Payroll & Overtime Settings
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingEmp.name} • <span className="font-mono">{editingEmp.employeeCode}</span> • {editingEmp.designation || editingEmp.department || 'Staff'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingEmp(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="px-6 pt-3 border-b border-slate-100 flex items-center gap-2 bg-white">
              <button
                onClick={() => setEditModalTab('overtime')}
                className={`pb-3 px-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-all ${
                  editModalTab === 'overtime'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Overtime Settings</span>
              </button>
              <button
                onClick={() => setEditModalTab('base')}
                className={`pb-3 px-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-all ${
                  editModalTab === 'base'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Base Wage & Shifts</span>
              </button>
              <button
                onClick={() => setEditModalTab('adjustments')}
                className={`pb-3 px-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-all ${
                  editModalTab === 'adjustments'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Bonuses & Deductions</span>
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* TAB 1: OVERTIME SETTINGS */}
              {editModalTab === 'overtime' && (
                <div className="space-y-4">
                  {/* Overtime Toggle */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">
                        Enable Overtime Calculation
                      </span>
                      <p className="text-[11px] text-slate-500 font-medium">
                        When enabled, hours exceeding standard shift duration will receive overtime payment.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditOtEnabled(!editOtEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        editOtEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          editOtEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {editOtEnabled && (
                    <>
                      {/* Overtime Calculation Mode Selector */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">
                          Overtime Rate Calculation Mode
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setEditOtRateMode('MULTIPLIER')}
                            className={`p-3.5 rounded-2xl border text-left transition-all ${
                              editOtRateMode === 'MULTIPLIER'
                                ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black text-slate-900">Multiplier Mode</span>
                              {editOtRateMode === 'MULTIPLIER' && (
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Based on standard hourly rate multiplier (e.g., 1.5x, 2.0x base wage)
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditOtRateMode('FIXED')}
                            className={`p-3.5 rounded-2xl border text-left transition-all ${
                              editOtRateMode === 'FIXED'
                                ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black text-slate-900">Custom Fixed Rate</span>
                              {editOtRateMode === 'FIXED' && (
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Set a dedicated fixed payment amount per overtime hour
                            </p>
                          </button>
                        </div>
                      </div>

                      {/* Mode Specific Inputs */}
                      {editOtRateMode === 'MULTIPLIER' ? (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 block">
                            Overtime Multiplier
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.1"
                              min="1"
                              max="4"
                              value={editOtMultiplier}
                              onChange={(e) => setEditOtMultiplier(parseFloat(e.target.value) || 1.5)}
                              className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                            />
                            <div className="flex items-center gap-1.5">
                              {[1.25, 1.5, 1.75, 2.0].map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => setEditOtMultiplier(m)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    editOtMultiplier === m
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {m}x
                                </button>
                              ))}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Effective Overtime Rate: <span className="font-bold text-violet-700">{currencySymbol}{(editRateValue * editOtMultiplier).toFixed(2)}/hr</span>
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">
                            Fixed Overtime Hourly Rate ({currencySymbol} / hour)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                              {currencySymbol}
                            </span>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={editOtFixedRate}
                              onChange={(e) => setEditOtFixedRate(parseFloat(e.target.value) || 0)}
                              className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                              placeholder="e.g. 250"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400">
                            This fixed amount will be applied to every hour worked beyond the daily threshold.
                          </p>
                        </div>
                      )}

                      {/* Threshold shift hours and manual overtime adjustments */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Shift Threshold (Hours/day)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            max="24"
                            value={editStdHours}
                            onChange={(e) => setEditStdHours(parseFloat(e.target.value) || 8)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            Hours worked past this limit per day count as OT.
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Manual OT Adjustment ({currencySymbol})
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                              {currencySymbol}
                            </span>
                            <input
                              type="number"
                              step="10"
                              min="0"
                              value={editCustomOtPayment}
                              onChange={(e) => setEditCustomOtPayment(parseFloat(e.target.value) || 0)}
                              className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                              placeholder="0"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Direct flat addition to overtime payment.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 2: BASE WAGE & SHIFTS */}
              {editModalTab === 'base' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Standard Hourly Base Rate ({currencySymbol} / hour)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                        {currencySymbol}
                      </span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={editRateValue}
                        onChange={(e) => setEditRateValue(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Wages calculated for active/billable work within standard shift hours.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Currency
                    </label>
                    <select
                      value={editCurrency}
                      onChange={(e) => setEditCurrency(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="INR">INR (₹) - Indian Rupee (Default)</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                      <option value="AED">AED (د.إ) - UAE Dirham</option>
                      <option value="CAD">CAD ($) - Canadian Dollar</option>
                      <option value="AUD">AUD ($) - Australian Dollar</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 3: BONUSES, DEDUCTIONS & NOTES */}
              {editModalTab === 'adjustments' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-emerald-800 block mb-1">
                        Performance Bonus / Allowance ({currencySymbol})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-emerald-500 text-xs">
                          +{currencySymbol}
                        </span>
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={editBonus}
                          onChange={(e) => setEditBonus(parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-950 focus:outline-none focus:border-emerald-500"
                          placeholder="0"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Added to employee gross salary.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-rose-800 block mb-1">
                        Salary Deductions / Advance ({currencySymbol})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-rose-500 text-xs">
                          -{currencySymbol}
                        </span>
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={editDeductions}
                          onChange={(e) => setEditDeductions(parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 bg-rose-50/50 border border-rose-200 rounded-xl text-xs font-bold text-rose-950 focus:outline-none focus:border-rose-500"
                          placeholder="0"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Deducted from final net payout.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Payroll Remarks & Notes
                    </label>
                    <textarea
                      rows={3}
                      value={editPayrollNotes}
                      onChange={(e) => setEditPayrollNotes(e.target.value)}
                      placeholder="e.g., Overtime approved by Lead, festival bonus included, etc."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* LIVE CALCULATION PREVIEW BOX */}
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-950 text-white shadow-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Live Calculation Preview
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Active Formula
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-white/10 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Base Rate</span>
                    <span className="font-bold text-white">{currencySymbol}{editRateValue.toFixed(2)}/h</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">OT Rate</span>
                    <span className="font-bold text-violet-300">
                      {!editOtEnabled
                        ? 'Disabled'
                        : editOtRateMode === 'FIXED'
                        ? `${currencySymbol}${editOtFixedRate.toFixed(2)}/h`
                        : `${currencySymbol}${(editRateValue * editOtMultiplier).toFixed(2)}/h`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Shift Limit</span>
                    <span className="font-bold text-indigo-300">{editStdHours}h/day</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Net Adjustments</span>
                    <span className="font-bold text-emerald-300">
                      {((editBonus + editCustomOtPayment) - editDeductions) >= 0 ? '+' : ''}
                      {currencySymbol}{((editBonus + editCustomOtPayment) - editDeductions).toFixed(2)}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-sans border-t border-white/10 pt-2">
                  Sample 10-hour shift payout: Standard 8h ({currencySymbol}{(editRateValue * 8).toFixed(2)}) + 2h OT ({currencySymbol}{(!editOtEnabled ? 0 : (editOtRateMode === 'FIXED' ? editOtFixedRate * 2 : (editRateValue * editOtMultiplier) * 2)).toFixed(2)}) + Adj ({currencySymbol}{((editBonus + editCustomOtPayment) - editDeductions).toFixed(2)}) = <span className="text-emerald-400 font-bold">{currencySymbol}{((editRateValue * 8) + (!editOtEnabled ? 0 : (editOtRateMode === 'FIXED' ? editOtFixedRate * 2 : (editRateValue * editOtMultiplier) * 2)) + (editBonus + editCustomOtPayment) - editDeductions).toFixed(2)}</span>
                </p>
              </div>

              {rateSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{rateSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                All changes update immediately and re-calculate historical totals.
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRate}
                  disabled={isSavingRate}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingRate ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Apply Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* PAYMENT SETTLEMENT STATUS MODAL */}
      {settlementEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Payment Settlement
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {settlementEmp.name} • <span className="font-mono">{settlementEmp.employeeCode}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSettlementEmp(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Net Payout Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    Net Take-Home Payout
                  </span>
                  <span className="text-2xl font-black text-emerald-950 font-mono">
                    {currencySymbol}{settlementEmp.netPay.toFixed(2)}
                  </span>
                </div>
                <div className="text-right text-[11px] text-emerald-700 font-semibold">
                  <div>Period: {startDate}</div>
                  <div>to {endDate}</div>
                </div>
              </div>

              {/* Status Picker */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Settlement Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PAID', 'APPROVED', 'PENDING'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSettlementStatus(st)}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all ${
                        settlementStatus === st
                          ? st === 'PAID'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : st === 'APPROVED'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Payment Method
                </label>
                <select
                  value={settlementMethod}
                  onChange={(e) => setSettlementMethod(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="CASH">Cash Payout</option>
                  <option value="CHEQUE">Bank Cheque</option>
                </select>
              </div>

              {/* Reference / UTR Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Transaction UTR / Reference ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR202610118942 or Cheque #0045"
                  value={settlementRef}
                  onChange={(e) => setSettlementRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Settlement Date */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Disbursement Date
                </label>
                <input
                  type="date"
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {settlementSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{settlementSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSettlementEmp(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettlement}
                disabled={isSavingSettlement}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingSettlement ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Settlement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK COMPANY OVERTIME & SHIFT POLICY MODAL */}
      {isBulkPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-violet-500/20">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Company-Wide Overtime & Shift Policy
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Configure standard rules and apply them across all employees in {company?.name || 'Workspace'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkPolicyModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Overtime Toggle */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-900 block">
                    Company Overtime Calculation
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Allow all employees to accrue overtime beyond daily threshold.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBulkOtEnabled(!bulkOtEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    bulkOtEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      bulkOtEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Standard Daily Shift Hours */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Standard Daily Shift Duration (Hours before OT triggers)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  value={bulkStdHours}
                  onChange={(e) => setBulkStdHours(parseFloat(e.target.value) || 8)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Standard benchmark shift length (typically 8.0 hours).
                </p>
              </div>

              {/* Overtime Mode */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Overtime Calculation Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBulkOtRateMode('MULTIPLIER')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      bulkOtRateMode === 'MULTIPLIER'
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-xs font-black text-slate-900 mb-0.5">Multiplier Mode</div>
                    <p className="text-[10px] text-slate-500">Standard multiplier on base hourly pay</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkOtRateMode('FIXED')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      bulkOtRateMode === 'FIXED'
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-xs font-black text-slate-900 mb-0.5">Custom Fixed Rate</div>
                    <p className="text-[10px] text-slate-500">Fixed rate per overtime hour</p>
                  </button>
                </div>
              </div>

              {/* Mode Specific Inputs */}
              {bulkOtRateMode === 'MULTIPLIER' ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Default Overtime Multiplier
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="4"
                      value={bulkOtMultiplier}
                      onChange={(e) => setBulkOtMultiplier(parseFloat(e.target.value) || 1.5)}
                      className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex items-center gap-1.5">
                      {[1.25, 1.5, 1.75, 2.0].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setBulkOtMultiplier(m)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            bulkOtMultiplier === m
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {m}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Fixed Overtime Hourly Rate ({currencySymbol} / hour)
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    value={bulkOtFixedRate}
                    onChange={(e) => setBulkOtFixedRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    placeholder="250"
                  />
                </div>
              )}

              {/* Currency */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Default Currency
                </label>
                <select
                  value={bulkCurrency}
                  onChange={(e) => setBulkCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="INR">INR (₹) - Indian Rupee (Default)</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                </select>
              </div>

              {/* Informational Notice */}
              <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
                <span>
                  Clicking <strong>Apply Policy to All Employees</strong> will update standard shift hours and overtime configuration across all active employee profiles in your workspace.
                </span>
              </div>

              {bulkPolicySuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{bulkPolicySuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsBulkPolicyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkPolicy}
                disabled={isApplyingBulkPolicy}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isApplyingBulkPolicy ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Applying Policy...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Policy to All Employees</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK PAYMENT SETTLEMENT MODAL */}
      {isBulkSettlementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Bulk Payment Settlement
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Batch update for {selectedEmpIds.length} selected employee{selectedEmpIds.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkSettlementOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Batch Net Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    Combined Batch Net Payout
                  </span>
                  <span className="text-2xl font-black text-emerald-950 font-mono">
                    {currencySymbol}{selectedEmployeesSummary.totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right text-[11px] text-emerald-700 font-semibold">
                  <div>{selectedEmpIds.length} Recipients</div>
                  <div className="text-[10px] text-emerald-600 font-normal">Period: {startDate} to {endDate}</div>
                </div>
              </div>

              {/* Selected Employees Preview Chips */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Selected Employees ({selectedEmpIds.length})
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                  {payrollData?.items
                    ?.filter((e) => selectedEmpIds.includes(e.employeeId))
                    .map((emp) => (
                      <span
                        key={emp.employeeId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-800 shadow-2xs"
                      >
                        <span>{emp.name}</span>
                        <span className="font-mono text-emerald-600 font-bold">
                          {currencySymbol}{(emp.netPay ?? (emp.grossPay + (emp.bonus || 0) - (emp.deductions || 0))).toFixed(0)}
                        </span>
                      </span>
                    ))}
                </div>
              </div>

              {/* Status Picker */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Set Settlement Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PAID', 'APPROVED', 'PENDING'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setBulkSettlementStatus(st)}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all ${
                        bulkSettlementStatus === st
                          ? st === 'PAID'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : st === 'APPROVED'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Payment Method
                </label>
                <select
                  value={bulkSettlementMethod}
                  onChange={(e) => setBulkSettlementMethod(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS Batch)</option>
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="CASH">Cash Disbursement</option>
                  <option value="CHEQUE">Bank Cheque</option>
                </select>
              </div>

              {/* Reference / UTR Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Batch Transaction UTR / Reference ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. BATCH-NEFT-20261011-01"
                  value={bulkSettlementRef}
                  onChange={(e) => setBulkSettlementRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Settlement Date */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Disbursement Date
                </label>
                <input
                  type="date"
                  value={bulkSettlementDate}
                  onChange={(e) => setBulkSettlementDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {bulkSettlementSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{bulkSettlementSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsBulkSettlementOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBulkSettlement}
                disabled={isSavingBulkSettlement}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingBulkSettlement ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Applying Batch Payout...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply to {selectedEmpIds.length} Employees</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
