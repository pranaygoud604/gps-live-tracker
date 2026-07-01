import { Wifi, WifiOff, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SocketStatus, ConnectionQuality } from '@/types';
import { cn, getConnectionQualityColor, getConnectionQualityLabel } from '@/lib/utils';

interface ConnectionStatusProps {
  status: SocketStatus;
  quality: ConnectionQuality;
  compact?: boolean;
}

export function ConnectionStatus({ status, quality, compact = false }: ConnectionStatusProps) {
  const qualityColor = getConnectionQualityColor(quality);
  const qualityLabel = getConnectionQualityLabel(quality);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className={cn('relative flex h-2 w-2')}>
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75',
              status.isConnected ? 'bg-emerald-400 animate-ping' : 'bg-red-400',
            )}
          />
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              status.isConnected ? 'bg-emerald-400' : 'bg-red-400',
            )}
          />
        </span>
        <span className={cn('text-xs font-medium', status.isConnected ? 'text-emerald-400' : 'text-red-400')}>
          {status.isConnected ? 'Live' : status.isConnecting ? 'Connecting…' : 'Offline'}
        </span>
        {status.latency !== null && status.isConnected && (
          <span className="text-2xs text-slate-500">{status.latency}ms</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <AnimatePresence mode="wait">
        {status.isConnected ? (
          <motion.div
            key="connected"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
          >
            <Activity size={12} className="text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Connected</span>
            {status.latency !== null && (
              <span className={cn('text-2xs font-mono', qualityColor)}>{status.latency}ms</span>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="disconnected"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20"
          >
            {status.isConnecting ? (
              <Wifi size={12} className="text-amber-400 animate-pulse" />
            ) : (
              <WifiOff size={12} className="text-red-400" />
            )}
            <span className={cn('text-xs font-medium', status.isConnecting ? 'text-amber-400' : 'text-red-400')}>
              {status.isConnecting
                ? `Reconnecting (${status.reconnectAttempts})`
                : 'Disconnected'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {status.isConnected && (
        <div className="hidden sm:flex items-center gap-1">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-1 rounded-full transition-all duration-300',
                quality === 'excellent' && i < 4 ? 'bg-emerald-400' :
                quality === 'good' && i < 3 ? 'bg-blue-400' :
                quality === 'poor' && i < 2 ? 'bg-amber-400' :
                i < 1 ? 'bg-red-400' : 'bg-white/10',
              )}
              style={{ height: `${(i + 1) * 4}px` }}
            />
          ))}
          <span className={cn('text-2xs ml-1', qualityColor)}>{qualityLabel}</span>
        </div>
      )}
    </div>
  );
}
