import express from 'express';
import {
  createPrediction,
  getPredictions,
  getPredictionById,
  deletePrediction,
} from '../controllers/predictionController';
import { protect, authorize } from '../middleware/auth';
import { auditLogger } from '../middleware/auditLogger';
import { upload } from '../config/multer';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create prediction — accepts multipart/form-data with dermoscopy image
router.post(
  '/',
  authorize('doctor'),
  upload.single('image'),
  createPrediction,
  auditLogger('CREATE_PREDICTION', 'prediction')
);

// List predictions
router.get(
  '/',
  authorize('admin', 'doctor'),
  getPredictions
);

// Get single prediction
router.get(
  '/:id',
  authorize('admin', 'doctor'),
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
