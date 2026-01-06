import express from 'express';
import { getDashboardStats, getRecentActivity } from '../controllers/dashboardController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All dashboard routes require authentication
router.use(protect);

// Get dashboard statistics
router.get('/stats', getDashboardStats);

// Get recent activity feed
router.get('/activity', getRecentActivity);

export default router;
