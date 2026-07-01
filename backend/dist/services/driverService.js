"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.driverService = void 0;
const helpers_1 = require("../utils/helpers");
const logger_1 = require("../config/logger");
class DriverService {
    constructor() {
        this.sessions = new Map();
        this.socketToDriver = new Map();
    }
    createSession(driverId, driverName, vehicleNumber, phone, socketId) {
        const existing = this.sessions.get(driverId);
        const session = {
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
            connectedAt: (0, helpers_1.formatTimestamp)(),
            lastSeen: (0, helpers_1.formatTimestamp)(),
            lastLocationUpdate: existing?.lastLocationUpdate ?? null,
        };
        this.sessions.set(driverId, session);
        this.socketToDriver.set(socketId, driverId);
        logger_1.logger.debug(`Driver session created: ${driverName} (${vehicleNumber})`);
        return session;
    }
    disconnectDriver(socketId) {
        const driverId = this.socketToDriver.get(socketId);
        if (!driverId)
            return null;
        const session = this.sessions.get(driverId);
        if (!session)
            return null;
        session.isOnline = false;
        session.isTracking = false;
        session.lastSeen = (0, helpers_1.formatTimestamp)();
        this.socketToDriver.delete(socketId);
        this.sessions.set(driverId, session);
        logger_1.logger.debug(`Driver disconnected: ${session.driverName} (${session.vehicleNumber})`);
        return session;
    }
    updateLocation(socketId, payload) {
        const driverId = this.socketToDriver.get(socketId);
        if (!driverId)
            return null;
        const session = this.sessions.get(driverId);
        if (!session)
            return null;
        if (!(0, helpers_1.isValidCoordinate)(payload.lat, payload.lng)) {
            logger_1.logger.warn(`Invalid coordinates from ${session.vehicleNumber}: ${payload.lat}, ${payload.lng}`);
            return null;
        }
        if (!(0, helpers_1.isValidAccuracy)(payload.accuracy)) {
            logger_1.logger.warn(`Invalid accuracy from ${session.vehicleNumber}: ${payload.accuracy}`);
            return null;
        }
        const location = {
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
        session.lastLocationUpdate = (0, helpers_1.formatTimestamp)();
        session.lastSeen = (0, helpers_1.formatTimestamp)();
        if (payload.battery !== undefined)
            session.battery = payload.battery ?? null;
        if (payload.network !== undefined)
            session.network = payload.network ?? null;
        if (payload.address !== undefined)
            session.address = payload.address ?? null;
        this.sessions.set(driverId, session);
        return session;
    }
    setTracking(socketId, isTracking) {
        const driverId = this.socketToDriver.get(socketId);
        if (!driverId)
            return null;
        const session = this.sessions.get(driverId);
        if (!session)
            return null;
        session.isTracking = isTracking;
        session.lastSeen = (0, helpers_1.formatTimestamp)();
        this.sessions.set(driverId, session);
        return session;
    }
    updateHeartbeat(socketId, battery, network) {
        const driverId = this.socketToDriver.get(socketId);
        if (!driverId)
            return null;
        const session = this.sessions.get(driverId);
        if (!session)
            return null;
        session.lastSeen = (0, helpers_1.formatTimestamp)();
        if (battery !== undefined)
            session.battery = battery;
        if (network !== undefined)
            session.network = network;
        this.sessions.set(driverId, session);
        return session;
    }
    getSessionBySocketId(socketId) {
        const driverId = this.socketToDriver.get(socketId);
        return driverId ? (this.sessions.get(driverId) ?? null) : null;
    }
    getSession(driverId) {
        return this.sessions.get(driverId) ?? null;
    }
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    getOnlineSessions() {
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
exports.driverService = new DriverService();
//# sourceMappingURL=driverService.js.map