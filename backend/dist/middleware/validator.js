"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationSchema = exports.loginSchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
            const response = {
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
exports.loginSchema = zod_1.z.object({
    vehicleNumber: zod_1.z.string().trim().optional(),
    username: zod_1.z.string().trim().optional(),
    password: zod_1.z.string().min(1, 'Password is required'),
}).refine((data) => data.vehicleNumber ?? data.username, { message: 'vehicleNumber or username is required' });
exports.locationSchema = zod_1.z.object({
    lat: zod_1.z.number().min(-90).max(90),
    lng: zod_1.z.number().min(-180).max(180),
    accuracy: zod_1.z.number().positive().max(10000),
    speed: zod_1.z.number().min(0).max(500).nullable(),
    heading: zod_1.z.number().min(0).max(360).nullable(),
    altitude: zod_1.z.number().nullable(),
    timestamp: zod_1.z.number().positive(),
    battery: zod_1.z.number().min(0).max(100).nullable().optional(),
    network: zod_1.z.string().max(20).nullable().optional(),
    address: zod_1.z.string().max(500).nullable().optional(),
});
//# sourceMappingURL=validator.js.map