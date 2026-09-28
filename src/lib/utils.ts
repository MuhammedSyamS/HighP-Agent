import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0m';
  const secInt = Math.floor(seconds);
  const hrs = Math.floor(secInt / 3600);
  const mins = Math.floor((secInt % 3600) / 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

export function formatDurationExact(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00:00';
  const secInt = Math.floor(seconds);
  const h = Math.floor(secInt / 3600);
  const m = Math.floor((secInt % 3600) / 60);
  const s = secInt % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export function formatPercent(value: number, total: number): number {
  if (!total || total <= 0 || !value || isNaN(value) || isNaN(total) || value <= 0) return 0;
  return Math.round((value / total) * 100);
}

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
