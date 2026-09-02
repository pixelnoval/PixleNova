import express from 'express';
import { requireAuth, requireSuperAdmin } from '../middleware/authMiddleware.js';
import { 
  getAdmins, 
  createAdmin, 
  updateAdmin, 
  updateAdminStatus, 
  resetAdminPassword, 
  deleteAdmin 
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and SUPER_ADMIN role
router.use(requireAuth);
router.use(requireSuperAdmin);

router.get('/', getAdmins);
router.post('/', createAdmin);
router.put('/:id', updateAdmin);
router.patch('/:id/status', updateAdminStatus);
router.patch('/:id/password', resetAdminPassword);
router.delete('/:id', deleteAdmin);

export default router;
