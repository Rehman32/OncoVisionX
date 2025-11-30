import express from 'express';
import {
  createPrediction,
  getPredictions,
  getPredictionById,
  deletePrediction,
  handleMLWebhook
} from '../controllers/predictionController';
import { protect, authorize } from '../middleware/auth';
import { auditLogger } from '../middleware/auditLogger';

const router = express.Router();

// Webhook endpoint (public but API key protected)
router.post('/webhook/:id', handleMLWebhook);

// All other routes require authentication
router.use(protect);

// Create prediction
router.post(
  '/',
  authorize('admin', 'doctor'),
  createPrediction,
  auditLogger('CREATE_PREDICTION', 'prediction')
);

// List predictions
router.get(
  '/',
  authorize('admin', 'doctor', 'researcher'),
  getPredictions
);

// Get single prediction
router.get(
  '/:id',
  authorize('admin', 'doctor', 'researcher'),
  getPredictionById
);

// Delete prediction (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  deletePrediction,
  auditLogger('DELETE_PREDICTION', 'prediction')
);

export default router;
