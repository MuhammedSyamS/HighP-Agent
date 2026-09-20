'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '../../../components/Header';
import { api } from '../../../lib/api';
import { Laptop, ShieldAlert, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
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
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <Header
        title="Registered Devices"
        description="Manage installed Windows desktop agents, verify client versions, and revoke compromised devices."
        actions={
          <button
            onClick={fetchDevices}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        }
      />

      <main className="p-8 space-y-8 flex-1 overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Active Desktop Agents</h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">
              {devices.length} Devices Registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
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
                      <tr key={dev._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                              <Laptop className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{dev.deviceName || 'Workstation'}</p>
                              <p className="text-[11px] text-slate-400">{dev.deviceId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{empName}</p>
                          <p className="text-[11px] text-slate-400">{emp?.employeeCode || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {dev.osInfo?.platform === 'win32' ? 'Windows 10/11 x64' : dev.osInfo?.platform || 'Windows'}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600">v{dev.agentVersion || '1.0.0'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              isRevoked
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {isRevoked ? (
                              <>
                                <XCircle className="w-3.5 h-3.5" /> Revoked
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Active
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {dev.lastHeartbeatAt ? new Date(dev.lastHeartbeatAt).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!isRevoked && (
                            <button
                              onClick={() => handleRevoke(dev._id, dev.deviceName)}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors"
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
