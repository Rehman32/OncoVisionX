import express from 'express';
import { getAllUsers, getUser, updateUser, deactivateUser, activateUser } from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';
import { auditLogger } from '../middleware/auditLogger';

const router = express.Router();

// All user management routes require authentication as Admin
router.use(protect, authorize('admin'));

router.get('/', getAllUsers);
router.get('/:id', getUser);
router.put('/:id', auditLogger('UPDATE_USER', 'user'), updateUser);
router.put('/:id/deactivate', auditLogger('DEACTIVATE_USER', 'user'), deactivateUser);
router.put('/:id/activate', auditLogger('ACTIVATE_USER', 'user'), activateUser);

export default router;
