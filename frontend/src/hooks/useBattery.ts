import { useState, useEffect } from 'react';

interface BatteryState {
  level: number | null;
  charging: boolean;
  isSupported: boolean;
}

interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

declare global {
  interface Navigator {
    getBattery?: () => Promise<BatteryManager>;
  }
}

export function useBattery(): BatteryState {
  const [battery, setBattery] = useState<BatteryState>({
    level: null,
    charging: false,
    isSupported: 'getBattery' in navigator,
  });

  useEffect(() => {
    if (!navigator.getBattery) return;

    const updateBattery = (bm: BatteryManager) => {
      setBattery({
        level: Math.round(bm.level * 100),
        charging: bm.charging,
        isSupported: true,
      });
    };

    let cleanup: (() => void) | undefined;

    navigator.getBattery().then((bm) => {
      updateBattery(bm);
      const listener = () => updateBattery(bm);
      bm.addEventListener('levelchange', listener);
      bm.addEventListener('chargingchange', listener);
      cleanup = () => {
        bm.removeEventListener('levelchange', listener);
        bm.removeEventListener('chargingchange', listener);
      };
    }).catch(() => {
      setBattery((s) => ({ ...s, isSupported: false }));
    });

    return () => { cleanup?.(); };
  }, []);

  return battery;
}
