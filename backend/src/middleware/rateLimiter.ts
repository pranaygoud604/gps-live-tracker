import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { ApiResponse } from '../types';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const response: ApiResponse = {
      success: false,
      message: 'Too many requests, please try again later.',
    };
    res.status(429).json(response);
  },
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const response: ApiResponse = {
      success: false,
      message: 'Too many login attempts, please try again in 15 minutes.',
    };
    res.status(429).json(response);
  },
});
