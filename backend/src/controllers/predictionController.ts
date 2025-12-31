import { Request, Response, NextFunction } from 'express';
import Prediction from '../models/Prediction';
import Patient from '../models/Patient';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import { requestMLPrediction, MLPredictionRequest, MLPredictionResponse } from '../services/mlService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Helper: Generate prediction ID
 */
const generatePredictionId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await Prediction.countDocuments({});
  const sequence = String(count + 1).padStart(4, '0');
  return `PRED-${year}-${sequence}`;
};

/**
 * @desc    Create new prediction request
 * @route   POST /api/predictions
 * @access  Private (Doctor, Admin)
 * 
 * Request body:
 * {
 *   patientId: "674e...",
 *   files: {
 *     pathologyImages: ["fileId1", "fileId2"],
 *     radiologyScans: ["fileId3"],
 *     clinicalData: "fileId4",
 *     genomicData: "fileId5"
 *   }
 * }
 */
export const createPrediction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId, files } = req.body;
    
    if (!patientId || !files) {
      throw new BadRequestError('Patient ID and files are required');
    }
    
    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient || !patient.isActive) {
      throw new NotFoundError('Patient not found');
    }
    
    // Check authorization (only assigned doctor or admin can create prediction)
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    
    if (userRole !== 'admin' && patient.assignedDoctor?.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to create predictions for this patient');
    }
    
    // Validate at least one file type provided
    if (!files.pathologyImages && !files.radiologyScans && !files.clinicalData && !files.genomicData) {
      throw new BadRequestError('At least one file type must be provided');
    }
    
    // Generate prediction ID
    const predictionId = await generatePredictionId();
    
    // ============================================================
    // PREPARE FILES FOR ML BACKEND
    // ============================================================
    // TODO: When integrating real file storage (S3, etc.):
    // 1. Convert fileIds to actual file paths/URLs
    // 2. Ensure ML backend can access these files
    // 3. For cloud storage, generate pre-signed URLs with expiry
    
    const uploadedFiles: any = {};
    
    if (files.pathologyImages) {
      uploadedFiles.pathologyImages = files.pathologyImages.map((fileId: string) => ({
        fileId,
        fileName: `pathology_${fileId}`,
        fileSize: 0, // TODO: Get from file metadata
        uploadedAt: new Date()
      }));
    }
    
    if (files.radiologyScans) {
      uploadedFiles.radiologyScans = files.radiologyScans.map((fileId: string) => ({
        fileId,
        fileName: `radiology_${fileId}`,
        fileSize: 0,
        uploadedAt: new Date()
      }));
    }
    
    if (files.clinicalData) {
      uploadedFiles.clinicalData = {
        fileId: files.clinicalData,
        fileName: `clinical_${files.clinicalData}`,
        uploadedAt: new Date()
      };
    }
    
    if (files.genomicData) {
      uploadedFiles.genomicData = {
        fileId: files.genomicData,
        fileName: `genomic_${files.genomicData}`,
        uploadedAt: new Date()
      };
    }
    
    // Create prediction record in database
    const prediction = await Prediction.create({
      predictionId,
      patient: patientId,
      requestedBy: userId,
      status: 'pending',
      uploadedFiles
    });
    
    logger.info('Prediction created', {
      predictionId,
      patientId,
      userId
    });
    
    // ============================================================
    // SEND TO ML BACKEND (Async Processing)
    // ============================================================
    
    // Prepare ML request payload
    const mlRequest: MLPredictionRequest = {
      predictionId: prediction._id.toString(),
      patientId: patient._id.toString(),
      
      // ========================================================
      // REAL ML INTEGRATION: File paths/URLs
      // ========================================================
      // When you integrate your Python backend:
      // 1. Replace these mock paths with real file paths
      // 2. If using cloud storage (S3), provide pre-signed URLs
      // 3. Ensure ML backend can download/access these files
      files: {
        pathologyImages: uploadedFiles.pathologyImages?.map((f: any) => 
          `/uploads/files/${f.fileId}` // TODO: Use real file paths
        ),
        radiologyScans: uploadedFiles.radiologyScans?.map((f: any) => 
          `/uploads/files/${f.fileId}`
        ),
        clinicalData: uploadedFiles.clinicalData ? 
          `/uploads/files/${uploadedFiles.clinicalData.fileId}` : undefined,
        genomicData: uploadedFiles.genomicData ? 
          `/uploads/files/${uploadedFiles.genomicData.fileId}` : undefined
      },
      
      // Clinical context to help ML model
      clinicalContext: {
        age: patient.personalInfo.age, // From virtual field
        gender: patient.personalInfo.gender,
        smokingStatus: patient.medicalInfo.smokingStatus,
        smokingPackYears: patient.medicalInfo.smokingPackYears,
        comorbidities: patient.medicalInfo.comorbidities
      },
      
      // ========================================================
      // WEBHOOK URL: Where ML backend sends results
      // ========================================================
      // Your Python backend will POST to this URL when done
      webhookUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/predictions/webhook/${prediction._id}`
    };
    
    // Send to ML backend (async - don't await)
    processMLPrediction(prediction._id.toString(), mlRequest)
      .catch(error => {
        logger.error('ML prediction processing failed', {
          predictionId: prediction._id,
          error: error.message
        });
      });
    
    // Return immediately to user (prediction will be processed in background)
    res.status(201).json({
      success: true,
      message: 'Prediction request created. Processing will begin shortly.',
      data: {
        predictionId: prediction.predictionId,
        _id: prediction._id,
        status: prediction.status,
        patient: patient._id,
        createdAt: prediction.createdAt
      }
    });
    
  } catch (err) {
    next(err);
  }
};

/**
 * Background processor for ML predictions
 * This runs asynchronously after response is sent to user
 */
const processMLPrediction = async (
  predictionId: string,
  mlRequest: MLPredictionRequest
): Promise<void> => {
  try {
    // Update status to processing
    await Prediction.findByIdAndUpdate(predictionId, {
      status: 'processing'
    });
    
    logger.info('Starting ML prediction processing', { predictionId });
    
    // ========================================================
    // CALL ML BACKEND
    // ========================================================
    const startTime = Date.now();
    const mlResponse = await requestMLPrediction(mlRequest);
    const processingTime = (Date.now() - startTime) / 1000; // seconds
    
    // ========================================================
    // STORE RESULTS IN DATABASE
    // ========================================================
    // If using MOCK ML: results are returned immediately
    // If using REAL ML: this might be called from webhook instead
    
    if ('results' in mlResponse) {
      // Mock ML returned results immediately
      await Prediction.findByIdAndUpdate(predictionId, {
        status: 'completed',
        results: mlResponse.results,
        processingTime: mlResponse.processingTime || processingTime,
        completedAt: new Date()
      });
      
      logger.info('Prediction completed successfully', {
        predictionId,
        stage: mlResponse.results.tnmStaging.overallStage,
        confidence: mlResponse.results.tnmStaging.confidence
      });
    } else {
      // Real ML accepted job, will call webhook later
      logger.info('Prediction job submitted to ML backend', {
        predictionId,
        jobId: mlResponse.jobId
      });
    }
    
  } catch (error: any) {
    logger.error('ML prediction failed', {
      predictionId,
      error: error.message
    });
    
    // Update prediction with error
    await Prediction.findByIdAndUpdate(predictionId, {
      status: 'failed',
      errorMessage: error.message
    });
  }
};

/**
 * GET /api/predictions
 * 
 * RBAC:
 * - Admin/Researcher: See all
 * - Doctor: Only predictions they requested OR for their patients
 */
export const getPredictions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId, status, page = 1, limit = 10 } = req.query;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    
    const query: any = {};
    
    // Filter by patient
    if (patientId) {
      query.patient = patientId;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // RBAC: Row-Level Security
    if (userRole === 'doctor') {
      // Find patients assigned to this doctor
      const assignedPatients = await Patient.find({ 
        assignedDoctor: userId 
      }).select('_id');
      
      const patientIds = assignedPatients.map(p => p._id);
      
      // Doctor sees predictions for their patients OR predictions they requested
      query.$or = [
        { patient: { $in: patientIds } },
        { requestedBy: userId }
      ];
      
      logger.info('Doctor filtered prediction query', { doctorId: userId, patientCount: patientIds.length });
    }
    
    const predictions = await Prediction.find(query)
      .populate('patient', 'patientId personalInfo')
      .populate('requestedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);
    
    const total = await Prediction.countDocuments(query);

    logger.info('Prediction list accessed', {
      userId,
      userRole,
      count: predictions.length
    });
    
    res.json({
      success: true,
      data: predictions,
      meta: { total, page: +page, limit: +limit }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/predictions/:id
 * 
 * Authorization:
 * - Admin/Researcher: Access any
 * - Doctor: Only if they requested it OR patient is assigned to them
 */
export const getPredictionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    
    const prediction = await Prediction.findById(req.params.id)
      .populate('patient')
      .populate('requestedBy', 'firstName lastName email');
    
    if (!prediction) {
      throw new NotFoundError('Prediction not found');
    }
    
    // RBAC: Authorization
    if (userRole === 'doctor') {
      const patient = prediction.patient as any;
      const isAssignedDoctor = patient.assignedDoctor?.toString() === userId;
      const isRequester = prediction.requestedBy.toString() === userId;
      
      if (!isAssignedDoctor && !isRequester) {
        logger.warn('Unauthorized prediction access attempt', {
          doctorId: userId,
          predictionId: prediction._id
        });
        throw new ForbiddenError('You are not authorized to view this prediction');
      }
    }

    logger.info('Prediction detail accessed', {
      userId,
      userRole,
      predictionId: prediction._id
    });
    
    res.json({
      success: true,
      data: prediction
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete prediction (soft delete)
 * @route   DELETE /api/predictions/:id
 * @access  Private (Admin only)
 */
export const deletePrediction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const prediction = await Prediction.findById(req.params.id);
    
    if (!prediction) {
      throw new NotFoundError('Prediction not found');
    }
    
    // For now, just mark as failed (could add 'deleted' status)
    prediction.status = 'failed';
    prediction.errorMessage = 'Deleted by admin';
    await prediction.save();
    
    logger.info('Prediction deleted', {
      predictionId: prediction._id,
      deletedBy: (req as any).user.userId
    });
    
    res.json({
      success: true,
      message: 'Prediction deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================================
 * WEBHOOK ENDPOINT: Receives results from Python ML backend
 * ============================================================
 * 
 * @desc    Webhook for ML backend to send results
 * @route   POST /api/predictions/webhook/:id
 * @access  Public (but should validate ML_API_KEY)
 * 
 * Your Python backend will call this endpoint:
 * POST http://your-api.com/api/predictions/webhook/674e5a1234...
 * Headers: { 'X-API-Key': ML_API_KEY }
 * Body: MLPredictionResponse
 */
export const handleMLWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const predictionId = req.params.id;
    const mlResponse: MLPredictionResponse = req.body;
    
    // ========================================================
    // SECURITY: Validate webhook came from your ML backend
    // ========================================================
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.ML_API_KEY) {
      throw new ForbiddenError('Invalid API key');
    }
    
    logger.info('ML webhook received', {
      predictionId,
      success: mlResponse.success
    });
    
    // Find prediction
    const prediction = await Prediction.findById(predictionId);
    if (!prediction) {
      throw new NotFoundError('Prediction not found');
    }
    
    // Update with ML results
    if (mlResponse.success) {
      prediction.status = 'completed';
      prediction.results = mlResponse.results as any;// this line need to be corrected - no 'as any' in original code 
      prediction.processingTime = mlResponse.processingTime;
      prediction.completedAt = new Date();
      
      logger.info('Prediction completed via webhook', {
        predictionId,
        stage: mlResponse.results.tnmStaging.overallStage
      });
    } else {
      prediction.status = 'failed';
      prediction.errorMessage = mlResponse.message || 'ML processing failed';
      
      logger.error('Prediction failed via webhook', {
        predictionId,
        error: mlResponse.message
      });
    }
    
    await prediction.save();
    
    // ========================================================
    // OPTIONAL: Send notification to user
    // ========================================================
    // TODO: Implement email/push notification
    // notifyUser(prediction.requestedBy, prediction);
    
    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
    
  } catch (err) {
    next(err);
  }
};
