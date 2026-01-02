import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  resetUserPassword
} from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';
import { auditLogger } from '../middleware/auditLogger';

const router = express.Router();

// All routes require authentication
router.use(protect);

// List users (admin only)
router.get('/', authorize('admin'), getUsers);

// Create user (admin only)
router.post(
  '/',
  authorize('admin'),
  createUser,
  auditLogger('CREATE_USER', 'user')
);

// Reset user password (admin only)
router.post(
  '/:id/reset-password',
  authorize('admin'),
  resetUserPassword,
  auditLogger('RESET_USER_PASSWORD', 'user')
);

// Get single user (admin or self)
router.get('/:id', getUserById);

// Update user (admin or self)
router.put(
  '/:id',
  updateUser,
  auditLogger('UPDATE_USER', 'user')
);

// Deactivate user (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  deactivateUser,
  auditLogger('DEACTIVATE_USER', 'user')
);

export default router;
