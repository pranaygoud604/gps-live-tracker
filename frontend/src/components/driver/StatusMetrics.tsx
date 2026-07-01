import { motion } from 'framer-motion';
import {
  Gauge, Crosshair, BatteryMedium, BatteryFull, BatteryLow, BatteryWarning,
  Wifi, Radio, MapPin, Shield,
} from 'lucide-react';
import { GeolocationState } from '@/types';
import { cn, formatSpeed, formatAccuracy, formatBattery } from '@/lib/utils';

interface BatteryInfo {
  level: number | null;
  charging: boolean;
  isSupported: boolean;
}

interface StatusMetricsProps {
  geo: GeolocationState;
  battery: BatteryInfo;
  networkType: string | null;
  isTracking: boolean;
  address: string | null;
  wakeLockActive: boolean;
}

function BatteryIcon({ level }: { level: number | null }) {
  if (level === null) return <BatteryMedium size={16} className="text-slate-500" />;
  if (level > 60) return <BatteryFull size={16} className="text-emerald-400" />;
  if (level > 20) return <BatteryMedium size={16} className="text-amber-400" />;
  if (level > 10) return <BatteryLow size={16} className="text-orange-400" />;
  return <BatteryWarning size={16} className="text-red-400" />;
}

function MetricCard({
  icon, label, value, subValue, color = 'text-white',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-xl p-3 flex flex-col gap-1"
    >
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="text-2xs uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn('text-xl font-bold metric-value', color)}>{value}</p>
      {subValue && <p className="text-2xs text-slate-500">{subValue}</p>}
    </motion.div>
  );
}

export function StatusMetrics({
  geo, battery, networkType, isTracking, address, wakeLockActive,
}: StatusMetricsProps) {
  const speedKmh = formatSpeed(geo.speed);
  const accuracyLabel = formatAccuracy(geo.accuracy);
  const batteryStr = formatBattery(battery.level);

  const accuracyColor =
    !geo.accuracy ? 'text-slate-500' :
    geo.accuracy < 10 ? 'text-emerald-400' :
    geo.accuracy < 30 ? 'text-blue-400' :
    geo.accuracy < 100 ? 'text-amber-400' : 'text-red-400';

  const speedColor =
    !geo.speed ? 'text-slate-400' :
    geo.speed * 3.6 < 40 ? 'text-emerald-400' :
    geo.speed * 3.6 < 80 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          icon={<Gauge size={14} />}
          label="Speed"
          value={`${speedKmh} km/h`}
          color={speedColor}
        />
        <MetricCard
          icon={<Crosshair size={14} />}
          label="GPS Accuracy"
          value={accuracyLabel}
          subValue={geo.accuracy ? `±${Math.round(geo.accuracy)}m` : undefined}
          color={accuracyColor}
        />
        <MetricCard
          icon={<BatteryIcon level={battery.level} />}
          label="Battery"
          value={batteryStr}
          subValue={battery.charging ? 'Charging' : undefined}
          color={
            battery.level === null ? 'text-slate-500' :
            battery.level > 60 ? 'text-emerald-400' :
            battery.level > 20 ? 'text-amber-400' : 'text-red-400'
          }
        />
        <MetricCard
          icon={<Wifi size={14} />}
          label="Network"
          value={networkType?.toUpperCase() ?? 'Unknown'}
          color="text-blue-400"
        />
      </div>

      {/* Address card */}
      <div className="glass rounded-xl p-3 flex items-start gap-2">
        <MapPin size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-2xs text-slate-500 uppercase tracking-wider mb-0.5">Current Location</p>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isTracking && address ? address : geo.latitude && geo.longitude
              ? `${geo.latitude.toFixed(6)}, ${geo.longitude.toFixed(6)}`
              : 'Waiting for GPS signal…'}
          </p>
        </div>
      </div>

      {/* Status flags */}
      <div className="flex flex-wrap gap-2">
        {wakeLockActive && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20">
            <Shield size={10} className="text-brand-400" />
            <span className="text-2xs text-brand-400">Screen Active</span>
          </div>
        )}
        {isTracking && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Radio size={10} className="text-emerald-400 animate-pulse" />
            <span className="text-2xs text-emerald-400">Broadcasting</span>
          </div>
        )}
        {geo.permissionState === 'granted' && !isTracking && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-500/10 border border-slate-500/20">
            <Crosshair size={10} className="text-slate-400" />
            <span className="text-2xs text-slate-400">GPS Ready</span>
          </div>
        )}
      </div>
    </div>
  );
}
