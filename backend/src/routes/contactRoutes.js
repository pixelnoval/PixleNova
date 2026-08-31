import { Router } from 'express';
import {
  submitContact,
  listContacts,
  getContact,
  updateContactStatus,
  deleteContact,
} from '../controllers/contactController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { contactLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

// POST /api/contact — rate-limited, public
router.post('/', contactLimiter, submitContact);

// ─── PROTECTED — ADMIN ONLY ──────────────────────────────────────────────────

// GET    /api/contact          — list with pagination, filter, search
// GET    /api/contact/:id      — single enquiry
// PATCH  /api/contact/:id/status — update status
// DELETE /api/contact/:id      — delete

router.get('/', requireAuth, listContacts);
router.get('/:id', requireAuth, getContact);
router.patch('/:id/status', requireAuth, updateContactStatus);
router.delete('/:id', requireAuth, deleteContact);

export default router;
