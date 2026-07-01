import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, WifiOff, Navigation, Square, AlertTriangle, MapPin,
} from 'lucide-react';
import { ActivityEvent } from '@/types';
import { formatTimestamp } from '@/lib/utils';

const eventConfig: Record<ActivityEvent['type'], { icon: React.ReactNode; color: string; bgColor: string }> = {
  connected: { icon: <Wifi size={11} />, color: 'text-emerald-400', bgColor: 'bg-emerald-500/15' },
  disconnected: { icon: <WifiOff size={11} />, color: 'text-slate-500', bgColor: 'bg-slate-500/15' },
  tracking_started: { icon: <Navigation size={11} />, color: 'text-brand-400', bgColor: 'bg-brand-500/15' },
  tracking_stopped: { icon: <Square size={11} />, color: 'text-amber-400', bgColor: 'bg-amber-500/15' },
  emergency: { icon: <AlertTriangle size={11} />, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  location: { icon: <MapPin size={11} />, color: 'text-blue-400', bgColor: 'bg-blue-500/15' },
};

interface ActivityFeedProps {
  events: ActivityEvent[];
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [events.length]);

  return (
    <div className="glass rounded-2xl flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-white/6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Live Activity</h3>
          <span className="text-[10px] text-slate-600">{events.length} events</span>
        </div>
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto scrollbar-none p-2 space-y-1"
      >
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-600">
              <Navigation size={20} className="mb-2 opacity-50" />
              <p className="text-xs">Waiting for activity…</p>
            </div>
          ) : (
            events.map((event) => {
              const config = eventConfig[event.type];
              const isEmergency = event.type === 'emergency';

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className={`flex items-start gap-2 p-2 rounded-lg ${isEmergency ? 'bg-red-500/10 border border-red-500/20' : 'hover:bg-white/4'} transition-colors`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${config.bgColor}`}>
                    <span className={config.color}>{config.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium leading-tight ${isEmergency ? 'text-red-400' : 'text-slate-300'}`}>
                      {event.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono text-slate-600">{event.vehicleNumber}</span>
                      <span className="text-[10px] text-slate-700">·</span>
                      <span className="text-[10px] text-slate-600">{formatTimestamp(event.timestamp)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
