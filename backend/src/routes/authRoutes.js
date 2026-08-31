import { Router } from 'express';
import { login, getMe, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { loginLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

// POST /api/auth/login — rate-limited
router.post('/login', loginLimiter, login);

// GET /api/auth/me — requires JWT
router.get('/me', requireAuth, getMe);

// POST /api/auth/logout — requires JWT (client discards token)
router.post('/logout', requireAuth, logout);

export default router;
