import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';
import { gfs } from '../config/gridfs';

// POST /api/files/upload
export const uploadFile = (req: Request, res: Response, next: NextFunction) => {
  /* multer-gridfs-storage automatically stores the file to GridFS */
  if (!req.file) return next(new BadRequestError('No file uploaded'));
  res.status(201).json({
    success: true,
    fileId: (req.file as any).id,
    filename: (req.file as any).filename,
    metadata: (req.file as any).metadata,
    message: 'Upload OK'
  });
};

// GET /api/files/:id
export const getFile = async (req: Request, res: Response, next: NextFunction) => {
  gfs.files.findOne({ _id: req.params.id }, (err, file) => {
    if (err || !file) return next(new BadRequestError('File not found'));
    // Security: Only allow access if user is allowed to see patient
    // TODO: Apply RBAC check linking file.patientId and req.user
    // Stream file as download:
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', `attachment; filename="${file.metadata.originalName}"`);
    const readstream = gfs.createReadStream({ _id: file._id });
    readstream.pipe(res);
  });
};
