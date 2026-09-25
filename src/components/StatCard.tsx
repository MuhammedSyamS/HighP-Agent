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
      bg: 'bg-indigo-500/15 text-indigo-400',
      border: 'border-indigo-500/30',
      gradient: 'from-indigo-600/15 to-transparent',
      hoverBorder: 'hover:border-indigo-500/60',
      iconGlow: 'shadow-indigo-500/30'
    },
    emerald: {
      bg: 'bg-emerald-500/15 text-emerald-400',
      border: 'border-emerald-500/30',
      gradient: 'from-emerald-600/15 to-transparent',
      hoverBorder: 'hover:border-emerald-500/60',
      iconGlow: 'shadow-emerald-500/30'
    },
    amber: {
      bg: 'bg-amber-500/15 text-amber-400',
      border: 'border-amber-500/30',
      gradient: 'from-amber-600/15 to-transparent',
      hoverBorder: 'hover:border-amber-500/60',
      iconGlow: 'shadow-amber-500/30'
    },
    cyan: {
      bg: 'bg-cyan-500/15 text-cyan-400',
      border: 'border-cyan-500/30',
      gradient: 'from-cyan-600/15 to-transparent',
      hoverBorder: 'hover:border-cyan-500/60',
      iconGlow: 'shadow-cyan-500/30'
    },
    slate: {
      bg: 'bg-slate-800 text-slate-300',
      border: 'border-slate-700/60',
      gradient: 'from-slate-700/20 to-transparent',
      hoverBorder: 'hover:border-slate-600',
      iconGlow: 'shadow-slate-500/20'
    },
    rose: {
      bg: 'bg-rose-500/15 text-rose-400',
      border: 'border-rose-500/30',
      gradient: 'from-rose-600/15 to-transparent',
      hoverBorder: 'hover:border-rose-500/60',
      iconGlow: 'shadow-rose-500/30'
    },
    violet: {
      bg: 'bg-violet-500/15 text-violet-400',
      border: 'border-violet-500/30',
      gradient: 'from-violet-600/15 to-transparent',
      hoverBorder: 'hover:border-violet-500/60',
      iconGlow: 'shadow-violet-500/30'
    }
  };

  const c = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`relative overflow-hidden bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${c.hoverBorder} group`}
    >
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${c.gradient} pointer-events-none transition-all duration-500 group-hover:scale-150`} />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
            {title}
          </p>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight font-sans">
            {value}
          </h3>
          {(subtitle || trend) && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400 font-medium">
              {trend && (
                <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3" /> {trend}
                </span>
              )}
              {subtitle && <span className="truncate text-slate-400">{subtitle}</span>}
            </div>
          )}
        </div>

        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${c.bg} border ${c.border} shadow-sm ${c.iconGlow} shrink-0 transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
    </div>
  );
};
