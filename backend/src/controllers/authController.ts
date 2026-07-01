import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { logger } from '../config/logger';
import { ApiResponse, LoginResponse } from '../types';
import { AppError } from '../middleware/errorHandler';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { vehicleNumber, username, password } = req.body as {
      vehicleNumber?: string;
      username?: string;
      password: string;
    };

    let result: LoginResponse | null = null;

    if (vehicleNumber) {
      result = await authService.loginDriver(vehicleNumber, password);
    } else if (username) {
      result = await authService.loginAdmin(username, password);
    }

    if (!result) {
      logger.warn(`Failed login attempt: ${vehicleNumber ?? username}`);
      throw new AppError(401, 'Invalid credentials');
    }

    logger.info(`Successful login: ${result.user.name} (${result.user.role})`);

    const response: ApiResponse<LoginResponse> = {
      success: true,
      message: 'Login successful',
      data: result,
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  const response: ApiResponse = { success: true, message: 'Logged out successfully' };
  res.status(200).json(response);
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = (req as any).user;
  const response: ApiResponse = {
    success: true,
    message: 'User info',
    data: user,
  };
  res.status(200).json(response);
}
