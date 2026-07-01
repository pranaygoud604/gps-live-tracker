"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketManager = setupSocketManager;
const auth_1 = require("../middleware/auth");
const driverService_1 = require("../services/driverService");
const logger_1 = require("../config/logger");
const helpers_1 = require("../utils/helpers");
const zod_1 = require("zod");
const ADMINS_ROOM = 'admins';
const MAX_ACTIVITY_EVENTS = 100;
const activityLog = [];
function pushActivity(event) {
    activityLog.unshift(event);
    if (activityLog.length > MAX_ACTIVITY_EVENTS)
        activityLog.pop();
}
const locationPayloadSchema = zod_1.z.object({
    lat: zod_1.z.number().min(-90).max(90),
    lng: zod_1.z.number().min(-180).max(180),
    accuracy: zod_1.z.number().positive().max(10000),
    speed: zod_1.z.number().min(0).max(500).nullable(),
    heading: zod_1.z.number().min(0).max(360).nullable(),
    altitude: zod_1.z.number().nullable(),
    timestamp: zod_1.z.number().positive(),
    battery: zod_1.z.number().min(0).max(100).nullable().optional(),
    network: zod_1.z.string().max(20).nullable().optional(),
    address: zod_1.z.string().max(500).nullable().optional(),
});
function handleDriverSocket(socket, io) {
    const token = socket.handshake.auth.token ?? '';
    const payload = (0, auth_1.verifySocketToken)(token);
    if (!payload || payload.role !== 'driver') {
        logger_1.logger.warn(`Rejected driver socket: invalid token (${socket.id})`);
        socket.emit('auth_error', { message: 'Invalid or expired token' });
        socket.disconnect(true);
        return;
    }
    const session = driverService_1.driverService.createSession(payload.sub, payload.name, payload.vehicleNumber ?? '', payload.phone ?? '', socket.id);
    const activity = {
        id: (0, helpers_1.generateId)(),
        type: 'connected',
        driverId: payload.sub,
        driverName: payload.name,
        vehicleNumber: payload.vehicleNumber ?? '',
        timestamp: (0, helpers_1.formatTimestamp)(),
        message: `${payload.name} connected`,
    };
    pushActivity(activity);
    io.to(ADMINS_ROOM).emit('driver_connected', { session, activity });
    io.to(ADMINS_ROOM).emit('stats_update', driverService_1.driverService.getStats());
    logger_1.logger.info(`Driver connected: ${payload.name} [${payload.vehicleNumber}] (${socket.id})`);
    socket.on('start_tracking', () => {
        const updated = driverService_1.driverService.setTracking(socket.id, true);
        if (!updated)
            return;
        const act = {
            id: (0, helpers_1.generateId)(),
            type: 'tracking_started',
            driverId: payload.sub,
            driverName: payload.name,
            vehicleNumber: payload.vehicleNumber ?? '',
            timestamp: (0, helpers_1.formatTimestamp)(),
            message: `${payload.name} started tracking`,
        };
        pushActivity(act);
        io.to(ADMINS_ROOM).emit('tracking_started', { session: updated, activity: act });
        socket.emit('tracking_ack', { success: true, isTracking: true });
        logger_1.logger.debug(`Tracking started: ${payload.name}`);
    });
    socket.on('stop_tracking', () => {
        const updated = driverService_1.driverService.setTracking(socket.id, false);
        if (!updated)
            return;
        const act = {
            id: (0, helpers_1.generateId)(),
            type: 'tracking_stopped',
            driverId: payload.sub,
            driverName: payload.name,
            vehicleNumber: payload.vehicleNumber ?? '',
            timestamp: (0, helpers_1.formatTimestamp)(),
            message: `${payload.name} stopped tracking`,
        };
        pushActivity(act);
        io.to(ADMINS_ROOM).emit('tracking_stopped', { session: updated, activity: act });
        socket.emit('tracking_ack', { success: true, isTracking: false });
        logger_1.logger.debug(`Tracking stopped: ${payload.name}`);
    });
    socket.on('location_update', (data) => {
        const result = locationPayloadSchema.safeParse(data);
        if (!result.success) {
            logger_1.logger.warn(`Invalid location data from ${payload.name}: ${result.error.message}`);
            return;
        }
        const updated = driverService_1.driverService.updateLocation(socket.id, result.data);
        if (!updated)
            return;
        io.to(ADMINS_ROOM).emit('location_update', {
            driverId: payload.sub,
            vehicleNumber: payload.vehicleNumber,
            driverName: payload.name,
            location: updated.location,
            battery: updated.battery,
            network: updated.network,
            address: updated.address,
            isTracking: updated.isTracking,
            timestamp: (0, helpers_1.formatTimestamp)(),
        });
    });
    socket.on('heartbeat', (data) => {
        const hb = (data ?? {});
        const updated = driverService_1.driverService.updateHeartbeat(socket.id, hb.battery, hb.network);
        socket.emit('heartbeat_ack', { timestamp: Date.now(), serverTime: (0, helpers_1.formatTimestamp)() });
        if (updated) {
            io.to(ADMINS_ROOM).emit('driver_heartbeat', {
                driverId: payload.sub,
                battery: updated.battery,
                network: updated.network,
                lastSeen: updated.lastSeen,
            });
        }
    });
    socket.on('emergency', (data) => {
        const session = driverService_1.driverService.getSessionBySocketId(socket.id);
        if (!session)
            return;
        const act = {
            id: (0, helpers_1.generateId)(),
            type: 'emergency',
            driverId: payload.sub,
            driverName: payload.name,
            vehicleNumber: payload.vehicleNumber ?? '',
            timestamp: (0, helpers_1.formatTimestamp)(),
            message: `🚨 EMERGENCY: ${payload.name} needs help!`,
            location: session.location,
        };
        pushActivity(act);
        io.to(ADMINS_ROOM).emit('emergency', { session, activity: act, data });
        logger_1.logger.warn(`EMERGENCY from ${payload.name} [${payload.vehicleNumber}]`);
    });
    socket.on('disconnect', (reason) => {
        const disconnected = driverService_1.driverService.disconnectDriver(socket.id);
        if (!disconnected)
            return;
        const act = {
            id: (0, helpers_1.generateId)(),
            type: 'disconnected',
            driverId: payload.sub,
            driverName: payload.name,
            vehicleNumber: payload.vehicleNumber ?? '',
            timestamp: (0, helpers_1.formatTimestamp)(),
            message: `${payload.name} disconnected (${reason})`,
        };
        pushActivity(act);
        io.to(ADMINS_ROOM).emit('driver_disconnected', { session: disconnected, activity: act });
        io.to(ADMINS_ROOM).emit('stats_update', driverService_1.driverService.getStats());
        logger_1.logger.info(`Driver disconnected: ${payload.name} (${reason})`);
    });
}
function handleAdminSocket(socket) {
    const token = socket.handshake.auth.token ?? '';
    const payload = (0, auth_1.verifySocketToken)(token);
    if (!payload || payload.role !== 'admin') {
        logger_1.logger.warn(`Rejected admin socket: invalid token (${socket.id})`);
        socket.emit('auth_error', { message: 'Invalid or expired token' });
        socket.disconnect(true);
        return;
    }
    void socket.join(ADMINS_ROOM);
    socket.emit('driver_list', {
        sessions: driverService_1.driverService.getAllSessions(),
        stats: driverService_1.driverService.getStats(),
        activityLog: activityLog.slice(0, 50),
    });
    logger_1.logger.info(`Admin connected: ${payload.name} (${socket.id})`);
    socket.on('disconnect', () => {
        logger_1.logger.info(`Admin disconnected: ${payload.name}`);
    });
    socket.on('request_driver_list', () => {
        socket.emit('driver_list', {
            sessions: driverService_1.driverService.getAllSessions(),
            stats: driverService_1.driverService.getStats(),
            activityLog: activityLog.slice(0, 50),
        });
    });
}
function setupSocketManager(io) {
    io.on('connection', (socket) => {
        const role = socket.handshake.auth.role;
        if (role === 'driver') {
            handleDriverSocket(socket, io);
        }
        else if (role === 'admin') {
            handleAdminSocket(socket);
        }
        else {
            logger_1.logger.warn(`Unknown role connection attempt: ${role} (${socket.id})`);
            socket.disconnect(true);
        }
    });
    logger_1.logger.info('Socket.IO manager initialized');
}
//# sourceMappingURL=socketManager.js.map