import React from 'react';
import { LucideIcon, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  icon: LucideIcon;
  color?: 'indigo' | 'emerald' | 'amber' | 'cyan' | 'slate' | 'rose' | 'violet';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  color = 'indigo'
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-slate-100 text-slate-900',
      border: 'border-slate-200'
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-800',
      border: 'border-emerald-200'
    },
    amber: {
      bg: 'bg-amber-50 text-amber-800',
      border: 'border-amber-200'
    },
    cyan: {
      bg: 'bg-cyan-50 text-cyan-800',
      border: 'border-cyan-200'
    },
    slate: {
      bg: 'bg-slate-100 text-slate-800',
      border: 'border-slate-200'
    },
    rose: {
      bg: 'bg-red-50 text-red-800',
      border: 'border-red-200'
    },
    violet: {
      bg: 'bg-purple-50 text-purple-800',
      border: 'border-purple-200'
    }
  };

  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className="relative overflow-hidden bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all group">
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight font-sans">
            {value}
          </h3>
          {(subtitle || trend) && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 font-medium">
              {trend && (
                <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  <TrendingUp className="w-3 h-3" /> {trend}
                </span>
              )}
              {subtitle && <span className="truncate text-slate-500">{subtitle}</span>}
            </div>
          )}
        </div>

        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${c.bg} border ${c.border} shrink-0 transition-transform duration-300 group-hover:scale-105`}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
    </div>
  );
};
