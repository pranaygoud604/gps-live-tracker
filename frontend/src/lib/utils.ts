import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ConnectionQuality } from '@/types';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatSpeed(speedMs: number | null): string {
  if (speedMs === null || speedMs < 0) return '0';
  return Math.round(speedMs * 3.6).toString();
}

export function formatAccuracy(accuracy: number | null): string {
  if (accuracy === null) return '—';
  if (accuracy < 10) return 'Excellent';
  if (accuracy < 30) return 'Good';
  if (accuracy < 100) return 'Fair';
  return 'Poor';
}

export function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 5) return 'Just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatBattery(battery: number | null): string {
  if (battery === null) return '—';
  return `${Math.round(battery)}%`;
}

export function getBatteryColor(battery: number | null): string {
  if (battery === null) return 'text-slate-500';
  if (battery > 60) return 'text-emerald-400';
  if (battery > 20) return 'text-amber-400';
  return 'text-red-400';
}

export function getConnectionQuality(latency: number | null): ConnectionQuality {
  if (latency === null) return 'offline';
  if (latency < 100) return 'excellent';
  if (latency < 300) return 'good';
  return 'poor';
}

export function getConnectionQualityColor(quality: ConnectionQuality): string {
  switch (quality) {
    case 'excellent': return 'text-emerald-400';
    case 'good': return 'text-blue-400';
    case 'poor': return 'text-amber-400';
    case 'offline': return 'text-red-400';
  }
}

export function getConnectionQualityLabel(quality: ConnectionQuality): string {
  switch (quality) {
    case 'excellent': return 'Excellent';
    case 'good': return 'Good';
    case 'poor': return 'Poor';
    case 'offline': return 'Offline';
  }
}

export function getDriverColor(index: number): string {
  const colors = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
    '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
    '#f97316', '#6366f1',
  ];
  return colors[index % colors.length] ?? '#3b82f6';
}

export function isValidLocation(lat: number | null, lng: number | null): boolean {
  return (
    lat !== null && lng !== null &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !isNaN(lat) && !isNaN(lng)
  );
}

export function formatAddress(address: string | null): string {
  if (!address) return 'Location unavailable';
  if (address.length > 60) return address.substring(0, 57) + '…';
  return address;
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}
