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
  Sparkles
} from 'lucide-react';

export default function HighphausInternalPortal() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const departments = [
    { name: 'Creative & UI/UX Design', lead: 'Maya Patel', activeApps: ['Figma', 'Adobe CC'], count: 'Senior Design Team' },
    { name: 'Development & Engineering', lead: 'Alex Rivers', activeApps: ['VS Code', 'GitHub Desktop'], count: 'Full-Stack Team' },
    { name: 'Digital Marketing & SEO', lead: 'Rohan Mehta', activeApps: ['Google Chrome', 'Ahrefs', 'GA4'], count: 'Growth & Search Team' },
    { name: 'Operations & Strategy', lead: 'Priya Sharma', activeApps: ['Notion', 'Slack'], count: 'Agency Operations' },
  ];

  const destinationHref = mounted && user ? (user.role === 'EMPLOYEE' ? '/employee' : '/dashboard') : '/login';
  const destinationText = mounted && user ? (user.role === 'EMPLOYEE' ? 'My Workspace' : 'Agency Dashboard') : 'Sign In to Workspace';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/25">
              H
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                HIGHPHAUS <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">INTERNAL</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">Creative Digital Marketing Agency</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#team-hub" className="hover:text-white transition-colors">Team Hub</a>
            <a href="#departments" className="hover:text-white transition-colors">Agency Departments</a>
            <a href="#agent-setup" className="hover:text-white transition-colors">Desktop Agent</a>
            <a href="#privacy-charter" className="hover:text-white transition-colors">Privacy Charter</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={destinationHref}
              className="inline-flex items-center gap-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-105"
            >
              {destinationText} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/25 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Highphaus Creative Agency • Internal Employee Activity & Productivity Hub
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Highphaus Agency <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Workforce Activity & Attendance
            </span>
          </h1>

          <p className="mt-5 text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Internal workstation monitoring, real-time presence, work session calculation, and department application usage analytics built exclusively for Highphaus team members.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={destinationHref}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-xl shadow-indigo-600/30 text-sm transition-all hover:scale-105"
            >
              {mounted && user ? `Enter ${destinationText}` : 'Enter Agency Workspace'} <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={getDesktopAgentDownloadUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold px-8 py-3.5 rounded-xl border border-slate-700 text-sm transition-all"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              Download Desktop Agent (Windows)
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            {[
              { label: 'Agency Team', val: 'Design, Dev, SEO & Ops' },
              { label: 'Attendance Mode', val: 'Automated Session Tracking' },
              { label: 'Telemetry Heartbeat', val: 'Real-Time 30s Live Sync' },
              { label: 'Privacy Standard', val: '100% Zero-Spyware Verified' }
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-xs text-slate-400 font-medium mb-1">{item.label}</div>
                <div className="text-sm font-bold text-slate-100">{item.val}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agency Departments Section */}
      <section id="team-hub" className="py-20 px-6 bg-slate-900/40 border-t border-slate-800/80">
        <div id="departments" className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Highphaus Teams</h2>
            <h3 className="text-3xl font-extrabold text-white">Department Monitoring & App Focus</h3>
            <p className="mt-2 text-slate-400 text-sm">
              Customized category mapping aligned with creative, technical, and marketing agency operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {departments.map((dept, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">{dept.name}</h4>
                  <p className="text-xs text-slate-400 font-medium mb-4">Lead: {dept.lead}</p>
                  
                  <div className="space-y-1.5 mb-4">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Primary Tools</div>
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
      <section id="agent-setup" className="py-20 px-6 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/25 rounded-3xl p-8 md:p-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-4 border border-indigo-500/20">
                <Laptop className="w-4 h-4" /> Windows Workstation Agent
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white">Highphaus Desktop Agent</h3>
              <p className="mt-3 text-slate-300 text-sm leading-relaxed">
                Employees can run the native Highphaus Windows Agent on their assigned workstation. It automatically connects via WebSocket, syncs work sessions, tracks active foreground tools, and supports lunch/coffee breaks.
              </p>

              <div className="mt-6 flex flex-col gap-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Runs cleanly in the Windows System Tray with 1-click status toggles</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Local SQLite offline queue ensures zero data loss during network hiccups</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Configured directly for company server at <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">https://highpbackend.vercel.app</code></span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href={getDesktopAgentDownloadUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/30 text-xs transition-all hover:scale-105"
                >
                  <Download className="w-4 h-4" /> Download Desktop Agent (.exe)
                </a>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-6 py-3 rounded-xl text-xs transition-all border border-slate-700"
                >
                  Sign In to Web Portal <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="w-full lg:w-80 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                <span className="font-mono text-indigo-400 flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> Highphaus Agent CLI</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="mt-4 font-mono text-[11px] text-slate-300 space-y-2">
                <p className="text-slate-500"># Start Highphaus Agent</p>
                <p className="bg-slate-900 p-2 rounded text-indigo-300 border border-slate-800">npm run dev:agent</p>
                <p className="text-slate-500 mt-2"># Agent Status Output</p>
                <p className="text-emerald-400">● Status: Active Tracking</p>
                <p className="text-slate-400">App: Figma.exe (Design & Creative)</p>
                <p className="text-slate-400">Session: 03h 48m elapsed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Charter */}
      <section id="privacy-charter" className="py-16 px-6 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" /> Internal Highphaus Trust & Transparency
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Our Employee Privacy Charter</h3>
          <p className="text-slate-400 text-xs max-w-2xl mx-auto mb-8">
            Highphaus adheres to strict workplace transparency. We measure project productivity without invasive surveillance.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            {[
              { title: 'No Keylogging', desc: 'Typed text & passwords are never logged.' },
              { title: 'No Screen Grabs', desc: 'No secret screenshots or desktop video.' },
              { title: 'No Mic or Cam', desc: 'Microphones & webcams are never accessed.' },
              { title: 'Visible Control', desc: 'Employees can pause & review their stats.' }
            ].map((p, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {p.title}
                </div>
                <p className="text-[11px] text-slate-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-6 bg-slate-950 mt-auto text-center text-xs text-slate-500">
        <p>© 2026 Highphaus Creative Digital Marketing Agency (<a href="https://www.highphaus.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">www.highphaus.com</a>). Internal Company Portal.</p>
      </footer>
    </div>
  );
}

