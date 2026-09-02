import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { env } from '../config/env.js';
import { validateLogin } from '../utils/validation.js';
import { createError } from '../middleware/errorMiddleware.js';

/**
 * POST /api/auth/login
 * Accepts { email, password }, returns a signed JWT on success.
 */
export async function login(req, res, next) {
  try {
    const { errors, data } = validateLogin(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const { email, password } = data;

    // Look up admin — use case-insensitive search so 'Pixelnovaltd@gmail.com' matches
    const admin = await prisma.admin.findFirst({ 
      where: { 
        email: { equals: email, mode: 'insensitive' } 
      } 
    });

    if (!admin) {
      // Simulate hash comparison timing to prevent timing attacks
      await argon2.hash('timing_dummy_password');
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isValid = await argon2.verify(admin.passwordHash, password);
    if (!isValid) {
      console.warn(`[Auth] Failed login attempt for: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'This admin account has been disabled. Contact the Super Admin.' 
      });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    console.log(`[Auth] Admin logged in: ${admin.email}`);

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Returns the current authenticated admin's profile.
 * Requires requireAuth middleware.
 */
export async function getMe(req, res, next) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: { id: true, email: true, createdAt: true },
    });

    if (!admin) {
      return next(createError('Admin account not found.', 404));
    }

    res.json({ success: true, data: { admin } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * JWT is stateless — logout is handled client-side by discarding the token.
 * This endpoint acknowledges the action.
 */
export function logout(req, res) {
  console.log(`[Auth] Admin logged out: ${req.admin?.email}`);
  res.json({ success: true, message: 'Logged out successfully.' });
}
