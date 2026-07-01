import { motion } from 'framer-motion';
import { Gauge, Battery, Wifi, Clock, Navigation } from 'lucide-react';
import { DriverSession } from '@/types';
import { cn, getInitials, formatSpeed, formatTimeAgo, formatBattery, getBatteryColor } from '@/lib/utils';

const DRIVER_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
  '#f97316', '#6366f1',
];

function getDriverColor(index: number): string {
  return DRIVER_COLORS[index % DRIVER_COLORS.length] ?? '#3b82f6';
}

interface DriverCardProps {
  session: DriverSession;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

export function DriverCard({ session, index, isSelected, onClick }: DriverCardProps) {
  const color = getDriverColor(index);
  const initials = getInitials(session.driverName);
  const speedKmh = formatSpeed(session.location?.speed ?? null);
  const battery = formatBattery(session.battery);
  const batteryColor = getBatteryColor(session.battery);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={onClick}
      className={cn(
        'relative cursor-pointer rounded-xl p-3 border transition-all duration-200',
        'hover:border-white/15 hover:bg-white/6',
        isSelected
          ? 'bg-white/8 border-white/15 shadow-lg'
          : 'bg-white/3 border-white/6',
      )}
      style={isSelected ? { borderColor: `${color}44` } : {}}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div
          className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
          style={{ background: color }}
        />
      )}

      <div className="flex items-start gap-2.5 pl-1">
        {/* Avatar */}
        <div
          className="relative w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${color}ee, ${color}88)` }}
        >
          {initials}
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-800',
              session.isOnline ? 'bg-emerald-400' : 'bg-slate-600',
            )}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {session.driverName}
            </p>
            {session.isTracking && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 font-mono">{session.vehicleNumber}</p>

          {/* Metrics row */}
          <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
            {session.location && session.isTracking && (
              <div className="flex items-center gap-1">
                <Gauge size={10} className="text-slate-500" />
                <span className="text-xs font-mono text-slate-300">{speedKmh}km/h</span>
              </div>
            )}

            {session.battery !== null && (
              <div className="flex items-center gap-1">
                <Battery size={10} className="text-slate-500" />
                <span className={cn('text-xs', batteryColor)}>{battery}</span>
              </div>
            )}

            {session.network && (
              <div className="flex items-center gap-1">
                <Wifi size={10} className="text-slate-500" />
                <span className="text-xs text-slate-500">{session.network}</span>
              </div>
            )}
          </div>

          {/* Location or last seen */}
          <div className="flex items-center gap-1 mt-1">
            {session.location && session.isOnline ? (
              <div className="flex items-center gap-1 min-w-0">
                <Navigation size={9} className="text-slate-600 flex-shrink-0" />
                <span className="text-[10px] text-slate-500 truncate">
                  {session.address
                    ? session.address.split(',').slice(0, 2).join(',')
                    : `${session.location.lat.toFixed(4)}, ${session.location.lng.toFixed(4)}`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Clock size={9} className="text-slate-600" />
                <span className="text-[10px] text-slate-600">{formatTimeAgo(session.lastSeen)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
