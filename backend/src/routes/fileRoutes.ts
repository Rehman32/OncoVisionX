import express from 'express';
import {
  startUpload,
  uploadChunk,
  completeUpload,
  getUploadStatus,
  cancelUpload
} from '../controllers/fileController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../config/multer';
import { auditLogger } from '../middleware/auditLogger';

const router = express.Router();

// All file routes require authentication
router.use(protect);

// Start upload session
router.post(
  '/upload-start',
  authorize('admin', 'doctor'),
  startUpload,
  auditLogger('START_UPLOAD', 'file')
);

// Upload chunk (multer processes the file)
router.post(
  '/upload-chunk',
  authorize('admin', 'doctor'),
  upload.single('file'), // 'file' is the field name from frontend
  uploadChunk
);

// Complete upload
router.post(
  '/upload-complete',
  authorize('admin', 'doctor'),
  completeUpload,
  auditLogger('COMPLETE_UPLOAD', 'file')
);

// Get upload status
router.get(
  '/upload-status/:sessionId',
  authorize('admin', 'doctor', 'researcher'),
  getUploadStatus
);

// Cancel upload
router.delete(
  '/upload-cancel/:sessionId',
  authorize('admin', 'doctor'),
  cancelUpload,
  auditLogger('CANCEL_UPLOAD', 'file')
);

export default router;
