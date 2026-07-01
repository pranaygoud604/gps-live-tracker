import { motion } from 'framer-motion';
import { Users, Radio, WifiOff, Gauge, Activity } from 'lucide-react';
import { FleetStats } from '@/types';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  delay?: number;
}

function StatCard({ label, value, icon, color, bgColor, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 25 }}
      className="glass rounded-xl px-4 py-3 flex items-center gap-3"
    >
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', bgColor)}>
        <span className={color}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-slate-500 leading-none">{label}</p>
        <p className={cn('text-xl font-bold metric-value leading-tight mt-0.5', color)}>
          {value}
        </p>
      </div>
    </motion.div>
  );
}

interface StatsPanelProps {
  stats: FleetStats;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
      <StatCard
        label="Total Drivers"
        value={stats.total}
        icon={<Users size={14} />}
        color="text-slate-300"
        bgColor="bg-slate-500/15"
        delay={0}
      />
      <StatCard
        label="Online"
        value={stats.online}
        icon={<Activity size={14} />}
        color="text-emerald-400"
        bgColor="bg-emerald-500/15"
        delay={0.05}
      />
      <StatCard
        label="Tracking"
        value={stats.tracking}
        icon={<Radio size={14} />}
        color="text-brand-400"
        bgColor="bg-brand-500/15"
        delay={0.1}
      />
      <StatCard
        label="Offline"
        value={stats.offline}
        icon={<WifiOff size={14} />}
        color="text-slate-500"
        bgColor="bg-slate-500/10"
        delay={0.15}
      />
      <StatCard
        label="Avg Speed"
        value={`${stats.avgSpeedKmh} km/h`}
        icon={<Gauge size={14} />}
        color="text-amber-400"
        bgColor="bg-amber-500/15"
        delay={0.2}
      />
    </div>
  );
}
