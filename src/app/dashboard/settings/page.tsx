'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '../../../components/Header';
import { api } from '../../../lib/api';
import { ShieldCheck, Sliders, CheckCircle2, Lock, Save, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [config, setConfig] = useState({
    idleThresholdMinutes: 5,
    heartbeatIntervalSeconds: 30,
    retentionDays: 90,
    allowManualBreaks: true
  });
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/company').then((res) => {
      if (res.data?.data?.config) {
        setConfig(res.data.data.config);
      }
      setLoading(false);
    });
  }, []);

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
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <Header
        title="Transparency Policy & Monitoring Settings"
        description="Configure desktop idle thresholds, heartbeat cadence, and review workplace transparency disclosures."
      />

      <main className="p-8 space-y-8 flex-1 overflow-y-auto max-w-4xl">
        {/* Transparency Charter Card */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/30 rounded-2xl p-6 text-white shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg font-bold">Workplace Privacy & Transparency Charter</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            HighP Agent adheres to strict, ethical telemetry boundaries designed for productivity aggregation rather than surveillance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <span className="font-bold text-emerald-400 block mb-1">✅ What We Collect</span>
              <ul className="space-y-1 text-slate-300">
                <li>• Foreground application name & process</li>
                <li>• Active work & idle intervals</li>
                <li>• Session start & break timestamps</li>
                <li>• Registered workstation hostname & OS</li>
              </ul>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <span className="font-bold text-rose-400 block mb-1">❌ What We NEVER Collect</span>
              <ul className="space-y-1 text-slate-300">
                <li>• NO Keystrokes or Keylogging</li>
                <li>• NO Passwords or Form Data</li>
                <li>• NO Screen Recordings or Screenshots</li>
                <li>• NO Webcam or Microphone Audio</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Agent Configuration</h3>
              <p className="text-xs text-slate-500 mt-0.5">These settings sync to all active employee desktop agents.</p>
            </div>
            {isSaved && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" /> Configuration Saved
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Idle Threshold (Minutes)</label>
              <p className="text-slate-400 mb-2">Duration of zero OS keyboard/mouse input before switching to IDLE.</p>
              <input
                type="number"
                min={1}
                max={60}
                value={config.idleThresholdMinutes}
                onChange={(e) => setConfig({ ...config, idleThresholdMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Heartbeat Cadence (Seconds)</label>
              <p className="text-slate-400 mb-2">Interval at which desktop agents emit presence updates to backend.</p>
              <input
                type="number"
                min={5}
                max={300}
                value={config.heartbeatIntervalSeconds}
                onChange={(e) => setConfig({ ...config, heartbeatIntervalSeconds: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Data Retention Period (Days)</label>
              <p className="text-slate-400 mb-2">Number of days raw activity timeline events are retained.</p>
              <input
                type="number"
                min={7}
                max={3650}
                value={config.retentionDays}
                onChange={(e) => setConfig({ ...config, retentionDays: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="allowBreaks"
                checked={config.allowManualBreaks}
                onChange={(e) => setConfig({ ...config, allowManualBreaks: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <label htmlFor="allowBreaks" className="font-semibold text-slate-800 cursor-pointer">
                Allow Employees to Manually Trigger Breaks (Lunch, Coffee, Meeting)
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
