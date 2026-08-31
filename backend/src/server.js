import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import prisma from './config/database.js';
import { env } from './config/env.js';
import { globalLimiter } from './middleware/rateLimitMiddleware.js';
import { errorMiddleware, notFoundMiddleware } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

const app = express();

// ─── TRUST PROXY ─────────────────────────────────────────────────────────────
app.set('trust proxy', true);

// ─── SECURITY HEADERS ────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.frontendUrl,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── REQUEST PARSING ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));

// ─── GLOBAL RATE LIMIT ────────────────────────────────────────────────────────
app.use(globalLimiter);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: 'PixleNova API is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Server is up but DB not reachable
    res.status(503).json({
      success: false,
      message: 'PixleNova API is running — database unavailable',
      database: 'disconnected',
    });
  }
});

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);

// ─── 404 + ERROR HANDLING ────────────────────────────────────────────────────
app.use(notFoundMiddleware);
app.use(errorMiddleware);

// ─── STARTUP ─────────────────────────────────────────────────────────────────
async function start() {
  try {
    await prisma.$connect();
    console.log('✅  Database connected');
  } catch (err) {
    console.error('❌  Database connection failed:', err.message);
    // Fail fast in production — in dev the server still starts for local testing
    if (env.isProduction) process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`🚀  PixleNova API running on port ${env.port} [${env.nodeEnv}]`);
    console.log(`    CORS origin: ${env.frontendUrl}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — closing database connection...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();
