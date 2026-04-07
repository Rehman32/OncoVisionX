import { Request, Response, NextFunction } from 'express';
import Prediction from '../models/Prediction';
import Patient from '../models/Patient';
import { requestPrediction } from '../services/inferenceService';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError, NotFoundError } from '../utils/errors';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads', 'dermoscopy');

/**
 * Ensures the dermoscopy upload directory exists.
 */
function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * @route   POST /api/predictions
 * @desc    Create a new skin cancer triage prediction
 * @access  Admin, Doctor
 * 
 * Accepts multipart/form-data with:
 *   - image: dermoscopy image file
 *   - patientId: MongoDB ObjectId of the patient
 */
export const createPrediction = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { patientId } = req.body;
    const file = req.file;

    // Validate inputs
    if (!file) {
      throw new BadRequestError('A dermoscopy image is required');
    }
    if (!patientId) {
      throw new BadRequestError('Patient ID is required');
    }

    // 1. Fetch patient to get metadata
    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }
    if (!patient.isActive) {
      throw new BadRequestError('Cannot create prediction for an inactive patient');
    }

    // 2. Save the uploaded image to disk
    ensureUploadDir();
    const ext = path.extname(file.originalname) || '.jpg';
    const savedFileName = `${uuidv4()}${ext}`;
    const savedFilePath = path.join(UPLOADS_DIR, savedFileName);
    await fs.promises.writeFile(savedFilePath, file.buffer);

    // 3. Generate prediction ID
    const predictionId = `PRED-${uuidv4().slice(0, 8).toUpperCase()}`;

    try {
      // 4. Call FastAPI ML service synchronously
      const inferenceResult = await requestPrediction({
        imageBuffer: file.buffer,
        fileName: file.originalname,
        metadata: {
          age: patient.age,  // virtual computed from DOB
          sex: patient.sex,
          anatomical_site: patient.anatomicalSite,
        },
      });

      // 5. Save prediction to MongoDB
      const prediction = await Prediction.create({
        predictionId,
        patient: patient._id,
        requestedBy: req.user!.userId,
        imageFileId: savedFilePath,
        originalFileName: file.originalname,
        requestId: inferenceResult.requestId,
        decision: inferenceResult.decision,
        predictionSet: inferenceResult.predictionSet,
        predictedClass: inferenceResult.predictedClass,
        confidence: inferenceResult.confidence,
        entropy: inferenceResult.entropy,
        oodSimilarity: inferenceResult.oodSimilarity,
        coverageGuarantee: inferenceResult.coverageGuarantee,
        blurVariance: inferenceResult.blurVariance,
        saliencyMapUrl: inferenceResult.saliencyMapUrl,
        referenceImageUrl: `/static/uploads/${savedFileName}`,
        inferenceTimeMs: inferenceResult.inferenceTimeMs,
        status: 'completed',
      });

      // 6. Populate references and return
      const populated = await Prediction.findById(prediction._id)
        .populate('patient', 'patientId firstName lastName sex dateOfBirth anatomicalSite')
        .populate('requestedBy', 'firstName lastName email role');

      res.status(201).json({
        success: true,
        message: 'Prediction completed successfully',
        data: populated,
      });
    } catch (error: any) {
      // ML service failed — save as failed prediction
      await Prediction.create({
        predictionId,
        patient: patient._id,
        requestedBy: req.user!.userId,
        imageFileId: savedFilePath,
        originalFileName: file.originalname,
        status: 'failed',
        errorMessage: error.message,
      });

      res.status(502).json({
        success: false,
        message: `Prediction failed: ${error.message}`,
      });
    }
  }
);

/**
 * @route   GET /api/predictions
 * @desc    Get all predictions (with optional filters)
 * @access  Admin, Doctor, Researcher
 */
export const getPredictions = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      status,
      decision,
      patient: patientFilter,
    } = req.query;

    const query: any = {};

    // Role-based filtering: doctors see only their own predictions
    if (req.user!.role === 'doctor') {
      query.requestedBy = req.user!.userId;
    }

    if (status) query.status = status;
    if (decision) query.decision = decision;
    if (patientFilter) query.patient = patientFilter;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [predictions, total] = await Promise.all([
      Prediction.find(query)
        .populate('patient', 'patientId firstName lastName sex dateOfBirth anatomicalSite')
        .populate('requestedBy', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Prediction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: predictions,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  }
);

/**
 * @route   GET /api/predictions/:id
 * @desc    Get a single prediction by ID
 * @access  Admin, Doctor, Researcher
 */
export const getPredictionById = asyncHandler(
  async (req: Request, res: Response) => {
    const prediction = await Prediction.findById(req.params.id)
      .populate('patient', 'patientId firstName lastName sex dateOfBirth anatomicalSite')
      .populate('requestedBy', 'firstName lastName email role');

    if (!prediction) {
      throw new NotFoundError('Prediction not found');
    }

    // Role check: doctors can only view their own predictions
    if (
      req.user!.role === 'doctor' &&
      prediction.requestedBy?._id?.toString() !== req.user!.userId
    ) {
      throw new NotFoundError('Prediction not found');
    }

    res.status(200).json({
      success: true,
      data: prediction,
    });
  }
);

/**
 * @route   DELETE /api/predictions/:id
 * @desc    Delete a prediction (admin only)
 * @access  Admin
 */
export const deletePrediction = asyncHandler(
  async (req: Request, res: Response) => {
    const prediction = await Prediction.findById(req.params.id);

    if (!prediction) {
      throw new NotFoundError('Prediction not found');
    }

    // Clean up files
    try {
      if (prediction.imageFileId && fs.existsSync(prediction.imageFileId)) {
        await fs.promises.unlink(prediction.imageFileId);
      }
      if (prediction.saliencyMapUrl) {
        const saliencyPath = path.join(
          __dirname, '..', '..', prediction.saliencyMapUrl.replace('/static/', '')
        );
        if (fs.existsSync(saliencyPath)) {
          await fs.promises.unlink(saliencyPath);
        }
      }
    } catch {
      // Non-critical: log but don't fail
    }

    await prediction.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Prediction deleted successfully',
    });
  }
);
