"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireAdmin = requireAdmin;
exports.requireDriver = requireDriver;
exports.verifySocketToken = verifySocketToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        const response = { success: false, message: 'Authorization token required' };
        res.status(401).json(response);
        return;
    }
    const token = authHeader.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        req.user = payload;
        next();
    }
    catch (err) {
        const message = err instanceof jsonwebtoken_1.default.TokenExpiredError ? 'Token expired' : 'Invalid token';
        const response = { success: false, message };
        res.status(401).json(response);
    }
}
function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        const response = { success: false, message: 'Admin access required' };
        res.status(403).json(response);
        return;
    }
    next();
}
function requireDriver(req, res, next) {
    if (req.user?.role !== 'driver') {
        const response = { success: false, message: 'Driver access required' };
        res.status(403).json(response);
        return;
    }
    next();
}
function verifySocketToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=auth.js.map