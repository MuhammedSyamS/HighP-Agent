'use client';

import React, { useState, useMemo } from 'react';
import { formatDuration } from '../lib/utils';
import {
  Clock,
  Coffee,
  Monitor,
  Moon,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Globe,
  Code2,
  Folder,
  LayoutGrid,
  List
} from 'lucide-react';
import { ActivityEventType } from '@highp/shared';

interface TimelineEvent {
  _id?: string;
  eventId: string;
  type: ActivityEventType | string;
  applicationName: string;
  processName?: string;
  websiteDomain?: string;
  domain?: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
}

interface TimelineVisualizerProps {
  events: TimelineEvent[];
  dateStr: string;
}

export const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({ events, dateStr }) => {
  const [viewMode, setViewMode] = useState<'grouped' | 'stream'>('grouped');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getEventIcon = (name: string, type: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('break') || type === 'BREAK') {
      return <Coffee className="w-4 h-4 text-sky-600" />;
    }
    if (type === ActivityEventType.IDLE_INTERVAL || lower.includes('idle')) {
      return <Moon className="w-4 h-4 text-amber-600" />;
    }
    if (lower.includes('code') || lower.includes('antigravity') || lower.includes('studio') || lower.includes('cursor')) {
      return <Code2 className="w-4 h-4 text-indigo-600" />;
    }
    if (lower.includes('chrome') || lower.includes('brave') || lower.includes('edge') || lower.includes('firefox')) {
      return <Globe className="w-4 h-4 text-emerald-600" />;
    }
    if (lower.includes('explorer')) {
      return <Folder className="w-4 h-4 text-amber-600" />;
    }
    return <Monitor className="w-4 h-4 text-slate-700" />;
  };

  const getEventBadgeClass = (name: string, type: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('break') || type === 'BREAK') {
      return 'bg-sky-50 text-sky-800 border-sky-200';
    }
    if (type === ActivityEventType.IDLE_INTERVAL || lower.includes('idle')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (lower.includes('antigravity') || lower.includes('code')) {
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const totalEventDuration = useMemo(() => {
    return (events || []).reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
  }, [events]);

  // Aggregate repeated uses of the same software / website
  const groupedData = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        applicationName: string;
        processName?: string;
        type: ActivityEventType | string;
        websiteDomain?: string;
        totalDurationSeconds: number;
        sessionCount: number;
        firstStartedAt: string;
        lastEndedAt: string;
        sessions: Array<{
          id: string;
          startedAt: string;
          endedAt: string;
          durationSeconds: number;
          websiteDomain?: string;
        }>;
      }
    >();

    for (let i = 0; i < (events || []).length; i++) {
      const evt = events[i];
      const appName = (evt.applicationName || 'Unknown').trim();
      const domain = evt.websiteDomain || evt.domain;
      const groupKey = domain ? `${appName} (${domain})` : appName;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          applicationName: appName,
          processName: evt.processName,
          type: evt.type,
          websiteDomain: domain,
          totalDurationSeconds: 0,
          sessionCount: 0,
          firstStartedAt: evt.startedAt,
          lastEndedAt: evt.endedAt || evt.startedAt,
          sessions: []
        });
      }

      const item = map.get(groupKey)!;
      item.totalDurationSeconds += evt.durationSeconds || 0;
      item.sessionCount += 1;
      if (!item.processName && evt.processName) item.processName = evt.processName;
      if (!item.websiteDomain && domain) item.websiteDomain = domain;

      if (evt.startedAt && new Date(evt.startedAt) < new Date(item.firstStartedAt)) {
        item.firstStartedAt = evt.startedAt;
      }
      const evtEnd = evt.endedAt || evt.startedAt;
      if (evtEnd && new Date(evtEnd) > new Date(item.lastEndedAt)) {
        item.lastEndedAt = evtEnd;
      }

      item.sessions.push({
        id: evt.eventId || `${i}-${evt.startedAt}`,
        startedAt: evt.startedAt,
        endedAt: evt.endedAt,
        durationSeconds: evt.durationSeconds || 0,
        websiteDomain: domain
      });
    }

    // Sort sessions in each group newest first
    for (const group of map.values()) {
      group.sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    }

    // Sort grouped cards by total duration descending
    return Array.from(map.values()).sort((a, b) => b.totalDurationSeconds - a.totalDurationSeconds);
  }, [events]);

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

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Activity Timeline</h3>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
              <Sparkles className="w-3 h-3 text-indigo-600" /> Telemetry Feed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Consolidated software usage, website visits, and workstation timestamps for {dateStr}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grouped'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Consolidated view grouping repeated sessions of the same app"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grouped ({groupedData.length})</span>
            </button>
            <button
              onClick={() => setViewMode('stream')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'stream'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Sequential chronological stream of all focus switches"
            >
              <List className="w-3.5 h-3.5" />
              <span>All Events ({events.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Layers className="w-3.5 h-3.5 text-slate-700" />
            <span><strong className="text-slate-900">{formatDuration(totalEventDuration)}</strong> Total</span>
          </div>
        </div>
      </div>

      {/* Visual Multi-Segment Bar */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
          <span>Day Distribution Bar</span>
          <span className="text-slate-400 font-mono">{formatDuration(totalEventDuration)}</span>
        </div>
        <div className="h-4 w-full bg-slate-100 rounded-lg overflow-hidden flex shadow-inner border border-slate-200">
          {events.map((evt, idx) => {
            const pct = Math.max(0.5, ((evt.durationSeconds || 0) / (totalEventDuration || 1)) * 100);
            const isBreak = evt.applicationName.toLowerCase().includes('break');
            const isIdle = evt.type === ActivityEventType.IDLE_INTERVAL || evt.applicationName.toLowerCase().includes('idle');
            const isCode = evt.applicationName.toLowerCase().includes('antigravity') || evt.applicationName.toLowerCase().includes('code');
            const barColor = isBreak
              ? 'bg-sky-500 hover:bg-sky-400'
              : isIdle
              ? 'bg-amber-400 hover:bg-amber-300'
              : isCode
              ? 'bg-indigo-600 hover:bg-indigo-500'
              : 'bg-slate-800 hover:bg-slate-700';

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
        <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600"></span> Development / Code
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-800"></span> Active App
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-400"></span> Idle Time
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-sky-500"></span> Break
          </span>
        </div>
      </div>

      {/* MODE 1: GROUPED CONSOLIDATED VIEW (SOLVES REPETITIVE ROW SPAM) */}
      {viewMode === 'grouped' && (
        <div className="space-y-3.5">
          {groupedData.map((group) => {
            const isExpanded = !!expandedKeys[group.key];
            const lastSeen = group.lastEndedAt ? new Date(group.lastEndedAt) : null;
            const lastSeenStr =
              lastSeen && !isNaN(lastSeen.getTime())
                ? lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '—';

            return (
              <div
                key={group.key}
                className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 rounded-2xl transition-all overflow-hidden shadow-2xs"
              >
                {/* Main Summary Header Row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                      {getEventIcon(group.applicationName, group.type as string)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {group.applicationName}
                        </span>
                        {group.websiteDomain && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Globe className="w-3 h-3" />
                            {group.websiteDomain}
                          </span>
                        )}
                        {group.processName && (
                          <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {group.processName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200/80">
                          {group.sessionCount} {group.sessionCount === 1 ? 'session' : 'sessions'}
                        </span>
                        <span>•</span>
                        <span>Last active: <strong className="text-slate-700">{lastSeenStr}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <span className={`text-xs font-bold px-3 py-1 rounded-lg border font-mono ${getEventBadgeClass(group.applicationName, group.type as string)}`}>
                      {formatDuration(group.totalDurationSeconds)}
                    </span>

                    {/* Expandable Timestamps Accordion Button */}
                    <button
                      onClick={() => toggleExpand(group.key)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-200 text-xs font-bold transition-all shadow-2xs active:scale-95"
                    >
                      <span>{isExpanded ? 'Hide Timestamps' : `View Timestamps (${group.sessionCount})`}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Timestamps Dropdown (Read More / Detailed Log) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-200/80 bg-white/70">
                    <div className="flex items-center justify-between mb-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Session Intervals ({group.sessionCount})</span>
                      <span>Recorded Time</span>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {group.sessions.map((sess, sIdx) => {
                        const sStart = sess.startedAt ? new Date(sess.startedAt) : null;
                        const sEnd = sess.endedAt ? new Date(sess.endedAt) : null;
                        const sStartStr =
                          sStart && !isNaN(sStart.getTime())
                            ? sStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            : '—';
                        const sEndStr =
                          sEnd && !isNaN(sEnd.getTime())
                            ? sEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            : 'Now';

                        return (
                          <div
                            key={sess.id || sIdx}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 hover:bg-slate-100/70 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                                #{group.sessions.length - sIdx}
                              </span>
                              <span className="font-mono text-slate-800 truncate">
                                🕒 {sStartStr} → {sEndStr}
                              </span>
                              {sess.websiteDomain && (
                                <span className="hidden md:inline text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  {sess.websiteDomain}
                                </span>
                              )}
                            </div>

                            <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] shrink-0">
                              {formatDuration(sess.durationSeconds)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODE 2: CHRONOLOGICAL SEQUENTIAL STREAM */}
      {viewMode === 'stream' && (
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
                  {getEventIcon(evt.applicationName, evt.type as string)}
                </div>

                {/* Card Container */}
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3.5 hover:bg-slate-100 hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate">{evt.applicationName}</span>
                      {(evt.websiteDomain || evt.domain) && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {evt.websiteDomain || evt.domain}
                        </span>
                      )}
                      {evt.processName && (
                        <span className="text-[10px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {evt.processName}
                        </span>
                      )}
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${getEventBadgeClass(evt.applicationName, evt.type as string)}`}>
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
      )}
    </div>
  );
};
