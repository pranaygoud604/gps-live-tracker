import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { logger } from '../config/logger';
import { Driver, JWTPayload, LoginResponse } from '../types';

interface DriverRecord extends Driver {
  passwordHash: string;
}

function signToken(payload: JWTPayload): string {
  const opts: SignOptions = { expiresIn: 86400 }; // 24 hours in seconds
  return jwt.sign(payload as object, config.jwt.secret, opts);
}

class AuthService {
  private drivers: Map<string, DriverRecord> = new Map();
  private adminHash = '';
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const filePath = path.join(__dirname, '../../data/drivers.json');
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw) as { drivers: Driver[] };

      await Promise.all(
        data.drivers.map(async (driver) => {
          const passwordHash = await bcrypt.hash(driver.password, 12);
          this.drivers.set(driver.vehicleNumber.toUpperCase(), {
            ...driver,
            passwordHash,
          });
        }),
      );

      this.adminHash = await bcrypt.hash(config.admin.password, 12);
      this.initialized = true;

      logger.info(`AuthService initialized with ${this.drivers.size} drivers`);
    } catch (err) {
      logger.error('Failed to initialize AuthService', { error: err });
      throw err;
    }
  }

  async loginDriver(vehicleNumber: string, password: string): Promise<LoginResponse | null> {
    const record = this.drivers.get(vehicleNumber.toUpperCase());
    if (!record) return null;

    const valid = await bcrypt.compare(password, record.passwordHash);
    if (!valid) return null;

    const payload: JWTPayload = {
      sub: record.id,
      name: record.name,
      role: 'driver',
      vehicleNumber: record.vehicleNumber,
      phone: record.phone,
    };

    return {
      token: signToken(payload),
      user: {
        id: record.id,
        name: record.name,
        role: 'driver',
        vehicleNumber: record.vehicleNumber,
        phone: record.phone,
      },
    };
  }

  async loginAdmin(username: string, password: string): Promise<LoginResponse | null> {
    if (username !== config.admin.username) return null;

    const valid = await bcrypt.compare(password, this.adminHash);
    if (!valid) return null;

    const payload: JWTPayload = {
      sub: config.admin.id,
      name: config.admin.name,
      role: 'admin',
    };

    return {
      token: signToken(payload),
      user: {
        id: config.admin.id,
        name: config.admin.name,
        role: 'admin',
      },
    };
  }

  getAllDrivers(): Omit<DriverRecord, 'password' | 'passwordHash'>[] {
    return Array.from(this.drivers.values()).map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ password: _p, passwordHash: _h, ...rest }) => rest,
    );
  }
}

export const authService = new AuthService();
