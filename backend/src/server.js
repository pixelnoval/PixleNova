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
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// ─── TRUST PROXY ─────────────────────────────────────────────────────────────
// Use 1 to trust Render's immediate reverse proxy and accurately extract client IP.
// `true` is too permissive and triggers express-rate-limit ERR_ERL_PERMISSIVE_TRUST_PROXY.
app.set('trust proxy', 1);

// ─── SECURITY HEADERS ────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  env.frontendUrl,
  'https://pixelnovaofficial.web.app',
  'https://pixelnovaofficial.firebaseapp.com',
  'https://pixlenova.web.app',
  'https://pixlenova.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        // Explicitly echo the matched origin so the browser receives the exact
        // requesting origin string — required when credentials: true is set.
        return callback(null, origin);
      }
      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Submission-Id', 'Idempotency-Key'],
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
      message: 'PixelNova API is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Server is up but DB not reachable
    res.status(503).json({
      success: false,
      message: 'PixelNova API is running — database unavailable',
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

import { seedAdmin } from './utils/seedAdmin.js';

// ─── STARTUP ─────────────────────────────────────────────────────────────────
async function start() {
  try {
    await prisma.$connect();
    console.log('✅  Database connected');
    await seedAdmin();
  } catch (err) {
    console.error('❌  Database connection failed:', err.message);
    // Fail fast in production — in dev the server still starts for local testing
    if (env.isProduction) process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`🚀  PixelNova API running on port ${env.port} [${env.nodeEnv}]`);
    console.log(`    CORS allowed origins:\n${allowedOrigins.map(o => `      • ${o}`).join('\n')}`);

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
