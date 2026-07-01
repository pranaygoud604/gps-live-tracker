export interface Driver {
  id: string;
  name: string;
  vehicleNumber: string;
  phone: string;
  password: string;
}

export interface Admin {
  id: string;
  name: string;
  username: string;
  password: string;
}

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

export interface JWTPayload {
  sub: string;
  name: string;
  role: 'driver' | 'admin';
  vehicleNumber?: string;
  phone?: string;
  iat?: number;
  exp?: number;
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

export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    role: 'driver' | 'admin';
    vehicleNumber?: string;
    phone?: string;
  };
}

export interface SocketAuthPayload {
  token: string;
}

export interface HeartbeatPayload {
  timestamp: number;
  battery?: number | null;
  network?: string | null;
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
