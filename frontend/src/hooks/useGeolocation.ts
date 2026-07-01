import { useState, useEffect, useRef, useCallback } from 'react';
import { GeolocationState } from '@/types';

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

interface UseGeolocationReturn extends GeolocationState {
  startWatching: () => void;
  stopWatching: () => void;
  isWatching: boolean;
  requestPermission: () => Promise<void>;
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    speed: null,
    heading: null,
    altitude: null,
    timestamp: null,
    error: null,
    isSupported: 'geolocation' in navigator,
    permissionState: 'unknown',
  });

  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) return;
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setState((s) => ({ ...s, permissionState: result.state }));
      result.addEventListener('change', () => {
        setState((s) => ({ ...s, permissionState: result.state }));
      });
    } catch {
      // permissions API not supported
    }
  }, []);

  useEffect(() => {
    void checkPermission();
  }, [checkPermission]);

  const onSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy, speed, heading, altitude } = position.coords;
    setState((s) => ({
      ...s,
      latitude,
      longitude,
      accuracy,
      speed: speed ?? null,
      heading: heading ?? null,
      altitude: altitude ?? null,
      timestamp: position.timestamp,
      error: null,
      permissionState: 'granted',
    }));
  }, []);

  const onError = useCallback((error: GeolocationPositionError) => {
    let message: string;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location permission denied. Please enable GPS in your browser settings.';
        setState((s) => ({ ...s, permissionState: 'denied' }));
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location unavailable. Please check your GPS signal.';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out. Please try again.';
        break;
      default:
        message = 'An unknown location error occurred.';
    }
    setState((s) => ({ ...s, error: message }));
  }, []);

  const startWatching = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, error: 'Geolocation is not supported by this device.' }));
      return;
    }
    if (watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, DEFAULT_OPTIONS);
    setIsWatching(true);
  }, [onSuccess, onError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onSuccess(pos);
          resolve();
        },
        (err) => {
          onError(err);
          reject(err);
        },
        DEFAULT_OPTIONS,
      );
    });
  }, [onSuccess, onError]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { ...state, startWatching, stopWatching, isWatching, requestPermission };
}
