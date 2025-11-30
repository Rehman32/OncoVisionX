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
    const hash = crypto.createHash('sha256');
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
export const startUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract data from request
    const {
      fileName,
      fileType,
      totalSize,
      fileHash,
      category // 'pathology', 'radiology', 'clinical', 'genomic'
    } = req.body;

    // Validate required fields
    if (!fileName || !fileType || !totalSize || !fileHash || !category) {
      throw new BadRequestError('Missing required fields: fileName, fileType, totalSize, fileHash, category');
    }

    // Validate file type
    if (!validateFileType(fileType, category)) {
      throw new ValidationError(`File type ${fileType} not allowed for ${category} uploads`);
    }

    // Validate file size
    if (totalSize > MAX_FILE_SIZE) {
      throw new ValidationError(`File size ${totalSize} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`);
    }

    if (totalSize <= 0) {
      throw new ValidationError('File size must be greater than 0');
    }

    // Generate unique session ID
    const sessionId = uuidv4();

    // Calculate total chunks needed
    const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

    // Create session directory
    const sessionPath = path.join(UPLOAD_BASE_PATH, sessionId);
    await ensureDirectory(sessionPath);

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SESSION_EXPIRY_HOURS);

    // Create upload session in database
    const uploadSession = await UploadSession.create({
      sessionId,
      userId: (req as any).user.userId,
      fileName,
      fileType,
      totalSize,
      totalChunks,
      uploadedChunks: 0,
      fileHash,
      status: 'pending',
      sessionPath,
      expiresAt
    });

    logger.info('Upload session started', {
      sessionId,
      userId: (req as any).user.userId,
      fileName,
      totalSize,
      totalChunks
    });

    res.status(201).json({
      success: true,
      message: 'Upload session created',
      data: {
        sessionId: uploadSession.sessionId,
        totalChunks,
        chunkSize: CHUNK_SIZE,
        uploadedChunks: 0,
        expiresAt
      }
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
    const { sessionId, chunkNumber } = req.body;
    const file = req.file; // From multer middleware

    // Validate inputs
    if (!sessionId || chunkNumber === undefined || !file) {
      throw new BadRequestError('Missing required fields: sessionId, chunkNumber, or file');
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

/**
 * @desc    Complete upload by merging chunks
 * @route   POST /api/files/upload-complete
 * @access  Private
 */
export const completeUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      throw new BadRequestError('Session ID is required');
    }

    // Find session
    const session = await UploadSession.findOne({ sessionId });

    if (!session) {
      throw new NotFoundError('Upload session not found');
    }

    // Verify ownership
    if (session.userId !== (req as any).user.userId) {
      throw new BadRequestError('Unauthorized access to upload session');
    }

    // Verify all chunks uploaded
    if (session.uploadedChunks !== session.totalChunks) {
      throw new BadRequestError(
        `Upload incomplete: ${session.uploadedChunks}/${session.totalChunks} chunks uploaded`
      );
    }

    // Merge chunks into final file
    const finalFilePath = path.join(session.sessionPath, 'final-file');
    const writeStream = fsSync.createWriteStream(finalFilePath);

    for (let i = 0; i < session.totalChunks; i++) {
      const chunkPath = path.join(session.sessionPath, `chunk-${i}`);
      const chunkData = await fs.readFile(chunkPath);
      writeStream.write(chunkData);
      
      // Delete chunk after merging (save space)
      await fs.unlink(chunkPath);
    }

    writeStream.end();

    // Wait for write to complete
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Verify file hash
    const actualHash = await calculateFileHash(finalFilePath);
    
    if (actualHash !== session.fileHash) {
      throw new ValidationError('File hash mismatch - file may be corrupted');
    }

    // Update session status
    session.status = 'completed';
    await session.save();

    // Generate unique file ID
    const fileId = uuidv4();

    // Move file to permanent storage
    const permanentPath = path.join(__dirname, '../../uploads/files', fileId);
    await ensureDirectory(path.dirname(permanentPath));
    await fs.rename(finalFilePath, permanentPath);

    logger.info('Upload completed', {
      sessionId,
      fileId,
      fileName: session.fileName,
      fileSize: session.totalSize
    });

    res.status(200).json({
      success: true,
      message: 'Upload completed successfully',
      data: {
        fileId,
        fileName: session.fileName,
        fileType: session.fileType,
        fileSize: session.totalSize,
        filePath: permanentPath,
        hash: actualHash
      }
    });

    // Cleanup session folder (keep database record for audit)
    await fs.rmdir(session.sessionPath, { recursive: true });

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