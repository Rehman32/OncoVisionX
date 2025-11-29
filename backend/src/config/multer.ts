import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import crypto from 'crypto';
import path from 'path';

const storage = new GridFsStorage({
  url: process.env.MONGODB_URI || 'mongodb://localhost:27017/OncoVisionX',
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      // Use random filename (never original—security!) and assign patient context
      crypto.randomBytes(16, (err, buf) => {
        if (err) return reject(err);
        // Accept only if user+patient info exists
        if (!req.user || !req.body.patientId)
          return reject(new Error('User or patientId required'));
        const filename = buf.toString('hex') + path.extname(file.originalname);
        resolve({
          filename,
          metadata: {
            uploadedBy: req.user.userId,
            patientId: req.body.patientId,
            modality: req.body.modality || 'other', // 'pathology', 'radiology', etc.
            originalName: file.originalname,
            mimeType: file.mimetype,
          },
          bucketName: 'uploads'
        });
      });
    });
  }
});

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5GB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/tiff",
      "application/dicom",
      "application/zip",
      "text/csv",
      "application/json",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type"));
  },
});
