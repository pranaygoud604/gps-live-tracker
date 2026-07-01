import { DriverSession, LocationUpdatePayload } from '../types';
declare class DriverService {
    private sessions;
    private socketToDriver;
    createSession(driverId: string, driverName: string, vehicleNumber: string, phone: string, socketId: string): DriverSession;
    disconnectDriver(socketId: string): DriverSession | null;
    updateLocation(socketId: string, payload: LocationUpdatePayload): DriverSession | null;
    setTracking(socketId: string, isTracking: boolean): DriverSession | null;
    updateHeartbeat(socketId: string, battery?: number | null, network?: string | null): DriverSession | null;
    getSessionBySocketId(socketId: string): DriverSession | null;
    getSession(driverId: string): DriverSession | null;
    getAllSessions(): DriverSession[];
    getOnlineSessions(): DriverSession[];
    getStats(): {
        total: number;
        online: number;
        offline: number;
        tracking: number;
        avgSpeedKmh: number;
    };
}
export declare const driverService: DriverService;
export {};
//# sourceMappingURL=driverService.d.ts.map