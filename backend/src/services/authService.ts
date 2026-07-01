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

  async createDriver(data: { name: string; vehicleNumber: string; phone: string; password: string }): Promise<Omit<Driver, 'password'>> {
    const vehicleNumber = data.vehicleNumber.toUpperCase().trim();
    if (this.drivers.has(vehicleNumber)) throw new Error(`Vehicle ${vehicleNumber} already registered`);
    const id = `drv_${Date.now()}`;
    const passwordHash = await bcrypt.hash(data.password, 12);
    this.drivers.set(vehicleNumber, { id, name: data.name.trim(), vehicleNumber, phone: data.phone.trim(), password: data.password, passwordHash });
    return { id, name: data.name.trim(), vehicleNumber, phone: data.phone.trim() };
  }

  async updateDriver(id: string, data: { name?: string; phone?: string; password?: string }): Promise<Omit<Driver, 'password'> | null> {
    const entry = Array.from(this.drivers.values()).find((d) => d.id === id);
    if (!entry) return null;
    if (data.name) entry.name = data.name.trim();
    if (data.phone) entry.phone = data.phone.trim();
    if (data.password) {
      entry.password = data.password;
      entry.passwordHash = await bcrypt.hash(data.password, 12);
    }
    return { id: entry.id, name: entry.name, vehicleNumber: entry.vehicleNumber, phone: entry.phone };
  }

  deleteDriver(id: string): boolean {
    const entry = Array.from(this.drivers.values()).find((d) => d.id === id);
    if (!entry) return false;
    this.drivers.delete(entry.vehicleNumber);
    return true;
  }
}

export const authService = new AuthService();
