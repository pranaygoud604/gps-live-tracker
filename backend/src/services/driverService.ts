import { DriverSession, Location, LocationUpdatePayload } from '../types';
import { formatTimestamp, isValidCoordinate, isValidAccuracy } from '../utils/helpers';
import { logger } from '../config/logger';

class DriverService {
  private sessions: Map<string, DriverSession> = new Map();
  private socketToDriver: Map<string, string> = new Map();

  createSession(
    driverId: string,
    driverName: string,
    vehicleNumber: string,
    phone: string,
    socketId: string,
  ): DriverSession {
    const existing = this.sessions.get(driverId);

    const session: DriverSession = {
      driverId,
      driverName,
      vehicleNumber,
      phone,
      socketId,
      location: existing?.location ?? null,
      previousLocation: existing?.previousLocation ?? null,
      isTracking: false,
      isOnline: true,
      battery: null,
      network: null,
      address: null,
      connectedAt: formatTimestamp(),
      lastSeen: formatTimestamp(),
      lastLocationUpdate: existing?.lastLocationUpdate ?? null,
    };

    this.sessions.set(driverId, session);
    this.socketToDriver.set(socketId, driverId);

    logger.debug(`Driver session created: ${driverName} (${vehicleNumber})`);
    return session;
  }

  disconnectDriver(socketId: string): DriverSession | null {
    const driverId = this.socketToDriver.get(socketId);
    if (!driverId) return null;

    const session = this.sessions.get(driverId);
    if (!session) return null;

    session.isOnline = false;
    session.isTracking = false;
    session.lastSeen = formatTimestamp();

    this.socketToDriver.delete(socketId);
    this.sessions.set(driverId, session);

    logger.debug(`Driver disconnected: ${session.driverName} (${session.vehicleNumber})`);
    return session;
  }

  updateLocation(socketId: string, payload: LocationUpdatePayload): DriverSession | null {
    const driverId = this.socketToDriver.get(socketId);
    if (!driverId) return null;

    const session = this.sessions.get(driverId);
    if (!session) return null;

    if (!isValidCoordinate(payload.lat, payload.lng)) {
      logger.warn(`Invalid coordinates from ${session.vehicleNumber}: ${payload.lat}, ${payload.lng}`);
      return null;
    }

    if (!isValidAccuracy(payload.accuracy)) {
      logger.warn(`Invalid accuracy from ${session.vehicleNumber}: ${payload.accuracy}`);
      return null;
    }

    const location: Location = {
      lat: payload.lat,
      lng: payload.lng,
      accuracy: payload.accuracy,
      speed: payload.speed,
      heading: payload.heading,
      altitude: payload.altitude,
      timestamp: payload.timestamp,
    };

    session.previousLocation = session.location;
    session.location = location;
    session.lastLocationUpdate = formatTimestamp();
    session.lastSeen = formatTimestamp();

    if (payload.battery !== undefined) session.battery = payload.battery ?? null;
    if (payload.network !== undefined) session.network = payload.network ?? null;
    if (payload.address !== undefined) session.address = payload.address ?? null;

    this.sessions.set(driverId, session);
    return session;
  }

  setTracking(socketId: string, isTracking: boolean): DriverSession | null {
    const driverId = this.socketToDriver.get(socketId);
    if (!driverId) return null;

    const session = this.sessions.get(driverId);
    if (!session) return null;

    session.isTracking = isTracking;
    session.lastSeen = formatTimestamp();
    this.sessions.set(driverId, session);
    return session;
  }

  updateHeartbeat(socketId: string, battery?: number | null, network?: string | null): DriverSession | null {
    const driverId = this.socketToDriver.get(socketId);
    if (!driverId) return null;

    const session = this.sessions.get(driverId);
    if (!session) return null;

    session.lastSeen = formatTimestamp();
    if (battery !== undefined) session.battery = battery;
    if (network !== undefined) session.network = network;
    this.sessions.set(driverId, session);
    return session;
  }

  getSessionBySocketId(socketId: string): DriverSession | null {
    const driverId = this.socketToDriver.get(socketId);
    return driverId ? (this.sessions.get(driverId) ?? null) : null;
  }

  getSession(driverId: string): DriverSession | null {
    return this.sessions.get(driverId) ?? null;
  }

  getAllSessions(): DriverSession[] {
    return Array.from(this.sessions.values());
  }

  getOnlineSessions(): DriverSession[] {
    return this.getAllSessions().filter((s) => s.isOnline);
  }

  getStats() {
    const all = this.getAllSessions();
    const online = all.filter((s) => s.isOnline);
    const tracking = online.filter((s) => s.isTracking);
    const speeds = tracking
      .map((s) => s.location?.speed ?? 0)
      .filter((sp) => sp > 0);
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

    return {
      total: all.length,
      online: online.length,
      offline: all.length - online.length,
      tracking: tracking.length,
      avgSpeedKmh: Math.round(avgSpeed * 3.6),
    };
  }
}

export const driverService = new DriverService();
