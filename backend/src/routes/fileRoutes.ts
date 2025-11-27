import express from 'express';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../config/multer';
import { uploadFile, getFile } from '../controllers/fileController';
import { auditLogger } from '../middleware/auditLogger';

const router = express.Router();

// All file ops require login; only doctor or admin can upload
router.post(
  '/upload',
  protect, authorize('doctor', 'admin'),
  upload.single('file'),
  uploadFile,
  auditLogger('UPLOAD_FILE', 'file')
);
// Get/download: all authenticated (RBAC to-do)
router.get('/:id', protect, getFile);

export default router;
