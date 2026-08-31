// This file centralizes environment variable access.
// All other modules import from here — never from process.env directly.

import 'dotenv/config';

function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || '"PixleNova" <no-reply@pixlenova.com>',
    adminEmail: process.env.ADMIN_EMAIL || '',
  },
};

// Validate critical production secrets
if (env.isProduction) {
  requireEnv('JWT_SECRET');
  requireEnv('DATABASE_URL');
  requireEnv('FRONTEND_URL');
}
