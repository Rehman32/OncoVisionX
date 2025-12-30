import express from 'express';
import {
  enableMFA,
  disableMFA,
  sendOTP,
  verifyOTPCode,
} from '../controllers/mfaController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Protected routes (require authentication)
router.post('/enable', protect, enableMFA);
router.post('/disable', protect, disableMFA);

// Public routes (for login flow)
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTPCode);

export default router;
