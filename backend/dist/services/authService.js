"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const logger_1 = require("../config/logger");
function signToken(payload) {
    const opts = { expiresIn: 86400 };
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, opts);
}
class AuthService {
    constructor() {
        this.drivers = new Map();
        this.adminHash = '';
        this.initialized = false;
    }
    async initialize() {
        if (this.initialized)
            return;
        try {
            const filePath = path_1.default.join(__dirname, '../../data/drivers.json');
            const raw = fs_1.default.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(raw);
            await Promise.all(data.drivers.map(async (driver) => {
                const passwordHash = await bcryptjs_1.default.hash(driver.password, 12);
                this.drivers.set(driver.vehicleNumber.toUpperCase(), {
                    ...driver,
                    passwordHash,
                });
            }));
            this.adminHash = await bcryptjs_1.default.hash(config_1.config.admin.password, 12);
            this.initialized = true;
            logger_1.logger.info(`AuthService initialized with ${this.drivers.size} drivers`);
        }
        catch (err) {
            logger_1.logger.error('Failed to initialize AuthService', { error: err });
            throw err;
        }
    }
    async loginDriver(vehicleNumber, password) {
        const record = this.drivers.get(vehicleNumber.toUpperCase());
        if (!record)
            return null;
        const valid = await bcryptjs_1.default.compare(password, record.passwordHash);
        if (!valid)
            return null;
        const payload = {
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
    async loginAdmin(username, password) {
        if (username !== config_1.config.admin.username)
            return null;
        const valid = await bcryptjs_1.default.compare(password, this.adminHash);
        if (!valid)
            return null;
        const payload = {
            sub: config_1.config.admin.id,
            name: config_1.config.admin.name,
            role: 'admin',
        };
        return {
            token: signToken(payload),
            user: {
                id: config_1.config.admin.id,
                name: config_1.config.admin.name,
                role: 'admin',
            },
        };
    }
    getAllDrivers() {
        return Array.from(this.drivers.values()).map(({ password: _p, passwordHash: _h, ...rest }) => rest);
    }
}
exports.authService = new AuthService();
//# sourceMappingURL=authService.js.map