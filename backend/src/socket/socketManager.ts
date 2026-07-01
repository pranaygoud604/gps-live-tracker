import { Server, Socket } from 'socket.io';
import { verifySocketToken } from '../middleware/auth';
import { driverService } from '../services/driverService';
import { logger } from '../config/logger';
import { LocationUpdatePayload, HeartbeatPayload, ActivityEvent } from '../types';
import { generateId, formatTimestamp } from '../utils/helpers';
import { z } from 'zod';

const ADMINS_ROOM = 'admins';
const MAX_ACTIVITY_EVENTS = 100;
const activityLog: ActivityEvent[] = [];

function pushActivity(event: ActivityEvent): void {
  activityLog.unshift(event);
  if (activityLog.length > MAX_ACTIVITY_EVENTS) activityLog.pop();
}

const locationPayloadSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().positive().max(10000),
  speed: z.number().min(0).max(500).nullable(),
  heading: z.number().min(0).max(360).nullable(),
  altitude: z.number().nullable(),
  timestamp: z.number().positive(),
  battery: z.number().min(0).max(100).nullable().optional(),
  network: z.string().max(20).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
});

function handleDriverSocket(socket: Socket, io: Server): void {
  const token = (socket.handshake.auth as { token?: string }).token ?? '';
  const payload = verifySocketToken(token);

  if (!payload || payload.role !== 'driver') {
    logger.warn(`Rejected driver socket: invalid token (${socket.id})`);
    socket.emit('auth_error', { message: 'Invalid or expired token' });
    socket.disconnect(true);
    return;
  }

  const session = driverService.createSession(
    payload.sub,
    payload.name,
    payload.vehicleNumber ?? '',
    payload.phone ?? '',
    socket.id,
  );

  const activity: ActivityEvent = {
    id: generateId(),
    type: 'connected',
    driverId: payload.sub,
    driverName: payload.name,
    vehicleNumber: payload.vehicleNumber ?? '',
    timestamp: formatTimestamp(),
    message: `${payload.name} connected`,
  };
  pushActivity(activity);
  io.to(ADMINS_ROOM).emit('driver_connected', { session, activity });
  io.to(ADMINS_ROOM).emit('stats_update', driverService.getStats());

  logger.info(`Driver connected: ${payload.name} [${payload.vehicleNumber}] (${socket.id})`);

  socket.on('start_tracking', () => {
    const updated = driverService.setTracking(socket.id, true);
    if (!updated) return;

    const act: ActivityEvent = {
      id: generateId(),
      type: 'tracking_started',
      driverId: payload.sub,
      driverName: payload.name,
      vehicleNumber: payload.vehicleNumber ?? '',
      timestamp: formatTimestamp(),
      message: `${payload.name} started tracking`,
    };
    pushActivity(act);
    io.to(ADMINS_ROOM).emit('tracking_started', { session: updated, activity: act });
    socket.emit('tracking_ack', { success: true, isTracking: true });
    logger.debug(`Tracking started: ${payload.name}`);
  });

  socket.on('stop_tracking', () => {
    const updated = driverService.setTracking(socket.id, false);
    if (!updated) return;

    const act: ActivityEvent = {
      id: generateId(),
      type: 'tracking_stopped',
      driverId: payload.sub,
      driverName: payload.name,
      vehicleNumber: payload.vehicleNumber ?? '',
      timestamp: formatTimestamp(),
      message: `${payload.name} stopped tracking`,
    };
    pushActivity(act);
    io.to(ADMINS_ROOM).emit('tracking_stopped', { session: updated, activity: act });
    socket.emit('tracking_ack', { success: true, isTracking: false });
    logger.debug(`Tracking stopped: ${payload.name}`);
  });

  socket.on('location_update', (data: unknown) => {
    const result = locationPayloadSchema.safeParse(data);
    if (!result.success) {
      logger.warn(`Invalid location data from ${payload.name}: ${result.error.message}`);
      return;
    }

    const updated = driverService.updateLocation(socket.id, result.data as LocationUpdatePayload);
    if (!updated) return;

    io.to(ADMINS_ROOM).emit('location_update', {
      driverId: payload.sub,
      vehicleNumber: payload.vehicleNumber,
      driverName: payload.name,
      location: updated.location,
      battery: updated.battery,
      network: updated.network,
      address: updated.address,
      isTracking: updated.isTracking,
      timestamp: formatTimestamp(),
    });
  });

  socket.on('heartbeat', (data: unknown) => {
    const hb = (data ?? {}) as HeartbeatPayload;
    const updated = driverService.updateHeartbeat(socket.id, hb.battery, hb.network);
    socket.emit('heartbeat_ack', { timestamp: Date.now(), serverTime: formatTimestamp() });

    if (updated) {
      io.to(ADMINS_ROOM).emit('driver_heartbeat', {
        driverId: payload.sub,
        battery: updated.battery,
        network: updated.network,
        lastSeen: updated.lastSeen,
      });
    }
  });

  socket.on('emergency', (data: unknown) => {
    const session = driverService.getSessionBySocketId(socket.id);
    if (!session) return;

    const act: ActivityEvent = {
      id: generateId(),
      type: 'emergency',
      driverId: payload.sub,
      driverName: payload.name,
      vehicleNumber: payload.vehicleNumber ?? '',
      timestamp: formatTimestamp(),
      message: `🚨 EMERGENCY: ${payload.name} needs help!`,
      location: session.location,
    };
    pushActivity(act);
    io.to(ADMINS_ROOM).emit('emergency', { session, activity: act, data });
    logger.warn(`EMERGENCY from ${payload.name} [${payload.vehicleNumber}]`);
  });

  socket.on('disconnect', (reason) => {
    const disconnected = driverService.disconnectDriver(socket.id);
    if (!disconnected) return;

    const act: ActivityEvent = {
      id: generateId(),
      type: 'disconnected',
      driverId: payload.sub,
      driverName: payload.name,
      vehicleNumber: payload.vehicleNumber ?? '',
      timestamp: formatTimestamp(),
      message: `${payload.name} disconnected (${reason})`,
    };
    pushActivity(act);
    io.to(ADMINS_ROOM).emit('driver_disconnected', { session: disconnected, activity: act });
    io.to(ADMINS_ROOM).emit('stats_update', driverService.getStats());
    logger.info(`Driver disconnected: ${payload.name} (${reason})`);
  });
}

