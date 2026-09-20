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
      bg: 'bg-indigo-500/10 text-indigo-600',
      border: 'border-indigo-500/20',
      gradient: 'from-indigo-500/5 to-transparent',
      hoverBorder: 'hover:border-indigo-500/40',
      iconGlow: 'shadow-indigo-500/20'
    },
    emerald: {
      bg: 'bg-emerald-500/10 text-emerald-600',
      border: 'border-emerald-500/20',
      gradient: 'from-emerald-500/5 to-transparent',
      hoverBorder: 'hover:border-emerald-500/40',
      iconGlow: 'shadow-emerald-500/20'
    },
    amber: {
      bg: 'bg-amber-500/10 text-amber-600',
      border: 'border-amber-500/20',
      gradient: 'from-amber-500/5 to-transparent',
      hoverBorder: 'hover:border-amber-500/40',
      iconGlow: 'shadow-amber-500/20'
    },
    cyan: {
      bg: 'bg-cyan-500/10 text-cyan-600',
      border: 'border-cyan-500/20',
      gradient: 'from-cyan-500/5 to-transparent',
      hoverBorder: 'hover:border-cyan-500/40',
      iconGlow: 'shadow-cyan-500/20'
    },
    slate: {
      bg: 'bg-slate-500/10 text-slate-600',
      border: 'border-slate-500/20',
      gradient: 'from-slate-500/5 to-transparent',
      hoverBorder: 'hover:border-slate-500/40',
      iconGlow: 'shadow-slate-500/20'
    },
    rose: {
      bg: 'bg-rose-500/10 text-rose-600',
      border: 'border-rose-500/20',
      gradient: 'from-rose-500/5 to-transparent',
      hoverBorder: 'hover:border-rose-500/40',
      iconGlow: 'shadow-rose-500/20'
    },
    violet: {
      bg: 'bg-violet-500/10 text-violet-600',
      border: 'border-violet-500/20',
      gradient: 'from-violet-500/5 to-transparent',
      hoverBorder: 'hover:border-violet-500/40',
      iconGlow: 'shadow-violet-500/20'
    }
  };

  const c = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`relative overflow-hidden bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${c.hoverBorder} group`}
    >
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${c.gradient} pointer-events-none transition-all duration-500 group-hover:scale-150`} />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
            {title}
          </p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight font-sans">
            {value}
          </h3>
          {(subtitle || trend) && (
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
              {trend && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  <TrendingUp className="w-3 h-3" /> {trend}
                </span>
              )}
              {subtitle && <span className="truncate">{subtitle}</span>}
            </div>
          )}
        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.bg} border ${c.border} shadow-sm ${c.iconGlow} shrink-0 transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
