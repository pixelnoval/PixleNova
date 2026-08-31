import rateLimit from 'express-rate-limit';

// Standard rate-limit response shape
const handler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please wait and try again.',
  });
};

/**
 * General API rate limiter — applied globally.
 * 200 requests per 15 minutes per IP.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

/**
 * Contact form limiter — stricter to prevent spam.
 * 5 submissions per 15 minutes per IP.
 */
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many contact submissions. Please wait 15 minutes before trying again.',
  handler,
});

/**
 * Login limiter — prevents brute-force attacks.
 * 10 attempts per 15 minutes per IP.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skipSuccessfulRequests: true, // Only count failed attempts
});
