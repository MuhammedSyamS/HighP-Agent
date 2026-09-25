'use client';

import React from 'react';
import { formatDuration } from '../lib/utils';
import { Clock, Coffee, Monitor, Moon, Layers, Sparkles } from 'lucide-react';
import { ActivityEventType } from '@highp/shared';

interface TimelineEvent {
  _id?: string;
  eventId: string;
  type: ActivityEventType | string;
  applicationName: string;
  processName?: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
}

interface TimelineVisualizerProps {
  events: TimelineEvent[];
  dateStr: string;
}

export const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({ events, dateStr }) => {
  if (!events || events.length === 0) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-12 text-center text-slate-400 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto mb-3 text-slate-400 shadow-inner">
          <Clock className="w-6 h-6 text-indigo-400" />
        </div>
        <h4 className="text-sm font-bold text-white">No Activity Events Recorded</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
          No desktop focus intervals were captured for {dateStr}. Start work on the desktop agent to begin real-time activity capture.
        </p>
      </div>
    );
  }

  const getEventIcon = (event: TimelineEvent) => {
    if (event.applicationName.toLowerCase().includes('break') || event.type === 'BREAK') {
      return <Coffee className="w-3.5 h-3.5 text-cyan-400" />;
    }
    if (event.type === ActivityEventType.IDLE_INTERVAL) {
      return <Moon className="w-3.5 h-3.5 text-amber-400" />;
    }
    return <Monitor className="w-3.5 h-3.5 text-indigo-400" />;
  };

  const getEventBadgeClass = (event: TimelineEvent) => {
    if (event.applicationName.toLowerCase().includes('break')) {
      return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
    }
    if (event.type === ActivityEventType.IDLE_INTERVAL) {
      return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    }
    return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
  };

  const totalEventDuration = events.reduce((acc, curr) => acc + curr.durationSeconds, 0);

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Chronological Day Timeline</h3>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/30">
              <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" /> Telemetry Feed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Sequential application focus, idle intervals, and break switches for {dateStr}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>{events.length} Events • <strong className="text-white">{formatDuration(totalEventDuration)}</strong> Total</span>
        </div>
      </div>

      {/* Visual Multi-Segment Bar */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
          <span>Day Distribution Bar</span>
          <span className="text-slate-500">100% Tracked Duration</span>
        </div>
        <div className="h-4 w-full bg-slate-950 rounded-lg overflow-hidden flex shadow-inner border border-slate-800">
          {events.map((evt, idx) => {
            const pct = Math.max(1, (evt.durationSeconds / (totalEventDuration || 1)) * 100);
            const isBreak = evt.applicationName.toLowerCase().includes('break');
            const isIdle = evt.type === ActivityEventType.IDLE_INTERVAL;
            const barColor = isBreak
              ? 'bg-cyan-500 hover:bg-cyan-400'
              : isIdle
              ? 'bg-amber-400 hover:bg-amber-300'
              : 'bg-indigo-600 hover:bg-indigo-500';

            return (
              <div
                key={idx}
                className={`${barColor} h-full transition-all cursor-pointer border-r border-slate-900/60 relative group`}
                style={{ width: `${pct}%` }}
                title={`${evt.applicationName} (${formatDuration(evt.durationSeconds)})`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500"></span> Active App
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-400"></span> Idle Time
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-cyan-500"></span> Break
          </span>
        </div>
      </div>

      {/* Event Timeline Cards */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-slate-800 before:to-slate-900">
        {events.map((evt, idx) => {
          const start = new Date(evt.startedAt);
          const end = new Date(evt.endedAt);
          const startTimeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const endTimeStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          return (
            <div key={evt.eventId || idx} className="relative flex items-start gap-3 group">
              {/* Dot Icon */}
              <div className="absolute -left-[27px] top-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-700 group-hover:border-indigo-400 flex items-center justify-center shadow-md transition-colors">
                {getEventIcon(evt)}
              </div>

              {/* Card Container */}
              <div className="flex-1 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 hover:bg-slate-900/80 hover:border-slate-700 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-white truncate">{evt.applicationName}</span>
                    {evt.processName && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {evt.processName}
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${getEventBadgeClass(evt)}`}>
                    {formatDuration(evt.durationSeconds)}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400 font-medium">
                  <span>
                    🕒 {startTimeStr} → {endTimeStr}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
