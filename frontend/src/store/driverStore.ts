import { create } from 'zustand';
import { DriverSession, FleetStats, ActivityEvent } from '@/types';

interface DriverStore {
  sessions: Map<string, DriverSession>;
  stats: FleetStats;
  activityLog: ActivityEvent[];
  selectedDriverId: string | null;
  searchQuery: string;

  setSessions: (sessions: DriverSession[]) => void;
  upsertSession: (session: DriverSession) => void;
  updateLocation: (data: {
    driverId: string;
    location: DriverSession['location'];
    battery: number | null;
    network: string | null;
    address: string | null;
    isTracking: boolean;
    timestamp: string;
  }) => void;
  setDriverOffline: (driverId: string) => void;
  setStats: (stats: FleetStats) => void;
  pushActivity: (event: ActivityEvent) => void;
  setActivityLog: (log: ActivityEvent[]) => void;
  setSelectedDriver: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
}

const defaultStats: FleetStats = {
  total: 0,
  online: 0,
  offline: 0,
  tracking: 0,
  avgSpeedKmh: 0,
};

export const useDriverStore = create<DriverStore>((set) => ({
  sessions: new Map(),
  stats: defaultStats,
  activityLog: [],
  selectedDriverId: null,
  searchQuery: '',

  setSessions: (sessions) => {
    const map = new Map<string, DriverSession>();
    sessions.forEach((s) => map.set(s.driverId, s));
    set({ sessions: map });
  },

  upsertSession: (session) => {
    set((state) => {
      const map = new Map(state.sessions);
      map.set(session.driverId, session);
      return { sessions: map };
    });
  },

  updateLocation: (data) => {
    set((state) => {
      const map = new Map(state.sessions);
      const session = map.get(data.driverId);
      if (!session) return {};
      map.set(data.driverId, {
        ...session,
        location: data.location,
        battery: data.battery,
        network: data.network,
        address: data.address,
        isTracking: data.isTracking,
        lastLocationUpdate: data.timestamp,
        lastSeen: data.timestamp,
      });
      return { sessions: map };
    });
  },

  setDriverOffline: (driverId) => {
    set((state) => {
      const map = new Map(state.sessions);
      const session = map.get(driverId);
      if (!session) return {};
      map.set(driverId, {
        ...session,
        isOnline: false,
        isTracking: false,
        lastSeen: new Date().toISOString(),
      });
      return { sessions: map };
    });
  },

  setStats: (stats) => set({ stats }),

  pushActivity: (event) => {
    set((state) => ({
      activityLog: [event, ...state.activityLog].slice(0, 100),
    }));
  },

  setActivityLog: (log) => set({ activityLog: log }),

  setSelectedDriver: (id) => set({ selectedDriverId: id }),

  setSearchQuery: (q) => set({ searchQuery: q }),
}));

export function useFilteredSessions(): DriverSession[] {
  const { sessions, searchQuery } = useDriverStore();
  const all = Array.from(sessions.values());
  if (!searchQuery.trim()) return all;
  const q = searchQuery.toLowerCase();
  return all.filter(
    (s) =>
      s.driverName.toLowerCase().includes(q) ||
      s.vehicleNumber.toLowerCase().includes(q),
  );
}
