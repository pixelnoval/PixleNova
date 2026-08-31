import { env } from '../config/env.js';

/**
 * Central error handling middleware.
 * Must be registered as the LAST middleware in Express.
 */
export function errorMiddleware(err, req, res, next) {
  // Already sent — delegate to Express default
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || 500;
  const message =
    env.isProduction && statusCode === 500
      ? 'An internal server error occurred.'
      : err.message || 'Something went wrong.';

  // Log full error in development, minimal in production
  if (!env.isProduction) {
    console.error(`[Error] ${req.method} ${req.path}`, err);
  } else {
    console.error(`[Error] ${statusCode} ${req.method} ${req.path}: ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

/**
 * 404 handler — must be registered before errorMiddleware.
 */
export function notFoundMiddleware(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
}

/**
 * Helper — creates an error with a specific HTTP status code.
 */
export function createError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}
