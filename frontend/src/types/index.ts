export interface Location {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  timestamp: number;
}

export interface DriverSession {
  driverId: string;
  driverName: string;
  vehicleNumber: string;
  phone: string;
  socketId: string;
  location: Location | null;
  previousLocation: Location | null;
  isTracking: boolean;
  isOnline: boolean;
  battery: number | null;
  network: string | null;
  address: string | null;
  connectedAt: string;
  lastSeen: string;
  lastLocationUpdate: string | null;
}

export interface FleetStats {
  total: number;
  online: number;
  offline: number;
  tracking: number;
  avgSpeedKmh: number;
}

export interface ActivityEvent {
  id: string;
  type: 'connected' | 'disconnected' | 'tracking_started' | 'tracking_stopped' | 'emergency' | 'location';
  driverId: string;
  driverName: string;
  vehicleNumber: string;
  timestamp: string;
  message: string;
  location?: Location | null;
}

export interface AuthUser {
  id: string;
  name: string;
  role: 'driver' | 'admin';
  vehicleNumber?: string;
  phone?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export interface LocationUpdatePayload {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  timestamp: number;
  battery?: number | null;
  network?: string | null;
  address?: string | null;
}

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  timestamp: number | null;
  error: string | null;
  isSupported: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
}

export interface SocketStatus {
  isConnected: boolean;
  isConnecting: boolean;
  latency: number | null;
  transport: string | null;
  reconnectAttempts: number;
}

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'offline';

export type MapViewMode = 'roadmap' | 'satellite' | 'hybrid';

export interface RegisteredDriver {
  id: string;
  name: string;
  vehicleNumber: string;
  phone: string;
}
