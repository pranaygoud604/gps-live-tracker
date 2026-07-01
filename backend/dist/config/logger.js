"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
const { combine, timestamp, printf, colorize, errors } = winston_1.default.format;
const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
    return `${ts} [${level}]: ${stack ?? message}`;
});
const transports = [
    new winston_1.default.transports.Console({
        format: combine(colorize({ all: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
    }),
];
if (process.env['NODE_ENV'] === 'production') {
    transports.push(new winston_daily_rotate_file_1.default({
        filename: path_1.default.join('logs', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxFiles: '14d',
        maxSize: '20m',
        format: combine(timestamp(), errors({ stack: true }), winston_1.default.format.json()),
    }), new winston_daily_rotate_file_1.default({
        filename: path_1.default.join('logs', 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxFiles: '14d',
        maxSize: '20m',
        format: combine(timestamp(), errors({ stack: true }), winston_1.default.format.json()),
    }));
}
exports.logger = winston_1.default.createLogger({
    level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
    format: combine(timestamp(), errors({ stack: true })),
    transports,
    exitOnError: false,
});
//# sourceMappingURL=logger.js.map