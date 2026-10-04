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
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300/80 shadow-xs',
          dot: 'bg-emerald-600',
          pulse: 'bg-emerald-400',
          label: 'Active'
        };
      case ActivityState.IDLE:
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300/80 shadow-xs',
          dot: 'bg-amber-500',
          pulse: 'bg-amber-400',
          label: 'Idle'
        };
      case ActivityState.BREAK:
        return {
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-300/80 shadow-xs',
          dot: 'bg-cyan-600',
          pulse: 'bg-cyan-400',
          label: 'On Break'
        };
      case ActivityState.OFFLINE:
      default:
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          dot: 'bg-slate-400',
          pulse: '',
          label: 'Offline'
        };
    }
  };

  const style = getStyles();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-0.5 text-xs gap-1.5',
    lg: 'px-3 py-1 text-sm gap-2'
  }[size];

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border transition-all ${style.bg} ${sizeClasses} ${className}`}
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
