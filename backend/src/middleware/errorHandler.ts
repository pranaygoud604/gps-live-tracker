import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { ApiResponse } from '../types';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const response: ApiResponse = { success: false, message: err.message };
    res.status(err.statusCode).json(response);
    return;
  }

  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const response: ApiResponse = {
    success: false,
    message: process.env['NODE_ENV'] === 'production' ? 'Internal server error' : err.message,
  };
  res.status(500).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse = { success: false, message: `Route not found: ${req.method} ${req.path}` };
  res.status(404).json(response);
}
