import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../../components/Header';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Laptop,
  Activity,
  Lock,
  ArrowLeft,
  FileText
} from 'lucide-react';

export default function EmployeeMonitoringTransparencyPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <Header
        title="Privacy & Monitoring Transparency"
        description="Clear, open disclosure of work-related telemetry collected by the HighP Workforce platform."
        actions={
          <Link
            to="/employee"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Return to My Workspace
          </Link>
        }
      />

      <main className="p-8 space-y-8 flex-1 overflow-y-auto max-w-5xl mx-auto w-full">
        {/* Banner */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-8 shadow-xl border border-indigo-500/20">
          <div className="flex items-center gap-3 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
            <ShieldCheck className="w-5 h-5" /> HighP Privacy & Ethics Pledge
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Transparent Workplace Telemetry — Never Spyware.
          </h2>
          <p className="text-slate-300 text-xs leading-relaxed mt-2 max-w-3xl">
            Highphaus Creative Agency uses this system strictly to record attendance, work session duration, break pauses,
            and software application distribution. We believe in mutual trust, full visibility, and zero invasive surveillance.
          </p>
        </div>

        {/* 2-Column Comparison Grid: What is Collected vs What is NEVER Collected */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Collected Card */}
          <div className="bg-white border border-emerald-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-emerald-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">What Is Collected</h3>
                <p className="text-[11px] text-slate-400">Permitted work-related metrics only</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Foreground Application Name:</strong>
                  <p className="text-[11px] text-slate-500">Executable process name (e.g. <code>Code.exe</code>, <code>Figma.exe</code>) to calculate daily software usage distribution.</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Active & Idle State:</strong>
                  <p className="text-[11px] text-slate-500">Detects mouse/keyboard input idle intervals via Windows API (default 5-minute threshold) without recording inputs.</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Work Sessions & Breaks:</strong>
                  <p className="text-[11px] text-slate-500">Timestamps when you start work, pause for official breaks (lunch, coffee), and end your daily shift.</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Workstation Device Info:</strong>
                  <p className="text-[11px] text-slate-500">Computer hostname, operating system, architecture, and installed desktop agent version.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* NEVER Collected Card */}
          <div className="bg-white border border-rose-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <EyeOff className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">What Is NEVER Collected</h3>
                <p className="text-[11px] text-slate-400">Strictly prohibited privacy violations</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">No Keystroke Logging:</strong>
                  <p className="text-[11px] text-slate-500">Keystrokes, search queries, passwords, and private chats are never captured or stored.</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">No Secret Screenshots or Screen Recording:</strong>
                  <p className="text-[11px] text-slate-500">Zero screen captures, video recordings, or visual frame grabs.</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">No Webcam or Microphone Access:</strong>
                  <p className="text-[11px] text-slate-500">The platform has zero audio or camera capture capabilities.</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">No Clipboard or Browser Password Extraction:</strong>
                  <p className="text-[11px] text-slate-500">Copied text, credentials, browsing history, and private files are never accessed.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Visibility Guarantee */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Windows Desktop Agent Visibility</h4>
              <p className="text-[11px] text-slate-500">
                The desktop agent runs visibly in your Windows System Tray. You can always view your tracked active time, current status, and pause for breaks anytime.
              </p>
            </div>
          </div>
          <Link
            to="/employee"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shrink-0"
          >
            Open My Workspace
          </Link>
        </div>
      </main>
    </div>
  );
}
