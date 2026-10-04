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
  const { company } = useAuth();

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
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 transition-all text-slate-900">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">{title}</h1>
          {company?.name && (
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {company.name}
            </span>
          )}
        </div>
        {description && <p className="text-xs text-slate-500 mt-0.5 font-medium">{description}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Realtime Live Indicator */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {isConnected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            )}
          </span>
          <span className="text-[11px] font-bold">
            {isConnected ? 'Telemetry Live' : 'Connecting...'}
          </span>
        </div>

        {actions}
      </div>
    </header>
  );
};
