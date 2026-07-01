import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { logger } from './config/logger';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authService } from './services/authService';
import { setupSocketManager } from './socket/socketManager';
import authRoutes from './routes/auth';
import driverRoutes from './routes/drivers';

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

const corsOriginFn = (
  origin: string | undefined,
  cb: (err: Error | null, allow?: boolean) => void,
) => {
  if (!origin) return cb(null, true); // server-to-server or same-origin
  const allowed =
    config.corsOrigins.some((o) => o === origin) ||
    /\.vercel\.app$/.test(origin) ||
    /localhost(:\d+)?$/.test(origin) ||
    /^capacitor:\/\/localhost/.test(origin);
  cb(allowed ? null : new Error(`CORS: ${origin} not allowed`), allowed);
};

app.use(
  cors({
    origin: corsOriginFn,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use('/api/', rateLimiter);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Balaji Fleet Tracker API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const httpServer = createServer(app);

const io = new Server(httpServer, {
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

setupSocketManager(io);

async function start(): Promise<void> {
  try {
    await authService.initialize();

    httpServer.listen(config.port, () => {
      logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      logger.info(`  Balaji Fleet Tracker Backend`);
      logger.info(`  Port     : ${config.port}`);
      logger.info(`  Env      : ${config.nodeEnv}`);
      logger.info(`  CORS     : ${config.corsOrigins.join(', ')}`);
      logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err });
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', { reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

void start();

export { app, io };
