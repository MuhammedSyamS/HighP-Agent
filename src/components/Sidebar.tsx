import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PieChart,
  FileBarChart,
  Laptop,
  ShieldCheck,
  UserCheck,
  LogOut
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { UserRole } from '@highp/shared';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { user, company, logout } = useAuth();

  const isManagerOrAdmin =
    user?.role === UserRole.OWNER || user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  const navItems = [
    ...(isManagerOrAdmin
      ? [
          { name: 'Live Dashboard', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Applications', href: '/dashboard/applications', icon: PieChart },
          { name: 'Reports', href: '/dashboard/reports', icon: FileBarChart },
          { name: 'Devices', href: '/dashboard/devices', icon: Laptop },
          { name: 'Transparency & Policy', href: '/dashboard/settings', icon: ShieldCheck }
        ]
      : []),
    { name: 'My Employee Workspace', href: '/employee', icon: UserCheck }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen border-r border-slate-800 shrink-0">
      {/* Brand */}
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
          ⚡
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight tracking-tight">HighP Monitor</h1>
          <p className="text-xs text-indigo-400 font-medium truncate max-w-[140px]">
            {company?.name || 'Workspace'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Sign Out */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-sm">
            {(user?.firstName || 'U').charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              {user?.role === UserRole.OWNER || user?.role === UserRole.ADMIN ? 'HR' : user?.role?.toLowerCase()}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
