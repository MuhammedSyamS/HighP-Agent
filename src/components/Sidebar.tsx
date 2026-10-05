import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  PieChart,
  FileBarChart,
  Laptop,
  ShieldCheck,
  UserCheck,
  LogOut,
  Menu,
  X,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { UserRole } from '@highp/shared';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { user, company, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHR = user?.role === UserRole.HR || user?.role === UserRole.OWNER || user?.role === UserRole.ADMIN;
  const isManager = user?.role === UserRole.MANAGER;
  const canAccessDashboard = isHR || isManager;

  const navItems = [
    ...(canAccessDashboard
      ? [
          { name: 'Live Dashboard', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Attendance Data', href: '/dashboard/attendance', icon: CalendarCheck },
          { name: 'App Tracking', href: '/dashboard/settings?tab=applications', icon: Layers },
          { name: 'App & Web Analytics', href: '/dashboard/applications', icon: PieChart },
          { name: 'Reports', href: '/dashboard/reports', icon: FileBarChart },
          { name: 'Devices', href: '/dashboard/devices', icon: Laptop },
          ...(isHR ? [{ name: 'Settings & Policy', href: '/dashboard/settings?tab=policy', icon: ShieldCheck }] : [])
        ]
      : []),
    { name: 'My Workspace', href: '/employee', icon: UserCheck }
  ];

  const roleLabel = isHR ? 'Admin / HR' : isManager ? 'Manager' : 'Employee';

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white text-slate-800 flex-col min-h-screen border-r border-slate-200 shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-indigo-600/25">
            ⚡
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-slate-900 text-sm leading-tight tracking-tight">HighP Monitor</h1>
            <p className="text-[11px] text-slate-500 font-semibold truncate">
              {company?.name || 'Workspace'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Card & Sign Out */}
        <div className="p-3.5 border-t border-slate-200">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-black text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-black text-base shadow-sm">
            ⚡
          </div>
          <div>
            <h1 className="font-black text-slate-900 text-sm leading-tight">HighP Monitor</h1>
            <p className="text-[10px] text-slate-500 font-semibold truncate max-w-[150px]">
              {company?.name || 'Workspace'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-xl text-slate-600 hover:text-black hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-y-0 right-0 w-3/4 max-w-xs bg-white p-5 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-black text-white font-black flex items-center justify-center text-xs">
                    ⚡
                  </div>
                  <span className="font-black text-sm text-slate-900">Menu</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around py-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {canAccessDashboard && (
          <>
            <Link
              to="/dashboard"
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold transition-colors ${
                pathname === '/dashboard' ? 'text-black' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              to="/dashboard/applications"
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold transition-colors ${
                pathname === '/dashboard/applications' ? 'text-black' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <PieChart className="w-4 h-4" />
              Apps & Web
            </Link>
            <Link
              to="/dashboard/reports"
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold transition-colors ${
                pathname === '/dashboard/reports' ? 'text-black' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <FileBarChart className="w-4 h-4" />
              Reports
            </Link>
          </>
        )}
        <Link
          to="/employee"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold transition-colors ${
            pathname === '/employee' ? 'text-black' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Workspace
        </Link>
      </nav>
    </>
  );
};
