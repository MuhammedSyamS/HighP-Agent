'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/authContext';
import { formatDuration } from '../../../lib/utils';
import { StatusBadge } from '../../../components/StatusBadge';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Briefcase,
  DollarSign,
  TrendingUp,
  Clock,
  Shield,
  ShieldCheck,
  Building,
  Mail,
  Key,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowUpRight,
  AlertTriangle
} from 'lucide-react';
import { UserRole, ActivityState } from '@highp/shared';

const PREDEFINED_ROLES = [
  'Graphic Designer',
  'Developer',
  'Digital Marketer',
  'Founder',
  'Videographer',
  'Editor',
  'Other'
];

interface EmployeeRecord {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    status: string;
  };
  employeeCode: string;
  department: string;
  designation: string;
  hourlyRate?: number;
  currency?: string;
  overtimeMultiplier?: number;
  standardDailyHours?: number;
  currentStatus: ActivityState;
  currentApplication?: string;
  todayActiveSeconds?: number;
  todayIdleSeconds?: number;
  todayBreakSeconds?: number;
  lastActiveAt?: string;
  createdAt: string;
}

export default function EmployeesManagementPage() {
  const { user, company } = useAuth();

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Add Employee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: 'Password@123',
    employeeCode: '',
    selectedRole: 'Developer',
    customRole: '',
    department: 'Engineering & Development',
    systemRole: UserRole.EMPLOYEE,
    hourlyRate: 25,
    currency: 'USD',
    overtimeMultiplier: 1.5,
    standardDailyHours: 8
  });
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [addError, setAddError] = useState<string>('');

  // Edit Employee Modal State
  const [editingEmp, setEditingEmp] = useState<EmployeeRecord | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeCode: '',
    selectedRole: 'Developer',
    customRole: '',
    department: '',
    systemRole: UserRole.EMPLOYEE,
    hourlyRate: 25,
    currency: 'USD',
    overtimeMultiplier: 1.5,
    standardDailyHours: 8,
    status: 'ACTIVE'
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editError, setEditError] = useState<string>('');

  // Remove / Delete Employee Modal State
  const [deletingEmp, setDeletingEmp] = useState<EmployeeRecord | null>(null);
  const [deletePermanent, setDeletePermanent] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string>('');

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/employees');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setEmployees(res.data.data);
      } else {
        setEmployees([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch employees roster:', err);
      setError(err?.response?.data?.message || 'Failed to load employee list');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Generate Suggested Employee Code
  const generateSuggestedCode = useCallback(() => {
    let maxNum = 0;
    for (const emp of employees) {
      if (emp.employeeCode) {
        const match = emp.employeeCode.match(/^HP-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    }
    const nextNum = Math.max(maxNum + 1, employees.length + 1);
    return `HP-${String(nextNum).padStart(3, '0')}`;
  }, [employees]);

  const handleOpenAddModal = () => {
    const suggested = generateSuggestedCode();
    setAddForm({
      firstName: '',
      lastName: '',
      email: '',
      password: 'Password@123',
      employeeCode: suggested,
      selectedRole: 'Developer',
      customRole: '',
      department: 'Engineering & Development',
      systemRole: UserRole.EMPLOYEE,
      hourlyRate: 25,
      currency: 'USD',
      overtimeMultiplier: 1.5,
      standardDailyHours: 8
    });
    setAddError('');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setIsAdding(true);

    const finalRole =
      addForm.selectedRole === 'Other'
        ? addForm.customRole.trim() || 'Other'
        : addForm.selectedRole;

    try {
      await api.post('/employees', {
        email: addForm.email.trim().toLowerCase(),
        firstName: addForm.firstName.trim(),
        lastName: addForm.lastName.trim(),
        password: addForm.password || 'Password@123',
        employeeCode: addForm.employeeCode.trim().toUpperCase(),
        department: addForm.department.trim() || finalRole,
        designation: finalRole,
        role: addForm.systemRole,
        hourlyRate: Number(addForm.hourlyRate),
        currency: addForm.currency,
        overtimeMultiplier: Number(addForm.overtimeMultiplier),
        standardDailyHours: Number(addForm.standardDailyHours)
      });

      setIsAddModalOpen(false);
      setSuccessMsg(`Employee ${addForm.firstName} ${addForm.lastName} added successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchEmployees();
    } catch (err: any) {
      setAddError(err?.response?.data?.message || 'Failed to create employee');
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenEditModal = (emp: EmployeeRecord) => {
    setEditingEmp(emp);
    const existingDesignation = emp.designation || '';
    const isPredefined = PREDEFINED_ROLES.includes(existingDesignation);

    setEditForm({
      firstName: emp.userId?.firstName || '',
      lastName: emp.userId?.lastName || '',
      email: emp.userId?.email || '',
      employeeCode: emp.employeeCode || '',
      selectedRole: isPredefined ? existingDesignation : (existingDesignation ? 'Other' : 'Developer'),
      customRole: isPredefined ? '' : existingDesignation,
      department: emp.department || '',
      systemRole: emp.userId?.role || UserRole.EMPLOYEE,
      hourlyRate: emp.hourlyRate != null ? emp.hourlyRate : 25,
      currency: emp.currency || 'USD',
      overtimeMultiplier: emp.overtimeMultiplier != null ? emp.overtimeMultiplier : 1.5,
      standardDailyHours: emp.standardDailyHours != null ? emp.standardDailyHours : 8,
      status: emp.userId?.status || 'ACTIVE'
    });
    setEditError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    setEditError('');
    setIsEditing(true);

    const finalRole =
      editForm.selectedRole === 'Other'
        ? editForm.customRole.trim() || 'Other'
        : editForm.selectedRole;

    try {
      await api.patch(`/employees/${editingEmp._id}`, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim().toLowerCase(),
        employeeCode: editForm.employeeCode.trim().toUpperCase(),
        department: editForm.department.trim() || finalRole,
        designation: finalRole,
        role: editForm.systemRole,
        hourlyRate: Number(editForm.hourlyRate),
        currency: editForm.currency,
        overtimeMultiplier: Number(editForm.overtimeMultiplier),
        standardDailyHours: Number(editForm.standardDailyHours),
        status: editForm.status
      });

      setEditingEmp(null);
      setSuccessMsg('Employee details updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchEmployees();
    } catch (err: any) {
      setEditError(err?.response?.data?.message || 'Failed to update employee details');
    } finally {
      setIsEditing(false);
    }
  };

  const handleOpenDeleteModal = (emp: EmployeeRecord) => {
    setDeletingEmp(emp);
    setDeletePermanent(false);
    setDeleteError('');
  };

  const handleDeleteSubmit = async () => {
    if (!deletingEmp) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      await api.delete(`/employees/${deletingEmp._id}${deletePermanent ? '?permanent=true' : ''}`);
      setDeletingEmp(null);
      setSuccessMsg(
        deletePermanent
          ? 'Employee permanently removed from system.'
          : 'Employee marked as inactive.'
      );
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchEmployees();
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || 'Failed to remove employee');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const u = emp.userId;
      const fullName = `${u?.firstName || ''} ${u?.lastName || ''}`.toLowerCase();
      const email = (u?.email || '').toLowerCase();
      const code = (emp.employeeCode || '').toLowerCase();
      const desig = (emp.designation || '').toLowerCase();
      const dept = (emp.department || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        email.includes(q) ||
        code.includes(q) ||
        desig.includes(q) ||
        dept.includes(q);

      const matchesRole =
        roleFilter === 'ALL' ||
        emp.designation === roleFilter ||
        (roleFilter === 'Other' && !PREDEFINED_ROLES.slice(0, -1).includes(emp.designation));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && emp.currentStatus === ActivityState.ACTIVE) ||
        (statusFilter === 'IDLE' && emp.currentStatus === ActivityState.IDLE) ||
        (statusFilter === 'OFFLINE' && emp.currentStatus === ActivityState.OFFLINE) ||
        (statusFilter === 'INACTIVE' && emp.userId?.status === 'INACTIVE');

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [employees, searchQuery, roleFilter, statusFilter]);

  // Metrics KPI calculations
  const totalEmployeesCount = employees.length;
  const activeNowCount = employees.filter((e) => e.currentStatus === ActivityState.ACTIVE).length;
  const workingCount = employees.filter(
    (e) => e.currentStatus === ActivityState.ACTIVE || e.currentStatus === ActivityState.IDLE
  ).length;
  const avgHourlyRate =
    totalEmployeesCount > 0
      ? employees.reduce((acc, e) => acc + (e.hourlyRate || 25), 0) / totalEmployeesCount
      : 0;

  return (
    <div className="p-4 sm:p-7 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Employee Management
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Add, edit profile details, configure hourly rates & overtime rules, or remove employees
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchEmployees}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Refresh employee roster"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Error Notice */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Employees
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {totalEmployeesCount}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-semibold">Registered roster members</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Right Now
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-emerald-700 tracking-tight">
              {activeNowCount}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-semibold">
            {workingCount} total on shift (active + idle)
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Avg Hourly Wage
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              ${avgHourlyRate.toFixed(2)}
              <span className="text-sm font-bold text-slate-400">/hr</span>
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-semibold">Base compensation rate</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Overtime Threshold
            </span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-violet-700 tracking-tight">
              8.0 <span className="text-sm font-bold text-violet-400">hrs/day</span>
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-semibold">Standard overtime rate: 1.5x</p>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, email, designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Roles</option>
              {PREDEFINED_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Now</option>
              <option value="IDLE">Idle</option>
              <option value="OFFLINE">Offline</option>
              <option value="INACTIVE">Inactive / Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Employee Directory Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Staff & Team Roster
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Showing {filteredEmployees.length} of {employees.length} employees
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 pl-6 pr-3 font-extrabold">Employee</th>
                <th className="py-3.5 px-3 font-extrabold">Designation & Department</th>
                <th className="py-3.5 px-3 font-extrabold">System Role</th>
                <th className="py-3.5 px-3 font-extrabold">Compensation & OT</th>
                <th className="py-3.5 px-3 font-extrabold">Live Telemetry</th>
                <th className="py-3.5 pl-3 pr-6 font-extrabold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading employee directory...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No employees found matching the specified filters.
                    <div className="mt-3">
                      <button
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm hover:bg-indigo-500"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Add New Employee
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const u = emp.userId;
                  const fullName = `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || emp.employeeCode;
                  const isInactive = u?.status === 'INACTIVE';
                  const rate = emp.hourlyRate != null ? emp.hourlyRate : 25;
                  const otMult = emp.overtimeMultiplier != null ? emp.overtimeMultiplier : 1.5;
                  const stdHours = emp.standardDailyHours != null ? emp.standardDailyHours : 8;
                  const curr = emp.currency || 'USD';

                  return (
                    <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Employee Info */}
                      <td className="py-4 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-900 block truncate">
                              {fullName}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <span className="font-mono text-slate-500 font-bold">{emp.employeeCode}</span>
                              <span>•</span>
                              <span className="truncate">{u?.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Designation & Department */}
                      <td className="py-4 px-3">
                        <span className="font-bold text-slate-800 block truncate">
                          {emp.designation || 'Team Member'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium block truncate">
                          {emp.department || 'General'}
                        </span>
                      </td>

                      {/* System Role */}
                      <td className="py-4 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                            u?.role === UserRole.ADMIN || u?.role === UserRole.OWNER
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : u?.role === UserRole.MANAGER
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {u?.role === UserRole.ADMIN || u?.role === UserRole.OWNER
                            ? 'Admin'
                            : u?.role === UserRole.MANAGER
                            ? 'Manager'
                            : 'Employee'}
                        </span>
                      </td>

                      {/* Compensation & Overtime */}
                      <td className="py-4 px-3 font-mono">
                        <div className="font-bold text-slate-900 text-xs">
                          ${rate.toFixed(2)}/h
                        </div>
                        <div className="text-[10px] text-violet-600 font-bold">
                          {otMult}x OT (${(rate * otMult).toFixed(2)}/h after {stdHours}h)
                        </div>
                      </td>

                      {/* Live Telemetry / Status */}
                      <td className="py-4 px-3">
                        {isInactive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            Suspended
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <StatusBadge status={emp.currentStatus} />
                            {emp.todayActiveSeconds ? (
                              <div className="text-[10px] font-mono text-slate-400">
                                {formatDuration(emp.todayActiveSeconds)} active
                              </div>
                            ) : null}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-3 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail Profile */}
                          <Link
                            to={`/dashboard/employees/${emp._id}`}
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                            title="View Employee Profile & Activity"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Edit Employee */}
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                            title="Edit Employee Information & Rates"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Remove Employee */}
                          <button
                            onClick={() => handleOpenDeleteModal(emp)}
                            className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove or Deactivate Employee"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* ================= ADD EMPLOYEE MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Add New Employee</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Create employee profile, set designation & compensation rates
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {addError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.firstName}
                    onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                    placeholder="e.g. Alex"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.lastName}
                    onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                    placeholder="e.g. Morgan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="alex@company.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="Password@123"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Employee Code & Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Employee Code *</label>
                  <input
                    type="text"
                    required
                    value={addForm.employeeCode}
                    onChange={(e) => setAddForm({ ...addForm, employeeCode: e.target.value.toUpperCase() })}
                    placeholder="HP-001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">System Permissions *</label>
                  <select
                    value={addForm.systemRole}
                    onChange={(e) => setAddForm({ ...addForm, systemRole: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value={UserRole.EMPLOYEE}>Employee (Workspace Only)</option>
                    <option value={UserRole.MANAGER}>Manager (Team Telemetry)</option>
                    <option value={UserRole.ADMIN}>Admin (Full Access)</option>
                  </select>
                </div>
              </div>

              {/* Role / Designation Dropdown */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Designation / Role Title *
                </label>
                <select
                  value={addForm.selectedRole}
                  onChange={(e) => setAddForm({ ...addForm, selectedRole: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500"
                >
                  {PREDEFINED_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {addForm.selectedRole === 'Other' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      required
                      value={addForm.customRole}
                      onChange={(e) => setAddForm({ ...addForm, customRole: e.target.value })}
                      placeholder="Enter custom role or designation title..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Department</label>
                <input
                  type="text"
                  value={addForm.department}
                  onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                  placeholder="e.g. Design & Creative / Engineering"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Compensation & Overtime Calculation Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-black text-slate-900 block uppercase tracking-wider text-[10px]">
                  Compensation & Overtime Policy
                </span>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Hourly Rate ($)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={addForm.hourlyRate}
                      onChange={(e) => setAddForm({ ...addForm, hourlyRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">OT Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="3"
                      value={addForm.overtimeMultiplier}
                      onChange={(e) =>
                        setAddForm({ ...addForm, overtimeMultiplier: parseFloat(e.target.value) || 1.5 })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Daily Shift (hrs)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="24"
                      value={addForm.standardDailyHours}
                      onChange={(e) =>
                        setAddForm({ ...addForm, standardDailyHours: parseFloat(e.target.value) || 8 })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-violet-50 text-violet-800 text-[11px] font-semibold flex items-center justify-between">
                  <span>Calculated Overtime Pay Rate:</span>
                  <span className="font-mono font-bold text-violet-900">
                    ${(addForm.hourlyRate * addForm.overtimeMultiplier).toFixed(2)}/hr (after {addForm.standardDailyHours}h)
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {isAdding ? 'Adding Employee...' : 'Confirm & Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT EMPLOYEE MODAL ================= */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Edit Employee Profile</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {editingEmp.userId?.firstName} {editingEmp.userId?.lastName} ({editingEmp.employeeCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingEmp(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Email & Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Employee Code *</label>
                  <input
                    type="text"
                    required
                    value={editForm.employeeCode}
                    onChange={(e) => setEditForm({ ...editForm, employeeCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Role / Designation Dropdown */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Designation / Role Title *
                </label>
                <select
                  value={editForm.selectedRole}
                  onChange={(e) => setEditForm({ ...editForm, selectedRole: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500"
                >
                  {PREDEFINED_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {editForm.selectedRole === 'Other' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      required
                      value={editForm.customRole}
                      onChange={(e) => setEditForm({ ...editForm, customRole: e.target.value })}
                      placeholder="Enter custom role or designation title..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Department & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE (Active access)</option>
                    <option value="INACTIVE">INACTIVE (Access suspended)</option>
                  </select>
                </div>
              </div>

              {/* System Permissions */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">System Permissions *</label>
                <select
                  value={editForm.systemRole}
                  onChange={(e) => setEditForm({ ...editForm, systemRole: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value={UserRole.EMPLOYEE}>Employee (Workspace Only)</option>
                  <option value={UserRole.MANAGER}>Manager (Team Telemetry)</option>
                  <option value={UserRole.ADMIN}>Admin (Full Access)</option>
                </select>
              </div>

              {/* Compensation & Overtime calculation */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-black text-slate-900 block uppercase tracking-wider text-[10px]">
                  Compensation & Overtime Configuration
                </span>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Hourly Rate ($)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={editForm.hourlyRate}
                      onChange={(e) => setEditForm({ ...editForm, hourlyRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">OT Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="3"
                      value={editForm.overtimeMultiplier}
                      onChange={(e) =>
                        setEditForm({ ...editForm, overtimeMultiplier: parseFloat(e.target.value) || 1.5 })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Daily Shift (hrs)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="24"
                      value={editForm.standardDailyHours}
                      onChange={(e) =>
                        setEditForm({ ...editForm, standardDailyHours: parseFloat(e.target.value) || 8 })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-violet-50 text-violet-800 text-[11px] font-semibold flex items-center justify-between">
                  <span>Calculated Overtime Pay Rate:</span>
                  <span className="font-mono font-bold text-violet-900">
                    ${(editForm.hourlyRate * editForm.overtimeMultiplier).toFixed(2)}/hr (after {editForm.standardDailyHours}h)
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {isEditing ? 'Saving Changes...' : 'Save Employee Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= REMOVE / DELETE MODAL ================= */}
      {deletingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 text-center mb-1">
              Remove Employee
            </h3>
            <p className="text-slate-500 text-center mb-4">
              Are you sure you want to remove <span className="font-bold text-slate-800">{deletingEmp.userId?.firstName} {deletingEmp.userId?.lastName}</span> ({deletingEmp.employeeCode})?
            </p>

            {deleteError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deletePermanent}
                  onChange={(e) => setDeletePermanent(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold text-slate-800 block">
                    Permanently Delete from System
                  </span>
                  <span className="text-[11px] text-slate-400 block font-normal">
                    If checked, employee record and credentials are deleted completely. If unchecked, the account is deactivated and suspended.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingEmp(null)}
                className="px-4 py-2.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isDeleting
                  ? 'Removing...'
                  : deletePermanent
                  ? 'Permanently Delete'
                  : 'Deactivate Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