function handleAdminSocket(socket: Socket): void {
  const token = (socket.handshake.auth as { token?: string }).token ?? '';
  const payload = verifySocketToken(token);

  if (!payload || payload.role !== 'admin') {
    logger.warn(`Rejected admin socket: invalid token (${socket.id})`);
    socket.emit('auth_error', { message: 'Invalid or expired token' });
    socket.disconnect(true);
    return;
  }

  void socket.join(ADMINS_ROOM);

  socket.emit('driver_list', {
    sessions: driverService.getAllSessions(),
    stats: driverService.getStats(),
    activityLog: activityLog.slice(0, 50),
  });

  logger.info(`Admin connected: ${payload.name} (${socket.id})`);

  socket.on('disconnect', () => {
    logger.info(`Admin disconnected: ${payload.name}`);
  });

  socket.on('request_driver_list', () => {
    socket.emit('driver_list', {
      sessions: driverService.getAllSessions(),
      stats: driverService.getStats(),
      activityLog: activityLog.slice(0, 50),
    });
  });
}

export function setupSocketManager(io: Server): void {
  io.on('connection', (socket: Socket) => {
    const role = (socket.handshake.auth as { role?: string }).role;

    if (role === 'driver') {
      handleDriverSocket(socket, io);
    } else if (role === 'admin') {
      handleAdminSocket(socket);
    } else {
      logger.warn(`Unknown role connection attempt: ${role} (${socket.id})`);
      socket.disconnect(true);
    }
  });

  logger.info('Socket.IO manager initialized');
}
