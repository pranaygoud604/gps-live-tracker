import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useBattery } from '@/hooks/useBattery';
import { useAuthStore } from '@/store/authStore';
import { TrackingControls } from './TrackingControls';
import { StatusMetrics } from './StatusMetrics';
import { EmergencyButton } from './EmergencyButton';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';
import { LocationUpdatePayload } from '@/types';

const LOCATION_INTERVAL_MS = 5000;

export function DriverApp() {
  const { user, token } = useAuthStore();
  const geo = useGeolocation();
  const battery = useBattery();
  const { socket, status, connectionQuality, emit } = useSocket({
    token,
    role: 'driver',
    enabled: !!token,
  });

  const [isTracking, setIsTracking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSentRef = useRef<{ lat: number; lng: number } | null>(null);

  const networkType = (() => {
    const conn = (navigator as any).connection;
    return conn?.effectiveType ?? conn?.type ?? null;
  })();

  const acquireWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      const wl = await (navigator as any).wakeLock.request('screen');
      setWakeLock(wl);
      wl.addEventListener('release', () => setWakeLock(null));
    } catch {
      // Wake lock not available in this context
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      try { await wakeLock.release(); } catch { /* ignore */ }
      setWakeLock(null);
    }
  }, [wakeLock]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } },
      );
      const data = await res.json();
      setAddress(data.display_name ?? null);
    } catch {
      setAddress(null);
    }
  }, []);

  const sendLocation = useCallback(() => {
    if (!geo.latitude || !geo.longitude || !socket?.connected) return;

    const isDuplicate =
      lastSentRef.current &&
      Math.abs(lastSentRef.current.lat - geo.latitude) < 0.00001 &&
      Math.abs(lastSentRef.current.lng - geo.longitude) < 0.00001;

    if (isDuplicate) return;

    lastSentRef.current = { lat: geo.latitude, lng: geo.longitude };

    const payload: LocationUpdatePayload = {
      lat: geo.latitude,
      lng: geo.longitude,
      accuracy: geo.accuracy ?? 999,
      speed: geo.speed,
      heading: geo.heading,
      altitude: geo.altitude,
      timestamp: geo.timestamp ?? Date.now(),
      battery: battery.level,
      network: networkType,
      address,
    };

    emit('location_update', payload);
  }, [geo, battery.level, networkType, address, socket, emit]);

  const startTracking = useCallback(async () => {
    setTrackingError(null);
    try {
      await geo.requestPermission();
    } catch {
      setTrackingError('Location permission denied. Please enable GPS.');
      return;
    }

    geo.startWatching();
    emit('start_tracking');
    setIsTracking(true);
    setElapsedSeconds(0);
    await acquireWakeLock();

    elapsedIntervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    locationIntervalRef.current = setInterval(() => {
      sendLocation();
    }, LOCATION_INTERVAL_MS);
  }, [geo, emit, acquireWakeLock, sendLocation]);

  const stopTracking = useCallback(async () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
    geo.stopWatching();
    emit('stop_tracking');
    setIsTracking(false);
    lastSentRef.current = null;
    await releaseWakeLock();
  }, [geo, emit, releaseWakeLock]);

  useEffect(() => {
    if (!isTracking || !geo.latitude || !geo.longitude) return;
    void reverseGeocode(geo.latitude, geo.longitude);
  }, [isTracking, geo.latitude, geo.longitude, reverseGeocode]);

  useEffect(() => {
    if (socket) {
      socket.on('tracking_ack', ({ isTracking: serverTracking }: { isTracking: boolean }) => {
        if (!serverTracking && isTracking) setIsTracking(false);
      });
    }
    return () => {
      socket?.off('tracking_ack');
    };
  }, [socket, isTracking]);

  useEffect(() => {
    if (isTracking && geo.latitude && geo.longitude) {
      sendLocation();
    }
  }, [geo.latitude, geo.longitude, isTracking, sendLocation]);

  useEffect(() => {
    return () => {
      void stopTracking();
    };
  }, []);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="min-h-dvh bg-surface-900 flex flex-col safe-area-pt safe-area-pb">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Fleet Tracker</h1>
          <p className="text-xs text-slate-500">{user?.vehicleNumber ?? 'Driver App'}</p>
        </div>
        <ConnectionStatus status={status} quality={connectionQuality} compact />
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 py-2 space-y-3 overflow-y-auto scrollbar-none">
        {/* Driver info card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg">
              {user?.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{user?.name}</p>
              <p className="text-sm text-slate-400">{user?.vehicleNumber}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isTracking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className={`text-xs font-medium ${isTracking ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isTracking ? 'Tracking' : 'Idle'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Error notice */}
        <AnimatePresence>
          {(trackingError || geo.error) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-xl bg-red-500/10 border border-red-500/20 p-3"
            >
              <p className="text-sm text-red-400">{trackingError ?? geo.error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Elapsed time when tracking */}
        <AnimatePresence>
          {isTracking && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass rounded-2xl p-4 text-center overflow-hidden"
            >
              <p className="text-2xs text-slate-500 uppercase tracking-widest mb-1">Elapsed Time</p>
              <p className="text-4xl font-mono font-bold text-white tracking-tight metric-value">
                {formatElapsed(elapsedSeconds)}
              </p>
              <div className="mt-2 w-12 h-1 bg-brand-500 rounded-full mx-auto animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status metrics */}
        <StatusMetrics
          geo={geo}
          battery={battery}
          networkType={networkType}
          isTracking={isTracking}
          address={address}
          wakeLockActive={!!wakeLock}
        />

        {/* Tracking controls */}
        <TrackingControls
          isTracking={isTracking}
          isConnected={status.isConnected}
          hasLocation={!!geo.latitude}
          permissionState={geo.permissionState}
          onStart={startTracking}
          onStop={stopTracking}
        />

        {/* Emergency button */}
        <EmergencyButton
          isConnected={status.isConnected}
          location={geo.latitude && geo.longitude ? { lat: geo.latitude, lng: geo.longitude } : null}
          onEmergency={(data) => emit('emergency', data)}
        />

        {/* GPS permission guide */}
        <AnimatePresence>
          {geo.permissionState === 'denied' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-4 border border-amber-500/20"
            >
              <p className="text-sm font-semibold text-amber-400 mb-1">GPS Permission Required</p>
              <p className="text-xs text-slate-400">
                Please allow location access in your browser settings. On Chrome Android: tap the lock icon in the address bar → Site settings → Location → Allow.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer for safe area */}
        <div className="h-4" />
      </div>
    </div>
  );
}
