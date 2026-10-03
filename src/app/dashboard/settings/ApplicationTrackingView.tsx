'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../../lib/api';
import {
  Search,
  Plus,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Edit2,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Radio,
  FileCode,
  Shield,
  HelpCircle,
  Check
} from 'lucide-react';
import { ITrackedApplication, IDiscoveredApplication } from '../../../shared/types';
import { STANDARD_APPLICATION_CATEGORIES } from '../../../shared/constants';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Development: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  Design: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  Communication: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  Browsers: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Productivity: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  Marketing: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  'Project Management': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  'File Management': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  Media: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  Other: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' }
};

export const ApplicationTrackingView: React.FC = () => {
  const [applications, setApplications] = useState<ITrackedApplication[]>([]);
  const [discoveredApps, setDiscoveredApps] = useState<IDiscoveredApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TRACKED' | 'IGNORED'>('ALL');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [discoveredConvertId, setDiscoveredConvertId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Development');
  const [formExecutables, setFormExecutables] = useState('');
  const [formPaths, setFormPaths] = useState('');
  const [formTracked, setFormTracked] = useState(true);
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notification Banner
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [appsRes, discRes] = await Promise.all([
        api.get('/applications'),
        api.get('/applications/discovered')
      ]);

      if (appsRes.data?.data) {
        setApplications(appsRes.data.data);
      }
      if (discRes.data?.data) {
        setDiscoveredApps(discRes.data.data);
      }
    } catch (err) {
      console.error('[ApplicationTrackingView] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // Toggle Tracking Status ON / OFF
  const handleToggleTracking = async (app: ITrackedApplication) => {
    const newTracked = !app.tracked;
    // Optimistic UI update
    setApplications((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, tracked: newTracked, ignored: !newTracked } : a))
    );

    try {
      await api.patch(`/applications/${app.id}/tracking`, { tracked: newTracked });
      showSuccess(`Tracking for "${app.name}" turned ${newTracked ? 'ON' : 'OFF'}.`);
    } catch (err: any) {
      console.error('[ApplicationTrackingView] Toggle error:', err);
      // Rollback on failure
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, tracked: app.tracked, ignored: app.ignored } : a))
      );
    }
  };

  // Delete Application
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the Application Registry?`)) {
      return;
    }

    try {
      await api.delete(`/applications/${id}`);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      showSuccess(`"${name}" removed from registry.`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete application');
    }
  };

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingId(null);
    setDiscoveredConvertId(null);
    setFormName('');
    setFormCategory('Development');
    setFormExecutables('');
    setFormPaths('');
    setFormTracked(true);
    setModalError('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (app: ITrackedApplication) => {
    setEditingId(app.id);
    setDiscoveredConvertId(null);
    setFormName(app.name);
    setFormCategory(app.category);
    setFormExecutables(app.executableNames.join(', '));
    setFormPaths((app.executablePaths || []).join('\n'));
    setFormTracked(app.tracked);
    setModalError('');
    setIsModalOpen(true);
  };

  // Convert Discovered App to Registered Tracked App
  const handleQuickTrackDiscovered = (disc: IDiscoveredApplication) => {
    const rawBase = disc.executableName.replace(/\.exe$/i, '');
    const cleanName = rawBase.charAt(0).toUpperCase() + rawBase.slice(1);
    setEditingId(null);
    setDiscoveredConvertId(disc.id);
    setFormName(cleanName);
    setFormCategory('Other');
    setFormExecutables(disc.executableName);
    setFormPaths(disc.executablePath || '');
    setFormTracked(true);
    setModalError('');
    setIsModalOpen(true);
  };

  // Ignore Discovered App directly
  const handleIgnoreDiscovered = async (disc: IDiscoveredApplication) => {
    try {
      await api.post(`/applications/discovered/${disc.id}/convert`, {
        name: disc.executableName.replace(/\.exe$/i, ''),
        category: 'Other',
        tracked: false,
        ignored: true
      });
      setDiscoveredApps((prev) => prev.filter((d) => d.id !== disc.id));
      await fetchData();
      showSuccess(`Executable "${disc.executableName}" is now marked as IGNORED.`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to ignore discovered app');
    }
  };

  // Dismiss Discovered App
  const handleDismissDiscovered = async (discId: string) => {
    try {
      await api.delete(`/applications/discovered/${discId}`);
      setDiscoveredApps((prev) => prev.filter((d) => d.id !== discId));
    } catch (err) {
      console.error('[ApplicationTrackingView] Dismiss error:', err);
    }
  };

  // Submit Modal (Add or Edit)
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    const execArray = formExecutables
      .split(/[,;\n]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (execArray.length === 0) {
      setModalError('Please specify at least one executable filename (e.g. Code.exe)');
      setIsSubmitting(false);
      return;
    }

    const pathsArray = formPaths
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editingId) {
        // Edit existing
        const res = await api.put(`/applications/${editingId}`, {
          name: formName.trim(),
          category: formCategory,
          executableNames: execArray,
          executablePaths: pathsArray,
          tracked: formTracked,
          ignored: !formTracked
        });
        if (res.data?.data) {
          showSuccess(`Application "${formName}" updated successfully.`);
        }
      } else if (discoveredConvertId) {
        // Convert from discovered
        await api.post(`/applications/discovered/${discoveredConvertId}/convert`, {
          name: formName.trim(),
          category: formCategory,
          tracked: formTracked,
          ignored: !formTracked
        });
        showSuccess(`Discovered application "${formName}" added to registry.`);
      } else {
        // Create new
        await api.post('/applications', {
          name: formName.trim(),
          category: formCategory,
          executableNames: execArray,
          executablePaths: pathsArray,
          tracked: formTracked,
          ignored: !formTracked
        });
        showSuccess(`Application "${formName}" registered successfully.`);
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setModalError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered List
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        app.name.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q) ||
        app.executableNames.some((e) => e.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'TRACKED' && app.tracked) ||
        (statusFilter === 'IGNORED' && (!app.tracked || app.ignored));

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [applications, searchTerm, selectedCategory, statusFilter]);

  // Metrics
  const totalTracked = applications.filter((a) => a.tracked && !a.ignored).length;
  const totalIgnored = applications.filter((a) => !a.tracked || a.ignored).length;

  return (
    <div className="space-y-6">
      {/* Header section with Enterprise Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Application Tracking</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage which Windows applications HighP Agent tracks across company workstations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 text-xs font-semibold transition-all"
            title="Refresh application registry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Add Application
          </button>
        </div>
      </div>

      {/* Success Alert Banner */}
      {actionSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-xs text-emerald-300 font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Overview Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <span className="text-slate-400 font-medium">Registered Apps</span>
          <strong className="text-white text-base font-mono">{applications.length}</strong>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <span className="text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Tracked Active
          </span>
          <strong className="text-emerald-300 text-base font-mono">{totalTracked}</strong>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <span className="text-slate-400 font-medium">Ignored Apps</span>
          <strong className="text-slate-300 text-base font-mono">{totalIgnored}</strong>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <span className="text-amber-400 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Pending Discovered
          </span>
          <strong className="text-amber-300 text-base font-mono">{discoveredApps.length}</strong>
        </div>
      </div>

      {/* Discovered Applications Section */}
      {discoveredApps.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Recently Discovered Applications
                <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  {discoveredApps.length} New
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Detected on Windows agent workstations — Choose to Track or Ignore
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {discoveredApps.map((disc) => (
              <div
                key={disc.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3.5 flex flex-col justify-between gap-3 text-xs transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono text-xs truncate max-w-[180px]">
                      {disc.executableName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Seen {disc.detectedTimes}x
                    </span>
                  </div>
                  {disc.windowTitle && (
                    <p className="text-[11px] text-slate-400 truncate mt-1">
                      Title: {disc.windowTitle}
                    </p>
                  )}
                  {disc.executablePath && (
                    <p className="text-[10px] text-slate-500 truncate mt-0.5" title={disc.executablePath}>
                      {disc.executablePath}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleDismissDiscovered(disc.id)}
                    className="px-2 py-1 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleIgnoreDiscovered(disc)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                  >
                    Ignore
                  </button>
                  <button
                    onClick={() => handleQuickTrackDiscovered(disc)}
                    className="px-3 py-1 rounded-lg text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Track
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search applications or executables (e.g. Code.exe, Slack)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-medium transition-colors"
            />
          </div>

          {/* Status Segment Control */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({applications.length})
            </button>
            <button
              onClick={() => setStatusFilter('TRACKED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusFilter === 'TRACKED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tracked ({totalTracked})
            </button>
            <button
              onClick={() => setStatusFilter('IGNORED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusFilter === 'IGNORED'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ignored ({totalIgnored})
            </button>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'All'
                ? 'bg-slate-200 text-slate-900 shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Categories
          </button>
          {STANDARD_APPLICATION_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs bg-slate-950/40">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
            Application Registry ({filteredApps.length} Shown)
          </span>
          <span className="text-[11px] text-slate-500">
            Click toggle switch to enable or disable tracking instantly
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading Application Registry...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Layers className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">No applications match your filter.</p>
            <p className="text-[11px] text-slate-500">Try changing the search term or category filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredApps.map((app) => {
              const catTheme = CATEGORY_COLORS[app.category] || CATEGORY_COLORS.Other;
              return (
                <div
                  key={app.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors group"
                >
                  {/* Left: App Identity */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${catTheme.bg} ${catTheme.border} ${catTheme.text}`}
                    >
                      <FileCode className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {app.name}
                        </strong>
                        {app.isSystemApp && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            System
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catTheme.bg} ${catTheme.text} ${catTheme.border}`}
                        >
                          {app.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                        <span className="font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                          {app.executableNames.join(', ')}
                        </span>
                        {app.executablePaths && app.executablePaths.length > 0 && (
                          <span className="text-[10px] text-slate-500 truncate max-w-xs" title={app.executablePaths[0]}>
                            • {app.executablePaths[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: State Toggle & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    {/* Enterprise ON / OFF Toggle */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {app.tracked ? (
                          <span className="text-emerald-400">Tracked</span>
                        ) : (
                          <span className="text-slate-500">Ignored</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleTracking(app)}
                        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                          app.tracked
                            ? 'bg-emerald-600 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                            : 'bg-slate-800 border-slate-700'
                        }`}
                        title={app.tracked ? 'Click to turn OFF tracking' : 'Click to turn ON tracking'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px] font-black ${
                            app.tracked ? 'translate-x-7 text-emerald-600' : 'translate-x-0 text-slate-500'
                          }`}
                        >
                          {app.tracked ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </button>
                    </div>

                    {/* Edit & Delete Buttons */}
                    <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
                      <button
                        onClick={() => handleOpenEdit(app)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Application"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!app.isSystemApp && (
                        <button
                          onClick={() => handleDelete(app.id, app.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-xs text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  {editingId ? 'Edit Application' : discoveredConvertId ? 'Add Discovered Application' : 'Add Application to Registry'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitModal} className="space-y-4">
              <div>
                <label className="block font-bold text-white mb-1">Application Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Visual Studio Code, Figma, Slack"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl font-medium text-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-white mb-1">Category *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl font-semibold text-white focus:outline-none transition-colors"
                >
                  {STANDARD_APPLICATION_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-white mb-1">Executable Name(s) *</label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Exact Windows executable filename (e.g. <span className="font-mono text-indigo-300">Code.exe</span> or comma-separated).
                </p>
                <input
                  type="text"
                  required
                  placeholder="Code.exe"
                  value={formExecutables}
                  onChange={(e) => setFormExecutables(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl font-mono text-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-white mb-1">Executable Path (Optional)</label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Optional absolute install path for disambiguation if multiple versions exist.
                </p>
                <input
                  type="text"
                  placeholder="C:\Users\Admin\AppData\Local\Programs\Microsoft VS Code\Code.exe"
                  value={formPaths}
                  onChange={(e) => setFormPaths(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl font-mono text-[11px] text-white focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <span className="font-bold text-white block">Tracking Status</span>
                  <span className="text-[11px] text-slate-400">
                    When ON, employee active intervals in this app are recorded.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormTracked(!formTracked)}
                  className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                    formTracked ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      formTracked ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Application' : 'Save Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
