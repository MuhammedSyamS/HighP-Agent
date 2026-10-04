'use client';

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../../../components/Header';
import { api } from '../../../lib/api';
import { ShieldCheck, Sliders, CheckCircle2, Lock, Save, AlertCircle, Sparkles, Layers } from 'lucide-react';
import { ApplicationTrackingView } from './ApplicationTrackingView';

export default function SettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Read tab from query param or default to 'applications'
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'applications';
  const [activeTab, setActiveTab] = useState<'applications' | 'policy'>(
    initialTab === 'policy' ? 'policy' : 'applications'
  );

  const [config, setConfig] = useState({
    idleThresholdMinutes: 5,
    heartbeatIntervalSeconds: 30,
    retentionDays: 90,
    allowManualBreaks: true
  });
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab === 'policy' || tab === 'applications') {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    api.get('/company').then((res) => {
      if (res.data?.data?.config) {
        setConfig(res.data.data.config);
      }
      setLoading(false);
    });
  }, []);

  const handleTabChange = (tab: 'applications' | 'policy') => {
    setActiveTab(tab);
    navigate(`/dashboard/settings?tab=${tab}`, { replace: true });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(false);
    try {
      await api.patch('/company/configuration', {
        idleThresholdMinutes: Number(config.idleThresholdMinutes),
        heartbeatIntervalSeconds: Number(config.heartbeatIntervalSeconds),
        retentionDays: Number(config.retentionDays),
        allowManualBreaks: Boolean(config.allowManualBreaks)
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('[Settings] Error updating settings:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC] text-slate-900 selection:bg-black selection:text-white">
      <Header
        title={activeTab === 'applications' ? 'Application Tracking' : 'Transparency Policy & Monitoring Settings'}
        description={
          activeTab === 'applications'
            ? 'Manage which applications HighP Agent tracks and discovers on workstations.'
            : 'Configure desktop idle thresholds, heartbeat cadence, and review workplace transparency disclosures.'
        }
      />

      <main className="p-4 sm:p-8 space-y-6 flex-1 overflow-y-auto max-w-6xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => handleTabChange('applications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'applications'
                ? 'bg-black text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" /> Application Tracking
          </button>
          <button
            onClick={() => handleTabChange('policy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'policy'
                ? 'bg-black text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Transparency Policy & Cadence
          </button>
        </div>

        {/* Tab 1: Application Tracking Registry & Discovery */}
        {activeTab === 'applications' && <ApplicationTrackingView />}

        {/* Tab 2: Transparency Policy & Rules */}
        {activeTab === 'policy' && (
          <div className="space-y-6 max-w-4xl">
            {/* Transparency Charter Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 text-slate-900 shadow-xs relative overflow-hidden">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Workplace Privacy & Transparency Charter</h3>
                  <p className="text-xs text-slate-500">
                    Ethical telemetry boundaries designed for productivity aggregation rather than surveillance
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-4">
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                  <span className="font-bold text-emerald-800 block mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Telemetry Collected
                  </span>
                  <ul className="space-y-1.5 text-emerald-900 text-[11px]">
                    <li>• Foreground active application name & process</li>
                    <li>• Work intervals & idle status switches</li>
                    <li>• Session start, stop & break timestamps</li>
                    <li>• Workstation hostname, OS & agent version</li>
                  </ul>
                </div>

                <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200">
                  <span className="font-bold text-rose-800 block mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Strict Exclusions (Never Captured)
                  </span>
                  <ul className="space-y-1.5 text-rose-900 text-[11px]">
                    <li>• NO Keystrokes or Keylogging</li>
                    <li>• NO Passwords, Tokens, or Form Content</li>
                    <li>• NO Screen Recordings or Background Screenshots</li>
                    <li>• NO Camera, Microphone, or Audio Streams</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Configuration Form */}
            <form
              onSubmit={handleSave}
              className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Agent Telemetry Rules</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Parameters broadcast to all registered employee desktop agents</p>
                </div>
                {isSaved && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Configuration Saved
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Idle Threshold (Minutes)</label>
                  <p className="text-slate-500 mb-2">Duration of zero OS keyboard/mouse input before switching to IDLE.</p>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={config.idleThresholdMinutes}
                    onChange={(e) => setConfig({ ...config, idleThresholdMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:ring-1 focus:ring-black focus:border-black rounded-xl font-semibold text-slate-900 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Heartbeat Cadence (Seconds)</label>
                  <p className="text-slate-500 mb-2">Interval at which desktop agents emit presence updates to backend.</p>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={config.heartbeatIntervalSeconds}
                    onChange={(e) => setConfig({ ...config, heartbeatIntervalSeconds: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:ring-1 focus:ring-black focus:border-black rounded-xl font-semibold text-slate-900 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Data Retention Period (Days)</label>
                  <p className="text-slate-500 mb-2">Number of days raw activity timeline events are retained.</p>
                  <input
                    type="number"
                    min={7}
                    max={3650}
                    value={config.retentionDays}
                    onChange={(e) => setConfig({ ...config, retentionDays: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:ring-1 focus:ring-black focus:border-black rounded-xl font-semibold text-slate-900 focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="allowBreaks"
                    checked={config.allowManualBreaks}
                    onChange={(e) => setConfig({ ...config, allowManualBreaks: e.target.checked })}
                    className="w-4 h-4 text-black border-slate-300 rounded focus:ring-black cursor-pointer"
                  />
                  <label htmlFor="allowBreaks" className="font-semibold text-slate-700 cursor-pointer select-none">
                    Allow Employees to Manually Trigger Breaks (Lunch, Coffee, Meeting)
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all hover:scale-105"
                >
                  <Save className="w-4 h-4" /> Save Configuration
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
