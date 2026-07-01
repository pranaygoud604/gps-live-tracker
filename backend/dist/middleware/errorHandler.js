"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const logger_1 = require("../config/logger");
class AppError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
function errorHandler(err, req, res, _next) {
    if (err instanceof AppError) {
        const response = { success: false, message: err.message };
        res.status(err.statusCode).json(response);
        return;
    }
    logger_1.logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    const response = {
        success: false,
        message: process.env['NODE_ENV'] === 'production' ? 'Internal server error' : err.message,
    };
    res.status(500).json(response);
}
function notFoundHandler(req, res) {
    const response = { success: false, message: `Route not found: ${req.method} ${req.path}` };
    res.status(404).json(response);
}
//# sourceMappingURL=errorHandler.js.map