'use client';

import React, { useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';
import { useAuth } from '../lib/authContext';
import { Activity, Bell, Sparkles, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, description, actions }) => {
  const [isConnected, setIsConnected] = useState(false);
  const { company, user } = useAuth();

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      setIsConnected(socket.connected);
      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
      };
    }
  }, []);

  return (
    <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20 transition-all text-white">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-extrabold text-white tracking-tight">{title}</h1>
          {company?.name && (
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-indigo-300 border border-slate-700">
              {company.name}
            </span>
          )}
        </div>
        {description && <p className="text-xs text-slate-400 mt-0.5 font-medium">{description}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Realtime Live Indicator */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
            isConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {isConnected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            )}
          </span>
          <span className="text-[11px] font-bold">
            {isConnected ? 'Live Telemetry Connected' : 'Connecting Stream...'}
          </span>
        </div>

        {actions}
      </div>
    </header>
  );
};
