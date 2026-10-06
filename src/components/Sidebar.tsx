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

  // Prevent background scrolling when mobile navigation drawer is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [mobileMenuOpen]);

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
      <aside className="hidden md:flex w-64 bg-white text-slate-800 flex-col min-h-screen border-r border-slate-200 shrink-0 select-none">
        {/* Brand */}
        <div className="p-5 border-b border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-indigo-600/25 shrink-0">
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
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto" aria-label="Main Navigation">
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
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.name}</span>
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
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors min-h-[44px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-black text-base shadow-sm shrink-0">
            ⚡
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-slate-900 text-xs sm:text-sm leading-tight truncate">HighP Monitor</h1>
            <p className="text-[10px] text-slate-500 font-semibold truncate max-w-[160px]">
              {company?.name || 'Workspace'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open Navigation Drawer"
          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-slate-700 hover:text-black hover:bg-slate-100 flex items-center justify-center transition-colors active:scale-95"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 right-0 w-4/5 max-w-xs bg-white p-5 flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-sm">
                    ⚡
                  </div>
                  <span className="font-black text-sm text-slate-900">Workspace Menu</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close Navigation Drawer"
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5" aria-label="Mobile Drawer Navigation">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors min-h-[44px] ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-200 mt-6 space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">{roleLabel}</p>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors min-h-[44px] active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around py-1.5 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg"
        aria-label="Mobile Quick Navigation"
      >
        {canAccessDashboard && (
          <>
            <Link
              to="/dashboard"
              aria-label="Go to Dashboard"
              aria-current={pathname === '/dashboard' ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all min-h-[44px] active:scale-95 ${
                pathname === '/dashboard' ? 'text-indigo-600 font-black' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/dashboard/attendance"
              aria-label="Go to Attendance Data"
              aria-current={pathname === '/dashboard/attendance' ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all min-h-[44px] active:scale-95 ${
                pathname === '/dashboard/attendance' ? 'text-indigo-600 font-black' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CalendarCheck className="w-4 h-4 shrink-0" />
              <span>Attendance</span>
            </Link>
            <Link
              to="/dashboard/applications"
              aria-label="Go to Apps & Web Analytics"
              aria-current={pathname === '/dashboard/applications' ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all min-h-[44px] active:scale-95 ${
                pathname === '/dashboard/applications' ? 'text-indigo-600 font-black' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <PieChart className="w-4 h-4 shrink-0" />
              <span>Apps</span>
            </Link>
            <Link
              to="/dashboard/reports"
              aria-label="Go to Reports"
              aria-current={pathname === '/dashboard/reports' ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all min-h-[44px] active:scale-95 ${
                pathname === '/dashboard/reports' ? 'text-indigo-600 font-black' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileBarChart className="w-4 h-4 shrink-0" />
              <span>Reports</span>
            </Link>
          </>
        )}
        <Link
          to="/employee"
          aria-label="Go to My Workspace"
          aria-current={pathname === '/employee' ? 'page' : undefined}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all min-h-[44px] active:scale-95 ${
            pathname === '/employee' ? 'text-indigo-600 font-black' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <span>Workspace</span>
        </Link>
      </nav>
    </>
  );
};
