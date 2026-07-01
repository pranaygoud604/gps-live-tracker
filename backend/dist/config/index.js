"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
function requireEnv(key, fallback) {
    const value = process.env[key] ?? fallback;
    if (!value)
        throw new Error(`Missing required environment variable: ${key}`);
    return value;
}
exports.config = {
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    port: parseInt(process.env['PORT'] ?? '3001', 10),
    corsOrigins: (process.env['CORS_ORIGIN'] ?? 'http://localhost:5173')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    jwt: {
        secret: requireEnv('JWT_SECRET', 'dev-secret-change-in-production-please'),
        expiresIn: process.env['JWT_EXPIRES_IN'] ?? '24h',
    },
    admin: {
        username: process.env['ADMIN_USERNAME'] ?? 'admin',
        password: requireEnv('ADMIN_PASSWORD', 'Admin@Balaji2024'),
        name: process.env['ADMIN_NAME'] ?? 'Balaji Fleet Admin',
        id: 'admin001',
    },
    rateLimit: {
        windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '900000', 10),
        max: parseInt(process.env['RATE_LIMIT_MAX'] ?? '100', 10),
    },
    isProduction: process.env['NODE_ENV'] === 'production',
    isDevelopment: process.env['NODE_ENV'] === 'development',
};
//# sourceMappingURL=index.js.map