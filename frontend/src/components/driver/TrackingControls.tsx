import { motion } from 'framer-motion';
import { Navigation, Square, MapPin, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrackingControlsProps {
  isTracking: boolean;
  isConnected: boolean;
  hasLocation: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  onStart: () => void;
  onStop: () => void;
}

export function TrackingControls({
  isTracking,
  isConnected,
  hasLocation,
  permissionState,
  onStart,
  onStop,
}: TrackingControlsProps) {
  const canStart = isConnected && permissionState !== 'denied';

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm font-semibold text-white">Location Tracking</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTracking ? 'Broadcasting your location every 5 seconds' : 'Tap Start to begin broadcasting'}
          </p>
        </div>
        <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full text-2xs font-medium',
          isConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400',
        )}>
          {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
          {isConnected ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Big tracking button */}
      <div className="flex justify-center">
        <motion.button
          onClick={isTracking ? onStop : onStart}
          disabled={!canStart && !isTracking}
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.03 }}
          className={cn(
            'relative w-36 h-36 rounded-full flex flex-col items-center justify-center gap-2',
            'font-semibold text-white text-sm border-2 transition-all duration-300',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isTracking
              ? 'border-red-500/50 bg-red-600/20 text-red-400 focus-visible:ring-red-500'
              : 'border-emerald-500/50 bg-emerald-600/20 text-emerald-400 focus-visible:ring-emerald-500',
          )}
        >
          {/* Outer pulse ring when tracking */}
          {isTracking && (
            <>
              <span className="absolute inset-0 rounded-full border-2 border-red-500/40 animate-ping" style={{ animationDuration: '1.5s' }} />
              <span className="absolute inset-[-8px] rounded-full border border-red-500/20 animate-pulse" />
            </>
          )}

          {isTracking ? (
            <>
              <Square size={28} className="fill-current" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Navigation size={28} />
              <span>Start</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Status row */}
      <div className="mt-5 flex items-center justify-center gap-6">
        <div className="flex items-center gap-1.5 text-xs">
          <MapPin size={12} className={hasLocation ? 'text-emerald-400' : 'text-slate-600'} />
          <span className={hasLocation ? 'text-emerald-400' : 'text-slate-600'}>
            {hasLocation ? 'GPS Fixed' : 'No GPS'}
          </span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-1.5 text-xs">
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            permissionState === 'granted' ? 'bg-emerald-400' :
            permissionState === 'denied' ? 'bg-red-400' : 'bg-amber-400',
          )} />
          <span className={cn(
            permissionState === 'granted' ? 'text-emerald-400' :
            permissionState === 'denied' ? 'text-red-400' : 'text-amber-400',
          )}>
            {permissionState === 'granted' ? 'Permission OK' :
             permissionState === 'denied' ? 'Permission Denied' : 'Permission Pending'}
          </span>
        </div>
      </div>

      {!isConnected && (
        <p className="mt-3 text-center text-2xs text-amber-400">
          Reconnecting to server… Tracking will resume when connected.
        </p>
      )}
    </div>
  );
}
