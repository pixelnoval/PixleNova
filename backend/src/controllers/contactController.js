import prisma from '../config/database.js';
import { validateContact, validateStatusUpdate } from '../utils/validation.js';
import { sendEnquiryNotification, sendAcknowledgement } from '../services/emailService.js';
import { createError } from '../middleware/errorMiddleware.js';

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

/**
 * POST /api/contact
 * Public — no authentication required.
 * Validates, saves enquiry, then fires email notifications asynchronously.
 */
export async function submitContact(req, res, next) {
  try {
    const { errors, data } = validateContact(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const contact = await prisma.contact.create({
      data: {
        name: data.name,
        email: data.email,
        message: data.message,
        status: 'NEW',
      },
    });

    // Fire-and-forget — emails must NOT prevent a successful response
    // Added .catch() to prevent unhandled promise rejections from crashing the server
    // if a synchronous error occurs inside the async function before its try/catch block.
    setImmediate(() => {
      sendEnquiryNotification(contact).catch(err => console.error('[Email] Unexpected notification error:', err.message));
      sendAcknowledgement(contact).catch(err => console.error('[Email] Unexpected acknowledgement error:', err.message));
    });

    res.status(201).json({
      success: true,
      message: 'Your enquiry has been received. We\'ll be in touch soon.',
    });
  } catch (err) {
    next(err);
  }
}

// ─── ADMIN — PROTECTED ───────────────────────────────────────────────────────

/**
 * GET /api/contact
 * Returns paginated enquiries with optional filtering.
 * Query: ?page=1&limit=20&status=NEW&search=text&sort=createdAt&order=desc
 */
export async function listContacts(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const { status, search, sort = 'createdAt', order = 'desc' } = req.query;

    // Build filter
    const where = {};
    if (status && ['NEW', 'READ', 'REPLIED', 'ARCHIVED'].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Safe sort field whitelist
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'email', 'status'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const [total, contacts] = await Promise.all([
      prisma.contact.count({ where }),
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          message: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/contact/:id
 * Returns a single enquiry.
 */
export async function getContact(req, res, next) {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id },
    });

    if (!contact) {
      return next(createError('Enquiry not found.', 404));
    }

    res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/contact/:id/status
 * Updates the enquiry status.
 * Body: { status: 'READ' | 'REPLIED' | 'ARCHIVED' | 'NEW' }
 */
export async function updateContactStatus(req, res, next) {
  try {
    const { error, status } = validateStatusUpdate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const existing = await prisma.contact.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return next(createError('Enquiry not found.', 404));
    }

    const updated = await prisma.contact.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json({
      success: true,
      message: `Status updated to ${status}.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/contact/:id
 * Permanently deletes an enquiry.
 */
export async function deleteContact(req, res, next) {
  try {
    const existing = await prisma.contact.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return next(createError('Enquiry not found.', 404));
    }

    await prisma.contact.delete({ where: { id: req.params.id } });

    console.log(`[Admin] Enquiry ${req.params.id} deleted by ${req.admin.email}`);

    res.json({ success: true, message: 'Enquiry deleted.' });
  } catch (err) {
    next(err);
  }
}
