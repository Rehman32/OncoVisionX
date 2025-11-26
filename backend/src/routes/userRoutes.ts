import express from 'express';
import { getAllUsers, getUser, updateUser, deactivateUser, activateUser } from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';
import { auditLogger } from '../middleware/auditLogger';

const router = express.Router();

// All user management routes require authentication as Admin
router.use(protect, authorize('admin'));

router.get('/', getAllUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser, auditLogger('UPDATE_USER', 'user'));
router.put('/:id/deactivate', deactivateUser, auditLogger('DEACTIVATE_USER', 'user'));
router.put('/:id/activate', activateUser, auditLogger('ACTIVATE_USER', 'user'));

export default router;
