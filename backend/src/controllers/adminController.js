import argon2 from 'argon2';
import prisma from '../config/database.js';
import { createError } from '../middleware/errorMiddleware.js';
import { 
  validateCreateAdmin, 
  validateUpdateAdmin, 
  validatePasswordReset, 
  validateAdminStatusUpdate 
} from '../utils/validation.js';

/**
 * GET /api/admin/admins
 * Get all admins. Only SUPER_ADMIN can access (handled by middleware).
 */
export async function getAdmins(req, res, next) {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: admins });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/admins
 * Create a new Staff Admin. Only SUPER_ADMIN can access.
 */
export async function createAdmin(req, res, next) {
  try {
    const { errors, data } = validateCreateAdmin(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const { name, email, password } = data;

    // Check if email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    // Hash password using Argon2
    const passwordHash = await argon2.hash(password);

    // Create Admin
    const newAdmin = await prisma.admin.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'STAFF_ADMIN', // Force STAFF_ADMIN
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });

    res.status(201).json({
      success: true,
      message: 'Staff Admin created successfully.',
      data: newAdmin
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/admins/:id
 * Update Staff Admin details (name, email).
 */
export async function updateAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const { errors, data } = validateUpdateAdmin(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const adminToUpdate = await prisma.admin.findUnique({ where: { id } });
    if (!adminToUpdate) {
      return next(createError('Admin not found.', 404));
    }
    
    // Check if new email is already taken by another admin
    if (data.email && data.email !== adminToUpdate.email) {
      const existingEmail = await prisma.admin.findUnique({ where: { email: data.email } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email is already in use.' });
      }
    }

    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Admin updated successfully.',
      data: updatedAdmin
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/admins/:id/status
 * Enable or disable Staff Admin.
 */
export async function updateAdminStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { errors, data } = validateAdminStatusUpdate(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const adminToUpdate = await prisma.admin.findUnique({ where: { id } });
    if (!adminToUpdate) {
      return next(createError('Admin not found.', 404));
    }

    if (adminToUpdate.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot disable a Super Admin account.' });
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: { isActive: data.isActive },
      select: { id: true, name: true, isActive: true, role: true }
    });

    res.json({
      success: true,
      message: `Admin account has been ${data.isActive ? 'enabled' : 'disabled'}.`,
      data: updatedAdmin
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/admins/:id/password
 * Reset Staff Admin password.
 */
export async function resetAdminPassword(req, res, next) {
  try {
    const { id } = req.params;
    const { errors, data } = validatePasswordReset(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const adminToUpdate = await prisma.admin.findUnique({ where: { id } });
    if (!adminToUpdate) {
      return next(createError('Admin not found.', 404));
    }

    const passwordHash = await argon2.hash(data.password);

    await prisma.admin.update({
      where: { id },
      data: { passwordHash }
    });

    res.json({
      success: true,
      message: 'Password reset successfully.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/admins/:id
 * Delete a Staff Admin.
 */
export async function deleteAdmin(req, res, next) {
  try {
    const { id } = req.params;

    const adminToDelete = await prisma.admin.findUnique({ where: { id } });
    if (!adminToDelete) {
      return next(createError('Admin not found.', 404));
    }

    if (adminToDelete.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot delete a Super Admin account.' });
    }

    if (req.admin.id === id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    await prisma.admin.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Admin account deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}
