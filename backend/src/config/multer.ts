import multer from 'multer';
import { BadRequestError } from '../utils/errors';

/**
 * Multer configuration for dermoscopy image uploads.
 * Uses memory storage to get the buffer directly for forwarding to FastAPI.
 */
const storage = multer.memoryStorage();

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/tiff',
];

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (!file) {
    cb(new BadRequestError('No file provided'));
    return;
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(
      new BadRequestError(
        `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`
      )
    );
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max for dermoscopy images
  },
});
