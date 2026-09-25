import React from 'react';
import { ActivityState } from '@highp/shared';

interface StatusBadgeProps {
  status: ActivityState | string;
  className?: string;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  showDot = true,
  size = 'md'
}) => {
  const getStyles = () => {
    switch (status) {
      case ActivityState.ACTIVE:
        return {
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
          dot: 'bg-emerald-400',
          pulse: 'bg-emerald-400',
          label: 'Active'
        };
      case ActivityState.IDLE:
        return {
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
          dot: 'bg-amber-400',
          pulse: 'bg-amber-400',
          label: 'Idle'
        };
      case ActivityState.BREAK:
        return {
          bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]',
          dot: 'bg-cyan-400',
          pulse: 'bg-cyan-400',
          label: 'On Break'
        };
      case ActivityState.OFFLINE:
      default:
        return {
          bg: 'bg-slate-800/60 text-slate-400 border-slate-700/60',
          dot: 'bg-slate-500',
          pulse: '',
          label: 'Offline'
        };
    }
  };

  const style = getStyles();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2'
  }[size];

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border backdrop-blur-xs transition-all ${style.bg} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span className="relative flex items-center justify-center">
          {style.pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.pulse}`}
            />
          )}
          <span className={`relative inline-flex rounded-full ${style.dot} ${dotSize}`} />
        </span>
      )}
      <span>{style.label}</span>
    </span>
  );
};
