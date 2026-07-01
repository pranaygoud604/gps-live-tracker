import { useEffect, useRef, useCallback, useState } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, useMap, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DriverSession } from '@/types';
import { getInitials, formatSpeed, formatTimeAgo, cn } from '@/lib/utils';
import { Maximize2, Minimize2, Layers, Navigation, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const TILE_LAYERS: Record<string, { url: string; attribution: string; label: string }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    label: 'Dark',
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    label: 'Street',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
    label: 'Satellite',
  },
};

const DRIVER_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
  '#f97316', '#6366f1',
];

function getDriverColor(index: number): string {
  return DRIVER_COLORS[index % DRIVER_COLORS.length] ?? '#3b82f6';
}

function createDriverIcon(session: DriverSession, index: number, isSelected: boolean): L.DivIcon {
  const color = getDriverColor(index);
  const initials = getInitials(session.driverName);
  const heading = session.location?.heading ?? 0;
  const speed = session.location?.speed ? Math.round(session.location.speed * 3.6) : 0;
  const size = isSelected ? 52 : 44;

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div class="fleet-marker" style="position:relative;width:${size}px;height:${size}px">
        ${session.isOnline && session.isTracking ? `
          <div style="
            position:absolute;inset:-6px;border-radius:50%;
            border:2px solid ${color};opacity:0.5;
            animation:pulseRing 2s ease-out infinite;
          "></div>
          <div style="
            position:absolute;inset:-12px;border-radius:50%;
            border:1px solid ${color};opacity:0.25;
            animation:pulseRing 2s ease-out 0.5s infinite;
          "></div>
        ` : ''}

        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:conic-gradient(from 0deg, ${color}22, ${color}88, ${color}22);
          transform:rotate(${heading}deg);
          transition:transform 0.5s ease;
        "></div>

        <div style="
          position:absolute;inset:3px;border-radius:50%;
          background:linear-gradient(135deg, ${color}ee, ${color}aa);
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          box-shadow:0 2px 12px ${color}66, inset 0 1px 0 rgba(255,255,255,0.2);
          border:2px solid ${isSelected ? 'white' : color + '66'};
        ">
          <span style="font-size:${isSelected ? 13 : 11}px;font-weight:700;color:white;font-family:Inter,sans-serif;line-height:1">
            ${initials}
          </span>
          ${session.isTracking ? `
          <span style="font-size:7px;color:rgba(255,255,255,0.85);font-family:'JetBrains Mono',monospace;line-height:1;margin-top:1px">
            ${speed}km/h
          </span>` : ''}
        </div>

        ${!session.isOnline ? `
          <div style="
            position:absolute;inset:0;border-radius:50%;
            background:rgba(0,0,0,0.5);
            display:flex;align-items:center;justify-content:center;
          ">
            <div style="width:8px;height:8px;border-radius:50%;background:#64748b"></div>
          </div>
        ` : ''}

        ${heading && session.isTracking ? `
          <div style="
            position:absolute;top:-6px;left:50%;transform:translateX(-50%) rotate(${heading}deg);
            width:0;height:0;
            border-left:4px solid transparent;
            border-right:4px solid transparent;
            border-bottom:8px solid ${color};
            filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5));
          "></div>
        ` : ''}
      </div>
    `,
  });
}

interface AnimatedMarkerProps {
  session: DriverSession;
  index: number;
  isSelected: boolean;
  onClick: (id: string) => void;
}

function AnimatedMarker({ session, index, isSelected, onClick }: AnimatedMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);
  const prevPositionRef = useRef<[number, number] | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const animateTo = useCallback((from: [number, number], to: [number, number]) => {
    if (!markerRef.current) return;
    const start = performance.now();
    const duration = 2000;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeOutCubic(progress);
      const lat = from[0] + (to[0] - from[0]) * eased;
      const lng = from[1] + (to[1] - from[1]) * eased;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        const icon = createDriverIcon(session, index, isSelected);
        markerRef.current.setIcon(icon);
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        prevPositionRef.current = to;
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(step);
  }, [session, index, isSelected]);

  useEffect(() => {
    if (!session.location || !markerRef.current) return;
    const newPos: [number, number] = [session.location.lat, session.location.lng];

    if (prevPositionRef.current) {
      animateTo(prevPositionRef.current, newPos);
    } else {
      prevPositionRef.current = newPos;
      markerRef.current.setLatLng(newPos);
    }

    const newIcon = createDriverIcon(session, index, isSelected);
    markerRef.current.setIcon(newIcon);
  }, [session.location?.lat, session.location?.lng, session.location?.heading, session.isTracking, isSelected, animateTo, session, index]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (!session.location) return null;

  return (
    <Marker
      ref={markerRef}
      position={[session.location.lat, session.location.lng]}
      icon={createDriverIcon(session, index, isSelected)}
      eventHandlers={{ click: () => onClick(session.driverId) }}
      zIndexOffset={isSelected ? 1000 : 0}
    >
      <Popup>
        <div style={{ minWidth: 180, fontFamily: 'Inter, sans-serif' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 6 }}>
            {session.driverName}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{session.vehicleNumber}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Speed: <b>{formatSpeed(session.location.speed)} km/h</b></span>
            <span>Accuracy: <b>±{Math.round(session.location.accuracy)}m</b></span>
            <span>Battery: <b>{session.battery ?? '—'}%</b></span>
            <span>Last seen: <b>{formatTimeAgo(session.lastSeen)}</b></span>
            {session.address && <span style={{ fontSize: 11, color: '#64748b' }}>{session.address}</span>}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function FitBoundsControl({ sessions }: { sessions: DriverSession[] }) {
  const map = useMap();

  const fitBounds = useCallback(() => {
    const withLocation = sessions.filter((s) => s.location && s.isOnline);
    if (withLocation.length === 0) return;

    if (withLocation.length === 1 && withLocation[0]?.location) {
      map.setView([withLocation[0].location.lat, withLocation[0].location.lng], 15, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(
      withLocation.map((s) => [s.location!.lat, s.location!.lng] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [50, 50], animate: true, maxZoom: 16 });
  }, [map, sessions]);

  useEffect(() => {
    const withLocation = sessions.filter((s) => s.location && s.isOnline);
    if (withLocation.length > 0) fitBounds();
  }, []);

  return null;
}

interface MapContainerProps {
  sessions: DriverSession[];
  selectedDriverId: string | null;
  onDriverSelect: (id: string | null) => void;
}

export function FleetMapContainer({ sessions, selectedDriverId, onDriverSelect }: MapContainerProps) {
  const [tileLayer, setTileLayer] = useState<keyof typeof TILE_LAYERS>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayerPicker, setShowLayerPicker] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sessionsWithLocation = sessions.filter((s) => s.location && s.isOnline);
  const sessionIndex = new Map(sessions.map((s, i) => [s.driverId, i]));

  const fitAll = useCallback(() => {
    if (!mapRef.current || sessionsWithLocation.length === 0) return;
    if (sessionsWithLocation.length === 1 && sessionsWithLocation[0]?.location) {
      mapRef.current.setView(
        [sessionsWithLocation[0].location.lat, sessionsWithLocation[0].location.lng], 15, { animate: true }
      );
      return;
    }
    const bounds = L.latLngBounds(
      sessionsWithLocation.map((s) => [s.location!.lat, s.location!.lng] as [number, number]),
    );
    mapRef.current.fitBounds(bounds, { padding: [60, 60], animate: true, maxZoom: 16 });
  }, [sessionsWithLocation]);

  const focusDriver = useCallback((driverId: string) => {
    const session = sessions.find((s) => s.driverId === driverId);
    if (session?.location && mapRef.current) {
      mapRef.current.setView([session.location.lat, session.location.lng], 15, { animate: true });
    }
  }, [sessions]);

  useEffect(() => {
    if (selectedDriverId) focusDriver(selectedDriverId);
  }, [selectedDriverId, focusDriver]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      void el.requestFullscreen();
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const currentLayer = TILE_LAYERS[tileLayer];

  return (
    <div ref={containerRef} className="relative w-full h-full map-container rounded-2xl overflow-hidden">
      <LeafletMapContainer
        ref={mapRef}
        center={[17.385, 78.4867]}
        zoom={11}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url={currentLayer!.url}
          attribution={currentLayer!.attribution}
          maxZoom={19}
          subdomains={['a', 'b', 'c']}
        />

        {sessions.map((session) => (
          <AnimatedMarker
            key={session.driverId}
            session={session}
            index={sessionIndex.get(session.driverId) ?? 0}
            isSelected={session.driverId === selectedDriverId}
            onClick={(id) => onDriverSelect(id === selectedDriverId ? null : id)}
          />
        ))}

        {/* Polyline trail for selected driver */}
        {selectedDriverId && (() => {
          const sel = sessions.find((s) => s.driverId === selectedDriverId);
          if (sel?.location && sel.previousLocation) {
            return (
              <Polyline
                positions={[
                  [sel.previousLocation.lat, sel.previousLocation.lng],
                  [sel.location.lat, sel.location.lng],
                ]}
                color={getDriverColor(sessionIndex.get(selectedDriverId) ?? 0)}
                weight={3}
                opacity={0.6}
                dashArray="6 4"
              />
            );
          }
          return null;
        })()}

        <FitBoundsControl sessions={sessions} />
      </LeafletMapContainer>

      {/* Map controls overlay */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-[1000]">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleFullscreen}
          className="w-9 h-9 glass rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/12 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={fitAll}
          className="w-9 h-9 glass rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/12 transition-colors"
          title="Fit all vehicles"
        >
          <Users size={14} />
        </motion.button>

        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLayerPicker((s) => !s)}
            className="w-9 h-9 glass rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/12 transition-colors"
            title="Map layers"
          >
            <Layers size={14} />
          </motion.button>

          {showLayerPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              className="absolute right-11 top-0 glass rounded-xl p-1.5 min-w-[120px] z-10"
            >
              {Object.entries(TILE_LAYERS).map(([key, layer]) => (
                <button
                  key={key}
                  onClick={() => { setTileLayer(key as keyof typeof TILE_LAYERS); setShowLayerPicker(false); }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-xs transition-colors',
                    tileLayer === key
                      ? 'bg-brand-500/20 text-brand-400'
                      : 'text-slate-400 hover:bg-white/8 hover:text-white',
                  )}
                >
                  {layer.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Online vehicles badge */}
      <div className="absolute top-3 left-3 z-[1000]">
        <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-xl">
          <Navigation size={12} className="text-brand-400" />
          <span className="text-xs font-medium text-white">{sessionsWithLocation.length}</span>
          <span className="text-xs text-slate-500">on map</span>
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-2 right-2 z-[1000]">
        <span
          className="text-[10px] text-slate-600"
          dangerouslySetInnerHTML={{ __html: currentLayer!.attribution }}
        />
      </div>
    </div>
  );
}
