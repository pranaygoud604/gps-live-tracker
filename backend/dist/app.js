"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const logger_1 = require("./config/logger");
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const authService_1 = require("./services/authService");
const socketManager_1 = require("./socket/socketManager");
const auth_1 = __importDefault(require("./routes/auth"));
const drivers_1 = __importDefault(require("./routes/drivers"));
const app = (0, express_1.default)();
exports.app = app;
app.set('trust proxy', 1);
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));
const corsOriginFn = (origin, cb) => {
    if (!origin)
        return cb(null, true);
    const allowed = config_1.config.corsOrigins.some((o) => o === origin) ||
        /\.vercel\.app$/.test(origin) ||
        /localhost:\d+$/.test(origin);
    cb(allowed ? null : new Error(`CORS: ${origin} not allowed`), allowed);
};
app.use((0, cors_1.default)({
    origin: corsOriginFn,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
app.use('/api/', rateLimiter_1.rateLimiter);
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'Balaji Fleet Tracker API',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config_1.config.nodeEnv,
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/drivers', drivers_1.default);
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: corsOriginFn,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    transports: ['websocket', 'polling'],
});
exports.io = io;
(0, socketManager_1.setupSocketManager)(io);
async function start() {
    try {
        await authService_1.authService.initialize();
        httpServer.listen(config_1.config.port, () => {
            logger_1.logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            logger_1.logger.info(`  Balaji Fleet Tracker Backend`);
            logger_1.logger.info(`  Port     : ${config_1.config.port}`);
            logger_1.logger.info(`  Env      : ${config_1.config.nodeEnv}`);
            logger_1.logger.info(`  CORS     : ${config_1.config.corsOrigins.join(', ')}`);
            logger_1.logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        });
    }
    catch (err) {
        logger_1.logger.error('Failed to start server', { error: err });
        process.exit(1);
    }
}
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error('Unhandled Promise Rejection', { reason });
});
process.on('uncaughtException', (err) => {
    logger_1.logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    process.exit(1);
});
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    httpServer.close(() => {
        logger_1.logger.info('Server closed');
        process.exit(0);
    });
});
void start();
//# sourceMappingURL=app.js.map