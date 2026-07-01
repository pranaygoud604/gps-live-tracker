import { Driver, LoginResponse } from '../types';
interface DriverRecord extends Driver {
    passwordHash: string;
}
declare class AuthService {
    private drivers;
    private adminHash;
    private initialized;
    initialize(): Promise<void>;
    loginDriver(vehicleNumber: string, password: string): Promise<LoginResponse | null>;
    loginAdmin(username: string, password: string): Promise<LoginResponse | null>;
    getAllDrivers(): Omit<DriverRecord, 'password' | 'passwordHash'>[];
}
export declare const authService: AuthService;
export {};
//# sourceMappingURL=authService.d.ts.map