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
