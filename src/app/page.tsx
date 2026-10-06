import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { getDesktopAgentDownloadUrl } from '../lib/constants';
import {
  ShieldCheck,
  Activity,
  PieChart,
  Clock,
  Laptop,
  CheckCircle2,
  Lock,
  ArrowRight,
  Download,
  Users,
  BarChart3,
  Briefcase,
  Terminal,
  Sparkles,
  Menu,
  X,
  Radio,
  ExternalLink
} from 'lucide-react';

export default function HighphausInternalPortal() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  const departments = [
    { name: 'Creative & UI/UX Design', lead: 'Maya Patel', activeApps: ['Figma', 'Adobe CC'], count: 'Senior Design Team' },
    { name: 'Development & Engineering', lead: 'Alex Rivers', activeApps: ['VS Code', 'GitHub Desktop'], count: 'Full-Stack Team' },
    { name: 'Digital Marketing & SEO', lead: 'Rohan Mehta', activeApps: ['Google Chrome', 'Ahrefs', 'GA4'], count: 'Growth & Search Team' },
    { name: 'Operations & Strategy', lead: 'Priya Sharma', activeApps: ['Notion', 'Slack'], count: 'Agency Operations' },
  ];

  const destinationHref = mounted && user ? (user.role === 'EMPLOYEE' ? '/employee' : '/dashboard') : '/login';
  const destinationText = mounted && user ? (user.role === 'EMPLOYEE' ? 'My Workspace' : 'Agency Dashboard') : 'Sign In to Workspace';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md sticky top-0 z-40 w-full" aria-label="Portal Navigation">
        <div className="max-w-7xl mx-auto px-4 xs:px-6 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg shadow-indigo-500/25 shrink-0">
              H
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-white flex items-center gap-1.5 truncate">
                HIGHPHAUS <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30 shrink-0">INTERNAL</span>
              </span>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-wide truncate hidden xs:block">
                Creative Digital Marketing Agency
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#team-hub" className="hover:text-white transition-colors">Team Hub</a>
            <a href="#departments" className="hover:text-white transition-colors">Agency Departments</a>
            <a href="#agent-setup" className="hover:text-white transition-colors">Desktop Agent</a>
            <a href="#privacy-charter" className="hover:text-white transition-colors">Privacy Charter</a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <Link
              to={destinationHref}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 sm:px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 min-h-[44px]"
            >
              <span>{destinationText}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              to={destinationHref}
              className="sm:hidden inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl shadow-sm min-h-[40px]"
            >
              <span>{mounted && user ? 'Open' : 'Login'}</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Mobile Menu"
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 flex items-center justify-center transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-Out Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-slate-950 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-slate-800/80 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    H
                  </div>
                  <span className="font-extrabold text-sm text-white">Highphaus Portal</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close Mobile Menu"
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-2" aria-label="Mobile Navigation Links">
                {[
                  { name: 'Team Hub', href: '#team-hub' },
                  { name: 'Agency Departments', href: '#departments' },
                  { name: 'Desktop Agent Setup', href: '#agent-setup' },
                  { name: 'Privacy Charter', href: '#privacy-charter' },
                ].map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors min-h-[44px]"
                  >
                    <span>{item.name}</span>
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                  </a>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-slate-800 space-y-3 mt-8">
              <Link
                to={destinationHref}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all min-h-[44px]"
              >
                <span>{destinationText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={getDesktopAgentDownloadUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold py-3 px-4 rounded-xl text-xs border border-slate-800 transition-colors min-h-[44px]"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Download Desktop Agent (.exe)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-12 sm:pb-20 px-4 xs:px-6 sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] sm:text-xs font-semibold mb-6 max-w-full">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 shrink-0" />
            <span className="truncate">Highphaus Creative Agency • Internal Activity & Attendance Hub</span>
          </div>

          <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15] text-balance">
            Highphaus Agency <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Workforce Activity & Attendance
            </span>
          </h1>

          <p className="mt-4 sm:mt-6 text-sm xs:text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed text-balance">
            Internal workstation monitoring, real-time presence, work session calculation, and department application usage analytics built exclusively for Highphaus team members.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            <Link
              to={destinationHref}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl shadow-xl shadow-indigo-600/30 text-sm transition-all hover:scale-105 active:scale-95 min-h-[44px]"
            >
              <span>{mounted && user ? `Enter ${destinationText}` : 'Enter Agency Workspace'}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
            <a
              href={getDesktopAgentDownloadUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl border border-slate-700 text-sm transition-all hover:border-slate-600 min-h-[44px]"
            >
              <Download className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Download Desktop Agent (Windows)</span>
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-10 sm:mt-14 grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-left">
            {[
              { label: 'Agency Team', val: 'Design, Dev, SEO & Ops' },
              { label: 'Attendance Mode', val: 'Automated Session Tracking' },
              { label: 'Telemetry Heartbeat', val: 'Real-Time 30s Live Sync' },
              { label: 'Privacy Standard', val: '100% Zero-Spyware Verified' }
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-4.5 backdrop-blur-sm hover:border-slate-700 transition-colors">
                <div className="text-[11px] sm:text-xs text-slate-400 font-medium mb-1 truncate">{item.label}</div>
                <div className="text-xs sm:text-sm font-bold text-slate-100">{item.val}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agency Departments Section */}
      <section id="team-hub" className="py-16 sm:py-20 px-4 xs:px-6 sm:px-8 bg-slate-900/40 border-t border-slate-800/80">
        <div id="departments" className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Highphaus Teams</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Department Monitoring & App Focus</h3>
            <p className="mt-2 text-slate-400 text-xs sm:text-sm leading-relaxed">
              Customized category mapping aligned with creative, technical, and marketing agency operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {departments.map((dept, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 hover:border-slate-700 hover:shadow-lg transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">{dept.name}</h4>
                  <p className="text-xs text-slate-400 font-medium mb-4">Lead: {dept.lead}</p>
                  
                  <div className="space-y-1.5 mb-4">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Primary Tools</div>
                    <div className="flex flex-wrap gap-1.5">
                      {dept.activeApps.map((app, ai) => (
                        <span key={ai} className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700">
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 text-[11px] text-indigo-400 font-semibold flex items-center justify-between">
                  <span>{dept.count}</span>
                  <span>Active Monitored</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal Desktop Agent Setup */}
      <section id="agent-setup" className="py-16 sm:py-20 px-4 xs:px-6 sm:px-8 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/25 rounded-3xl p-6 sm:p-10 md:p-12 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8 lg:gap-12">
            <div className="max-w-xl flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-4 border border-indigo-500/20">
                <Laptop className="w-4 h-4 shrink-0" /> Windows Workstation Agent
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Highphaus Desktop Agent</h3>
              <p className="mt-3 text-slate-300 text-xs sm:text-sm leading-relaxed">
                Employees can run the native Highphaus Windows Agent on their assigned workstation. It automatically connects via WebSocket, syncs work sessions, tracks active foreground tools, and supports lunch/coffee breaks.
              </p>

              <div className="mt-6 flex flex-col gap-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Runs cleanly in the Windows System Tray with 1-click status toggles</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Local SQLite offline queue ensures zero data loss during network hiccups</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Configured directly for company server telemetry and cloud presence</span>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <a
                  href={getDesktopAgentDownloadUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 text-xs transition-all hover:scale-105 active:scale-95 min-h-[44px]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Desktop Agent (.exe)</span>
                </a>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-6 py-3.5 rounded-xl text-xs transition-all border border-slate-700 min-h-[44px]"
                >
                  <span>Sign In to Web Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Terminal Window Box with horizontal scroll protection */}
            <div className="w-full lg:w-80 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl shrink-0">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                <span className="font-mono text-indigo-400 flex items-center gap-1.5 truncate">
                  <Terminal className="w-3.5 h-3.5 shrink-0" /> Highphaus Agent CLI
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>
              <div className="mt-4 font-mono text-[11px] text-slate-300 space-y-2 overflow-x-auto no-scrollbar">
                <p className="text-slate-500"># Start Highphaus Agent</p>
                <p className="bg-slate-900 p-2 rounded text-indigo-300 border border-slate-800 select-all whitespace-nowrap">
                  npm run dev:agent
                </p>
                <p className="text-slate-500 mt-2"># Agent Status Output</p>
                <p className="text-emerald-400 whitespace-nowrap">● Status: Active Tracking</p>
                <p className="text-slate-400 whitespace-nowrap">App: Figma.exe (Design & Creative)</p>
                <p className="text-slate-400 whitespace-nowrap">Session: 03h 48m elapsed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Charter */}
      <section id="privacy-charter" className="py-16 sm:py-20 px-4 xs:px-6 sm:px-8 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4 shrink-0" /> Internal Highphaus Trust & Transparency
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">Our Employee Privacy Charter</h3>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed">
            Highphaus adheres to strict workplace transparency. We measure project productivity without invasive surveillance.
          </p>

          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 text-left">
            {[
              { title: 'No Keylogging', desc: 'Typed text & passwords are never logged.' },
              { title: 'No Screen Grabs', desc: 'No secret screenshots or desktop video.' },
              { title: 'No Mic or Cam', desc: 'Microphones & webcams are never accessed.' },
              { title: 'Visible Control', desc: 'Employees can pause & review their stats.' }
            ].map((p, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 hover:border-slate-700 transition-colors">
                <div className="text-emerald-400 font-bold text-xs sm:text-sm flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>{p.title}</span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MNC-Level Responsive Footer */}
      <footer className="border-t border-slate-800/80 py-10 sm:py-14 px-4 xs:px-6 sm:px-8 bg-slate-950 mt-auto text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-xs">
                ⚡
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">HighP Monitor</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 font-bold">
                Enterprise v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Workforce telemetry, real-time presence, and productivity analytics for Highphaus Creative Digital Marketing Agency.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Telemetry Cloud Services Operational</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#team-hub" className="hover:text-white transition-colors">Team Hub</a></li>
              <li><a href="#departments" className="hover:text-white transition-colors">Agency Departments</a></li>
              <li><a href="#agent-setup" className="hover:text-white transition-colors">Desktop Agent Setup</a></li>
              <li><a href="#privacy-charter" className="hover:text-white transition-colors">Privacy Charter</a></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Company & Legal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="https://www.highphaus.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors">
                  <span>Highphaus Agency</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li><Link to="/login" className="hover:text-white transition-colors">Internal Login</Link></li>
              <li><span className="text-slate-500">Internal Use Only</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© 2026 Highphaus Creative Digital Marketing Agency. All rights reserved.</p>
          <p className="text-[11px] text-slate-600">Protected by 256-bit encryption & zero-spyware policy.</p>
        </div>
      </footer>
    </div>
  );
}
