import express from 'express';
import {
  getUserSettings,
  updateUserSettings,
  resetSettings,
} from '../controllers/settingsController';
import { protect } from '../middleware/auth';
import { auditLogger } from '../middleware/auditLogger';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get user settings
router.get('/', getUserSettings);

// Update user settings
router.put(
  '/',
  updateUserSettings,
  auditLogger('UPDATE_SETTINGS', 'settings')
);

// Reset settings to defaults
router.post(
  '/reset',
  resetSettings,
  auditLogger('RESET_SETTINGS', 'settings')
);

export default router;