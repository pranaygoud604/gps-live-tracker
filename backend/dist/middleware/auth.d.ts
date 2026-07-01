import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../types';
export interface AuthRequest extends Request {
    user?: JWTPayload;
}
export declare function authenticate(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function requireDriver(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function verifySocketToken(token: string): JWTPayload | null;
//# sourceMappingURL=auth.d.ts.map