'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '../../../components/Header';
import { api } from '../../../lib/api';
import { ShieldCheck, Sliders, CheckCircle2, Lock, Save, AlertCircle, Sparkles } from 'lucide-react';

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
    <div className="flex-1 flex flex-col min-h-0 bg-[#0B0F19] text-slate-100">
      <Header
        title="Transparency Policy & Monitoring Settings"
        description="Configure desktop idle thresholds, heartbeat cadence, and review workplace transparency disclosures."
      />

      <main className="p-6 md:p-8 space-y-6 md:space-y-8 flex-1 overflow-y-auto max-w-4xl">
        {/* Transparency Charter Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Workplace Privacy & Transparency Charter</h3>
              <p className="text-xs text-indigo-300">Ethical telemetry boundaries designed for productivity aggregation rather than surveillance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="font-bold text-emerald-400 block mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Telemetry Collected
              </span>
              <ul className="space-y-1.5 text-slate-300 text-[11px]">
                <li>• Foreground active application name & process</li>
                <li>• Work intervals & idle status switches</li>
                <li>• Session start, stop & break timestamps</li>
                <li>• Workstation hostname, OS & agent version</li>
              </ul>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="font-bold text-rose-400 block mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Strict Exclusions (Never Captured)
              </span>
              <ul className="space-y-1.5 text-slate-300 text-[11px]">
                <li>• NO Keystrokes or Keylogging</li>
                <li>• NO Passwords, Tokens, or Form Content</li>
                <li>• NO Screen Recordings or Background Screenshots</li>
                <li>• NO Camera, Microphone, or Audio Streams</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Agent Telemetry Rules</h3>
              <p className="text-xs text-slate-400 mt-0.5">Parameters broadcast to all registered employee desktop agents</p>
            </div>
            {isSaved && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Configuration Saved
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-bold text-white mb-1">Idle Threshold (Minutes)</label>
              <p className="text-slate-400 mb-2">Duration of zero OS keyboard/mouse input before switching to IDLE.</p>
              <input
                type="number"
                min={1}
                max={60}
                value={config.idleThresholdMinutes}
                onChange={(e) => setConfig({ ...config, idleThresholdMinutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl font-semibold text-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block font-bold text-white mb-1">Heartbeat Cadence (Seconds)</label>
              <p className="text-slate-400 mb-2">Interval at which desktop agents emit presence updates to backend.</p>
              <input
                type="number"
                min={5}
                max={300}
                value={config.heartbeatIntervalSeconds}
                onChange={(e) => setConfig({ ...config, heartbeatIntervalSeconds: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl font-semibold text-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block font-bold text-white mb-1">Data Retention Period (Days)</label>
              <p className="text-slate-400 mb-2">Number of days raw activity timeline events are retained.</p>
              <input
                type="number"
                min={7}
                max={3650}
                value={config.retentionDays}
                onChange={(e) => setConfig({ ...config, retentionDays: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl font-semibold text-white focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="allowBreaks"
                checked={config.allowManualBreaks}
                onChange={(e) => setConfig({ ...config, allowManualBreaks: e.target.checked })}
                className="w-4 h-4 text-indigo-600 bg-slate-950 border-slate-800 rounded focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="allowBreaks" className="font-semibold text-slate-200 cursor-pointer select-none">
                Allow Employees to Manually Trigger Breaks (Lunch, Coffee, Meeting)
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
