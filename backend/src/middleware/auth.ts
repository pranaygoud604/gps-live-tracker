import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JWTPayload, ApiResponse } from '../types';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    const response: ApiResponse = { success: false, message: 'Authorization token required' };
    res.status(401).json(response);
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwt.secret) as JWTPayload;
    req.user = payload;
    next();
  } catch (err) {
    const message = err instanceof jwt.TokenExpiredError ? 'Token expired' : 'Invalid token';
    const response: ApiResponse = { success: false, message };
    res.status(401).json(response);
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    const response: ApiResponse = { success: false, message: 'Admin access required' };
    res.status(403).json(response);
    return;
  }
  next();
}

export function requireDriver(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'driver') {
    const response: ApiResponse = { success: false, message: 'Driver access required' };
    res.status(403).json(response);
    return;
  }
  next();
}

export function verifySocketToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch {
    return null;
  }
}
