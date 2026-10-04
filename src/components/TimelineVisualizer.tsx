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
      <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-600">
          <Clock className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900">No Activity Events Recorded</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
          No desktop focus intervals were captured for {dateStr}. Start work on the desktop agent to begin real-time activity capture.
        </p>
      </div>
    );
  }

  const getEventIcon = (event: TimelineEvent) => {
    if (event.applicationName.toLowerCase().includes('break') || event.type === 'BREAK') {
      return <Coffee className="w-3.5 h-3.5 text-sky-700" />;
    }
    if (event.type === ActivityEventType.IDLE_INTERVAL) {
      return <Moon className="w-3.5 h-3.5 text-amber-700" />;
    }
    return <Monitor className="w-3.5 h-3.5 text-slate-900" />;
  };

  const getEventBadgeClass = (event: TimelineEvent) => {
    if (event.applicationName.toLowerCase().includes('break')) {
      return 'bg-sky-50 text-sky-800 border-sky-200';
    }
    if (event.type === ActivityEventType.IDLE_INTERVAL) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const totalEventDuration = events.reduce((acc, curr) => acc + curr.durationSeconds, 0);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Chronological Day Timeline</h3>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              <Sparkles className="w-3 h-3 text-black" /> Telemetry Feed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sequential application focus, idle intervals, and break switches for {dateStr}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <Layers className="w-3.5 h-3.5 text-slate-700" />
          <span>{events.length} Events • <strong className="text-slate-900">{formatDuration(totalEventDuration)}</strong> Total</span>
        </div>
      </div>

      {/* Visual Multi-Segment Bar */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
          <span>Day Distribution Bar</span>
          <span className="text-slate-400">100% Tracked Duration</span>
        </div>
        <div className="h-4 w-full bg-slate-100 rounded-lg overflow-hidden flex shadow-inner border border-slate-200">
          {events.map((evt, idx) => {
            const pct = Math.max(1, (evt.durationSeconds / (totalEventDuration || 1)) * 100);
            const isBreak = evt.applicationName.toLowerCase().includes('break');
            const isIdle = evt.type === ActivityEventType.IDLE_INTERVAL;
            const barColor = isBreak
              ? 'bg-sky-500 hover:bg-sky-400'
              : isIdle
              ? 'bg-amber-400 hover:bg-amber-300'
              : 'bg-black hover:bg-slate-800';

            return (
              <div
                key={idx}
                className={`${barColor} h-full transition-all cursor-pointer border-r border-white/40 relative group`}
                style={{ width: `${pct}%` }}
                title={`${evt.applicationName} (${formatDuration(evt.durationSeconds)})`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-black"></span> Active App
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-400"></span> Idle Time
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-sky-500"></span> Break
          </span>
        </div>
      </div>

      {/* Event Timeline Cards */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {events.map((evt, idx) => {
          const start = evt.startedAt ? new Date(evt.startedAt) : null;
          const end = evt.endedAt ? new Date(evt.endedAt) : null;
          const startTimeStr =
            start && !isNaN(start.getTime())
              ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : '—';
          const endTimeStr =
            end && !isNaN(end.getTime())
              ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : 'Now';

          return (
            <div key={evt.eventId || idx} className="relative flex items-start gap-3 group">
              {/* Dot Icon */}
              <div className="absolute -left-[27px] top-1 w-6 h-6 rounded-full bg-white border-2 border-slate-300 group-hover:border-black flex items-center justify-center shadow-xs transition-colors">
                {getEventIcon(evt)}
              </div>

              {/* Card Container */}
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3.5 hover:bg-slate-100 hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-slate-900 truncate">{evt.applicationName}</span>
                    {evt.processName && (
                      <span className="text-[10px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {evt.processName}
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${getEventBadgeClass(evt)}`}>
                    {formatDuration(evt.durationSeconds)}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500 font-medium">
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
