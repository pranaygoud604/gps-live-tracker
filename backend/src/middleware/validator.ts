import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ApiResponse } from '../types';

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      const response: ApiResponse = {
        success: false,
        message: `Validation error: ${errors.join(', ')}`,
      };
      res.status(400).json(response);
      return;
    }
    req.body = result.data;
    next();
  };
}

export const loginSchema = z.object({
  vehicleNumber: z.string().trim().optional(),
  username: z.string().trim().optional(),
  password: z.string().min(1, 'Password is required'),
}).refine(
  (data) => data.vehicleNumber ?? data.username,
  { message: 'vehicleNumber or username is required' },
);

export const locationSchema = z.object({
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
