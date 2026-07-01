import { Request, Response } from 'express';
import { driverService } from '../services/driverService';
import { authService } from '../services/authService';

export function getDrivers(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: 'Driver sessions retrieved',
    data: { sessions: driverService.getAllSessions(), stats: driverService.getStats() },
  });
}

export function getOnlineDrivers(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: 'Online drivers retrieved',
    data: driverService.getOnlineSessions(),
  });
}

export function getStats(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: 'Fleet stats retrieved',
    data: driverService.getStats(),
  });
}

export function getDriverList(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: 'Driver list retrieved',
    data: authService.getAllDrivers(),
  });
}

export async function createDriver(req: Request, res: Response): Promise<void> {
  const { name, vehicleNumber, phone, password } = req.body as Record<string, string>;
  if (!name || !vehicleNumber || !phone || !password) {
    res.status(400).json({ success: false, message: 'name, vehicleNumber, phone and password are required' });
    return;
  }
  try {
    const driver = await authService.createDriver({ name, vehicleNumber, phone, password });
    res.status(201).json({ success: true, message: 'Driver created', data: driver });
  } catch (err) {
    res.status(409).json({ success: false, message: (err as Error).message });
  }
}

export async function updateDriver(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const { name, phone, password } = req.body as Record<string, string>;
  const driver = await authService.updateDriver(id, { name, phone, password });
  if (!driver) {
    res.status(404).json({ success: false, message: 'Driver not found' });
    return;
  }
  res.status(200).json({ success: true, message: 'Driver updated', data: driver });
}

export function deleteDriver(req: Request, res: Response): void {
  const { id } = req.params as { id: string };
  const ok = authService.deleteDriver(id);
  if (!ok) {
    res.status(404).json({ success: false, message: 'Driver not found' });
    return;
  }
  res.status(200).json({ success: true, message: 'Driver deleted' });
}
