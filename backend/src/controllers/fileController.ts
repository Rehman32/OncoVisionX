import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import UploadSession from '../models/UploadSession';
import { BadRequestError, NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

// Configuration constants
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB max
const UPLOAD_BASE_PATH = path.join(__dirname, '../../uploads/sessions');
const SESSION_EXPIRY_HOURS = 24; // Sessions expire after 24 hours

// Allowed file types by category
const ALLOWED_TYPES: Record<string, string[]> = {
  pathology: ['image/tiff', 'image/svs', 'image/ndpi', 'image/jpeg'],
  radiology: ['application/dicom', 'image/dicom'],
  clinical: ['text/csv', 'application/json', 'text/plain'],
  genomic: ['text/csv', 'application/json']
};

// Helper: Validate file type against allowed categories
const validateFileType = (fileType: string, category: string): boolean => {
  const allowedForCategory = ALLOWED_TYPES[category];
  if (!allowedForCategory) {
    throw new BadRequestError(`Invalid category: ${category}`);
  }
  return allowedForCategory.includes(fileType);
};

// Helper: Create directory if it doesn't exist
const ensureDirectory = async (dirPath: string): Promise<void> => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

// Helper: Calculate file hash for verification
const calculateFileHash = async (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fsSync.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};

/**
 * @desc    Start a new upload session
 * @route   POST /api/files/upload-start
 * @access  Private
 */
export const startUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fileName, fileType, totalSize, fileHash, category } = req.body;

    // 1. Check for an existing, incomplete session for THIS file + THIS user
    const existingSession = await UploadSession.findOne({
      fileHash,
      userId: (req as any).user.userId,
      status: { $in: ['pending', 'uploading'] }
    });

    if (existingSession) {
      logger.info('Resuming session', { sessionId: existingSession.sessionId });
      res.status(200).json({
        success: true,
        message: 'Resuming upload',
        data: {
          sessionId: existingSession.sessionId,
          totalChunks: existingSession.totalChunks,
          uploadedChunks: existingSession.uploadedChunks // Frontend starts from here
        }
      });
      return;
    }

    // 2. Otherwise, create a brand new session (Your existing logic)
    const sessionId = uuidv4();
    const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
    const sessionPath = path.join(UPLOAD_BASE_PATH, sessionId);
    await ensureDirectory(sessionPath);

    const uploadSession = await UploadSession.create({
      sessionId,
      userId: (req as any).user.userId,
      fileName,
      fileType,
      totalSize,
      totalChunks,
      uploadedChunks: 0, // Start at 0
      fileHash,
      status: 'pending',
      sessionPath,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    res.status(201).json({
      success: true,
      data: { sessionId, totalChunks, uploadedChunks: 0 }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Upload a single chunk
 * @route   POST /api/files/upload-chunk
 * @access  Private
 */
export const uploadChunk = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    console.log('Body:', req.body); 
    console.log('File:', req.file);

    const { sessionId, chunkNumber } = req.body;
    const file = req.file; 

    if (!sessionId || chunkNumber === undefined || !file) {
      throw new BadRequestError(
        `Missing fields. Received: sessionId=${!!sessionId}, chunkNumber=${chunkNumber}, file=${!!file}`
      );
    }

    const chunkNum = parseInt(chunkNumber);

    if (isNaN(chunkNum) || chunkNum < 0) {
      throw new BadRequestError('Invalid chunk number');
    }

    // Find upload session
    const session = await UploadSession.findOne({ sessionId });

    if (!session) {
      throw new NotFoundError('Upload session not found');
    }

    // Verify session belongs to user
    if (session.userId !== (req as any).user.userId) {
      throw new BadRequestError('Unauthorized access to upload session');
    }

    // Check if session expired
    if (new Date() > session.expiresAt) {
      throw new BadRequestError('Upload session has expired');
    }

    // Validate chunk number sequence
    if (chunkNum !== session.uploadedChunks) {
      throw new BadRequestError(
        `Expected chunk ${session.uploadedChunks}, but received ${chunkNum}`
      );
    }

    // Save chunk to disk
    const chunkPath = path.join(session.sessionPath, `chunk-${chunkNum}`);
    await fs.writeFile(chunkPath, file.buffer);

    // Update session
    session.uploadedChunks += 1;
    session.status = 'uploading';
    await session.save();

    logger.info('Chunk uploaded', {
      sessionId,
      chunkNumber: chunkNum,
      progress: `${session.uploadedChunks}/${session.totalChunks}`
    });

    res.status(200).json({
      success: true,
      message: 'Chunk uploaded successfully',
      data: {
        chunkNumber: chunkNum,
        uploadedChunks: session.uploadedChunks,
        totalChunks: session.totalChunks,
        nextChunkExpected: session.uploadedChunks,
        isComplete: session.uploadedChunks === session.totalChunks
      }
    });
  } catch (err) {
    next(err);
  }
};

export const completeUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) throw new BadRequestError('Session ID is required');

    const session = await UploadSession.findOne({ sessionId });
    if (!session) throw new NotFoundError('Upload session not found');

    if (session.userId !== (req as any).user.userId) {
      throw new BadRequestError('Unauthorized access');
    }

    if (session.uploadedChunks !== session.totalChunks) {
      throw new BadRequestError(`Incomplete: ${session.uploadedChunks}/${session.totalChunks} chunks`);
    }

    const finalFilePath = path.join(session.sessionPath, 'final-file');

    /**
     * ROBUST MERGE LOGIC
     * We use appendFile to ensure chunks are written in exact order.
     * This is safer for data integrity than an unmanaged write stream.
     */
    for (let i = 0; i < session.totalChunks; i++) {
      const chunkPath = path.join(session.sessionPath, `chunk-${i}`);
      const chunkData = await fs.readFile(chunkPath);
      
      await fs.appendFile(finalFilePath, chunkData);
      
      // Delete chunk immediately after append to keep disk usage low
      await fs.unlink(chunkPath);
    }

    /**
     * INTEGRITY CHECK
     * Recalculate SHA-256 hash of the merged file on disk
     */
    const actualHash = await calculateFileHash(finalFilePath);
    
    if (actualHash !== session.fileHash) {
      // Clean up the failed merge
      if (fsSync.existsSync(finalFilePath)) await fs.unlink(finalFilePath);
      throw new ValidationError('File integrity check failed: Hash mismatch');
    }

    const fileId = uuidv4();
    const permanentPath = path.join(__dirname, '../../uploads/files', fileId);
    
    await ensureDirectory(path.dirname(permanentPath));
    await fs.rename(finalFilePath, permanentPath);

    session.status = 'completed';
    await session.save();

    // Final Cleanup of the session directory
    await fs.rmdir(session.sessionPath, { recursive: true });

    res.status(200).json({
      success: true,
      data: { fileId, fileName: session.fileName, hash: actualHash }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get upload session status
 * @route   GET /api/files/upload-status/:sessionId
 * @access  Private
 */
export const getUploadStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await UploadSession.findOne({ sessionId });

    if (!session) {
      throw new NotFoundError('Upload session not found');
    }

    if (session.userId !== (req as any).user.userId) {
      throw new BadRequestError('Unauthorized access to upload session');
    }

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        fileName: session.fileName,
        status: session.status,
        uploadedChunks: session.uploadedChunks,
        totalChunks: session.totalChunks,
        progress: Math.round((session.uploadedChunks / session.totalChunks) * 100),
        expiresAt: session.expiresAt
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Cancel upload session
 * @route   DELETE /api/files/upload-cancel/:sessionId
 * @access  Private
 */
export const cancelUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await UploadSession.findOne({ sessionId });

    if (!session) {
      throw new NotFoundError('Upload session not found');
    }

    if (session.userId !== (req as any).user.userId) {
      throw new BadRequestError('Unauthorized access to upload session');
    }

    // Delete session files
    try {
      await fs.rmdir(session.sessionPath, { recursive: true });
    } catch (err) {
      logger.warn('Failed to delete session files', { sessionId, error: err });
    }

    // Update session status
    session.status = 'failed';
    await session.save();

    logger.info('Upload cancelled', { sessionId });

    res.status(200).json({
      success: true,
      message: 'Upload session cancelled'
    });
  } catch (err) {
    next(err);
  }
};