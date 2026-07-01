import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LogOut, Menu, X, Bell, RefreshCw, PanelRightOpen, PanelRightClose, Users } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/authStore';
import { useDriverStore, useFilteredSessions } from '@/store/driverStore';
import { FleetMapContainer } from './MapContainer';
import { DriverCard } from './DriverCard';
import { StatsPanel } from './StatsPanel';
import { ActivityFeed } from './ActivityFeed';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';
import { ManageDriversModal } from './ManageDriversModal';
import { DriverSession, ActivityEvent, FleetStats } from '@/types';

export function AdminDashboard() {
  const { user, token, logout } = useAuthStore();
  const {
    setSessions, upsertSession, updateLocation, setDriverOffline,
    setStats, pushActivity, setActivityLog, stats, activityLog,
    selectedDriverId, setSelectedDriver, searchQuery, setSearchQuery,
  } = useDriverStore();

  const filteredSessions = useFilteredSessions();
  const allSessions = Array.from(useDriverStore.getState().sessions.values());

  const { socket, status, connectionQuality } = useSocket({
    token,
    role: 'admin',
    enabled: !!token,
  });

  const [showActivity, setShowActivity] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [emergencyAlerts, setEmergencyAlerts] = useState<ActivityEvent[]>([]);
  const [showManageDrivers, setShowManageDrivers] = useState(false);

  const handleDriverListEvent = useCallback(
    (data: { sessions: DriverSession[]; stats: FleetStats; activityLog: ActivityEvent[] }) => {
      setSessions(data.sessions);
      setStats(data.stats);
      setActivityLog(data.activityLog);
      setLastRefresh(new Date());
    },
    [setSessions, setStats, setActivityLog],
  );

  useEffect(() => {
    if (!socket) return;

    socket.on('driver_list', handleDriverListEvent);

    socket.on('driver_connected', ({ session, activity }: { session: DriverSession; activity: ActivityEvent }) => {
      upsertSession(session);
      pushActivity(activity);
      setLastRefresh(new Date());
    });

    socket.on('driver_disconnected', ({ session: disconnectedSession, activity }: { session: DriverSession; activity: ActivityEvent }) => {
      setDriverOffline(disconnectedSession.driverId);
      pushActivity(activity);
    });

    socket.on('location_update', (data: {
      driverId: string; vehicleNumber: string; driverName: string;
      location: DriverSession['location']; battery: number | null;
      network: string | null; address: string | null;
      isTracking: boolean; timestamp: string;
    }) => {
      updateLocation({
        driverId: data.driverId,
        location: data.location,
        battery: data.battery,
        network: data.network,
        address: data.address,
        isTracking: data.isTracking,
        timestamp: data.timestamp,
      });
    });

    socket.on('tracking_started', ({ session, activity }: { session: DriverSession; activity: ActivityEvent }) => {
      upsertSession(session);
      pushActivity(activity);
    });

    socket.on('tracking_stopped', ({ session, activity }: { session: DriverSession; activity: ActivityEvent }) => {
      upsertSession(session);
      pushActivity(activity);
    });

    socket.on('stats_update', (newStats: FleetStats) => {
      setStats(newStats);
    });

    socket.on('driver_heartbeat', (data: { driverId: string; battery: number | null; network: string | null; lastSeen: string }) => {
      const store = useDriverStore.getState();
      const session = store.sessions.get(data.driverId);
      if (session) {
        store.upsertSession({ ...session, battery: data.battery, network: data.network, lastSeen: data.lastSeen });
      }
    });

    socket.on('emergency', ({ activity }: { session: DriverSession; activity: ActivityEvent }) => {
      pushActivity(activity);
      setEmergencyAlerts((a) => [activity, ...a].slice(0, 5));
      setTimeout(() => setEmergencyAlerts((a) => a.filter((e) => e.id !== activity.id)), 15000);
    });

    socket.on('connect', () => {
      socket.emit('request_driver_list');
    });

    return () => {
      socket.off('driver_list');
      socket.off('driver_connected');
      socket.off('driver_disconnected');
      socket.off('location_update');
      socket.off('tracking_started');
      socket.off('tracking_stopped');
      socket.off('stats_update');
      socket.off('driver_heartbeat');
      socket.off('emergency');
      socket.off('connect');
    };
  }, [socket, handleDriverListEvent, setSessions, upsertSession, updateLocation, setDriverOffline, setStats, pushActivity, setActivityLog]);

  const handleRefresh = useCallback(() => {
    socket?.emit('request_driver_list');
    setLastRefresh(new Date());
  }, [socket]);

  const onlineCount = allSessions.filter((s) => s.isOnline).length;
  const offlineCount = allSessions.filter((s) => !s.isOnline).length;

  return (
    <div className="h-dvh bg-surface-900 flex flex-col overflow-hidden">
      <ManageDriversModal open={showManageDrivers} onClose={() => setShowManageDrivers(false)} />

      {/* Emergency alerts */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
        <AnimatePresence>
          {emergencyAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60 }}
              className="glass-dark rounded-xl p-3 border border-red-500/40 shadow-glow-red pointer-events-auto max-w-xs"
            >
              <div className="flex items-start gap-2">
                <Bell size={14} className="text-red-400 mt-0.5 animate-bounce" />
                <div>
                  <p className="text-xs font-bold text-red-400">EMERGENCY ALERT</p>
                  <p className="text-xs text-slate-300 mt-0.5">{alert.message}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{alert.vehicleNumber}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <header className="glass-dark border-b border-white/6 px-4 py-3 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          {/* Logo / Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-black text-xs">BF</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-white leading-none">Balaji Fleet</h1>
              <p className="text-[10px] text-slate-600 leading-none mt-0.5">Fleet Control Center</p>
            </div>
          </div>

          {/* Stats mini */}
          <div className="hidden md:flex items-center gap-3 ml-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">{onlineCount} Online</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <span className="text-xs text-slate-600">{offlineCount} Offline</span>
          </div>

          <div className="flex-1" />

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <ConnectionStatus status={status} quality={connectionQuality} compact />

            <button
              onClick={() => setShowManageDrivers(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-brand-600/20 border border-brand-500/30 text-brand-400 hover:bg-brand-600/30 hover:text-brand-300 transition-colors text-xs font-medium"
              title="Manage Drivers"
            >
              <Users size={12} />
              <span className="hidden sm:inline">Drivers</span>
            </button>

            <button
              onClick={handleRefresh}
              className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-500 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>

            <button
              onClick={() => setShowActivity((s) => !s)}
              className="hidden lg:flex w-8 h-8 rounded-lg glass items-center justify-center text-slate-500 hover:text-white transition-colors"
              title="Toggle activity feed"
            >
              {showActivity ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
            </button>

            <button
              onClick={() => setSidebarOpen((s) => !s)}
              className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-500 hover:text-white transition-colors lg:hidden"
            >
              {sidebarOpen ? <X size={13} /> : <Menu size={13} />}
            </button>

            <div className="w-px h-5 bg-white/8" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.name[0]}
              </div>
              <button
                onClick={logout}
                className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={12} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="px-4 py-2 border-b border-white/5 flex-shrink-0">
        <StatsPanel stats={stats} />
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar — driver list */}
        <AnimatePresence initial={false}>
          {(sidebarOpen) && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex-shrink-0 border-r border-white/6 flex flex-col overflow-hidden bg-surface-800/50"
            >
              {/* Search */}
              <div className="p-3 border-b border-white/5 flex-shrink-0">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input
                    type="text"
                    placeholder="Search drivers or vehicles…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white/5 border border-white/8 text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 focus:bg-white/8 transition-all"
                  />
                </div>
              </div>

              {/* Driver list */}
              <div className="flex-1 overflow-y-auto scrollbar-none p-2 space-y-1">
                {filteredSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-600">
                    <p className="text-xs">No drivers found</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {[...filteredSessions]
                      .sort((a, b) => {
                        if (a.isOnline && !b.isOnline) return -1;
                        if (!a.isOnline && b.isOnline) return 1;
                        if (a.isTracking && !b.isTracking) return -1;
                        if (!a.isTracking && b.isTracking) return 1;
                        return 0;
                      })
                      .map((session, i) => (
                        <DriverCard
                          key={session.driverId}
                          session={session}
                          index={i}
                          isSelected={selectedDriverId === session.driverId}
                          onClick={() =>
                            setSelectedDriver(
                              selectedDriverId === session.driverId ? null : session.driverId,
                            )
                          }
                        />
                      ))}
                  </AnimatePresence>
                )}
              </div>

              <div className="px-3 py-2 border-t border-white/5 flex-shrink-0">
                <p className="text-[10px] text-slate-700 text-center">
                  {filteredSessions.length} of {allSessions.length} drivers
                </p>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Map */}
        <main className="flex-1 p-3 overflow-hidden">
          <div className="w-full h-full">
            <FleetMapContainer
              sessions={allSessions}
              selectedDriverId={selectedDriverId}
              onDriverSelect={setSelectedDriver}
            />
          </div>
        </main>

        {/* Right panel — activity feed */}
        <AnimatePresence initial={false}>
          {showActivity && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex-shrink-0 border-l border-white/6 hidden lg:flex overflow-hidden"
            >
              <ActivityFeed events={activityLog} />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="glass-dark border-t border-white/6 px-4 py-1.5 flex items-center justify-between flex-shrink-0">
        <p className="text-[10px] text-slate-700">
          Last refresh: {lastRefresh.toLocaleTimeString('en-IN')}
        </p>
        <p className="text-[10px] text-slate-700">Balaji Readymix Fleet Tracker v1.0</p>
      </div>
    </div>
  );
}
