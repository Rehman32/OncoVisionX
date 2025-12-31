import express from 'express';
import { getAuditLogs, getAuditStats } from '../controllers/auditController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// All audit routes require admin
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAuditLogs);
router.get('/stats', getAuditStats);

export default router;
