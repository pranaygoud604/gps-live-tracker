import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
export declare function validate<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
export declare const loginSchema: z.ZodEffects<z.ZodObject<{
    vehicleNumber: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    vehicleNumber?: string | undefined;
    username?: string | undefined;
}, {
    password: string;
    vehicleNumber?: string | undefined;
    username?: string | undefined;
}>, {
    password: string;
    vehicleNumber?: string | undefined;
    username?: string | undefined;
}, {
    password: string;
    vehicleNumber?: string | undefined;
    username?: string | undefined;
}>;
export declare const locationSchema: z.ZodObject<{
    lat: z.ZodNumber;
    lng: z.ZodNumber;
    accuracy: z.ZodNumber;
    speed: z.ZodNullable<z.ZodNumber>;
    heading: z.ZodNullable<z.ZodNumber>;
    altitude: z.ZodNullable<z.ZodNumber>;
    timestamp: z.ZodNumber;
    battery: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    network: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    lat: number;
    lng: number;
    accuracy: number;
    speed: number | null;
    heading: number | null;
    altitude: number | null;
    battery?: number | null | undefined;
    network?: string | null | undefined;
    address?: string | null | undefined;
}, {
    timestamp: number;
    lat: number;
    lng: number;
    accuracy: number;
    speed: number | null;
    heading: number | null;
    altitude: number | null;
    battery?: number | null | undefined;
    network?: string | null | undefined;
    address?: string | null | undefined;
}>;
//# sourceMappingURL=validator.d.ts.map