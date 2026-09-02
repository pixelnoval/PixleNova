import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { createError } from './errorMiddleware.js';

/**
 * Middleware that verifies a JWT Bearer token on protected routes.
 * Attaches the decoded payload to req.admin.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createError('Authentication required.', 401));
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(createError('Session expired. Please log in again.', 401));
    }
    return next(createError('Invalid authentication token.', 401));
  }
}

/**
 * Middleware that requires the admin to have the SUPER_ADMIN role.
 * Must be used after requireAuth.
 */
export function requireSuperAdmin(req, res, next) {
  if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
    return next(createError('Super Admin access required.', 403));
  }
  next();
}
