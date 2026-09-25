'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '../../../components/Header';
import { api } from '../../../lib/api';
import { Laptop, ShieldAlert, CheckCircle2, XCircle, RefreshCw, Cpu, HardDrive } from 'lucide-react';
import { DeviceStatus } from '@highp/shared';

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/devices');
      if (res.data?.data) {
        setDevices(res.data.data);
      }
    } catch (err) {
      console.error('[Devices] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke device "${name}"? The employee agent will require re-authentication.`)) {
      return;
    }

    try {
      await api.post(`/devices/${id}/revoke`);
      await fetchDevices();
    } catch (err) {
      console.error('[Devices] Revoke error:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0B0F19] text-slate-100">
      <Header
        title="Registered Devices"
        description="Manage installed Windows desktop agents, verify client versions, and revoke compromised devices."
        actions={
          <button
            onClick={fetchDevices}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-xs shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      <main className="p-6 md:p-8 space-y-6 md:space-y-8 flex-1 overflow-y-auto">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div>
              <h3 className="text-base font-bold text-white">Active Desktop Agents</h3>
              <p className="text-xs text-slate-400 mt-0.5">Telemetry agents reporting heartbeat and workstation activity</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300">
              {devices.length} Devices Registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Device Name / Hostname</th>
                  <th className="px-6 py-3.5">Assigned Employee</th>
                  <th className="px-6 py-3.5">OS Platform</th>
                  <th className="px-6 py-3.5">Agent Version</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Last Heartbeat</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-medium text-slate-300">
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center text-slate-500">
                      <Laptop className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                      No desktop devices currently registered.
                    </td>
                  </tr>
                ) : (
                  devices.map((dev) => {
                    const emp = dev.employeeId;
                    const user = emp?.userId;
                    const empName = user ? `${user.firstName} ${user.lastName}` : 'Unassigned';
                    const isRevoked = dev.status === DeviceStatus.REVOKED;

                    return (
                      <tr key={dev._id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:border-indigo-500/40 transition-colors">
                              <Laptop className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-white group-hover:text-indigo-300 transition-colors">{dev.deviceName || 'Workstation'}</p>
                              <p className="text-[11px] font-mono text-slate-500">{dev.deviceId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-200">{empName}</p>
                          <p className="text-[11px] font-mono text-slate-500">{emp?.employeeCode || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {dev.osInfo?.platform === 'win32' ? 'Windows 10/11 x64' : dev.osInfo?.platform || 'Windows'}
                        </td>
                        <td className="px-6 py-4 font-mono text-indigo-400">v{dev.agentVersion || '1.0.0'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              isRevoked
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                            }`}
                          >
                            {isRevoked ? (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-400" /> Revoked
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                          {dev.lastHeartbeatAt ? new Date(dev.lastHeartbeatAt).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!isRevoked && (
                            <button
                              onClick={() => handleRevoke(dev._id, dev.deviceName)}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-xs transition-colors"
                            >
                              Revoke Access
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
