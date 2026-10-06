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
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-3.5 xs:px-5 sm:px-8 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 transition-all text-slate-900 w-full">
      <div className="flex items-center justify-between gap-2.5 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm xs:text-base sm:text-lg font-black text-slate-900 tracking-tight truncate max-w-[220px] xs:max-w-xs sm:max-w-none">
              {title}
            </h1>
            {company?.name && (
              <span className="hidden xs:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                {company.name}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium line-clamp-1 sm:line-clamp-none">
              {description}
            </p>
          )}
        </div>

        {/* Mobile-only Telemetry Indicator in top bar row to save vertical space */}
        <div className="sm:hidden shrink-0">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={isConnected ? 'Live Telemetry Connected' : 'Connecting to Server...'}
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
            <span>{isConnected ? 'Live' : 'Connecting'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2.5 flex-wrap sm:flex-nowrap">
        {/* Desktop/Tablet Telemetry Indicator */}
        <div
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all shrink-0 ${
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

        {actions && (
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar py-0.5">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};
