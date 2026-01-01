import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * ====================================================================
 * ML SERVICE INTEGRATION LAYER
 * ====================================================================
 * 
 * This service acts as the bridge between our Express API and our
 * Python ML backend (CancerVision360 model).
 * 
 * CURRENT STATE: Uses mock responses for development
 * PRODUCTION STATE: Will call our real Python FastAPI/Flask backend
 * 
 * TO INTEGRATE our REAL ML BACKEND:
 * 1. We wil Deploy our Python ML API on a server/container
 * 2. Set ML_API_URL in .env to our ML backend URL
 * 3. Implement the webhook endpoint (see webhookController.ts)
 * 4. Replace mock responses with real axios calls
 * 5. Ensure our ML backend returns the exact response format defined below
 */

// ==================== CONFIGURATION ====================

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000'; // our Python backend URL
const ML_API_KEY = process.env.ML_API_KEY || 'dev-key'; // Authentication for ML backend
const USE_MOCK_ML = process.env.USE_MOCK_ML === 'true' || true; // Set to false when real ML ready

// ==================== TYPE DEFINITIONS ====================

/**
 * Payload sent to ML backend for prediction
 * This is the CONTRACT between our Express API and Python ML API
 */
export interface MLPredictionRequest {
  predictionId: string;
  patientId: string;
  
  // File paths that ML backend will read
  files: {
    pathologyImages?: string[]; // Array of WSI file paths
    radiologyScans?: string[];  // Array of DICOM file paths
    clinicalData?: string;       // Path to clinical CSV/JSON
    rnaSeqData?: string;      // Psth RNA sequencing data
    mutationData?: string;        // Path to mutation data
  };
  
  // Patient clinical context (may help ML model)
  clinicalContext?: {
    age?: number;
    gender?: string;
    smokingStatus?: string;
    smokingPackYears?: number;
    comorbidities?: string[];
  };
  
  // Webhook URL for ML backend to call when done
  webhookUrl: string;
}

/**
 * Response format our ML backend MUST return
 * This is what our Python FastAPI should send back
 */
export interface MLPredictionResponse {
  success: boolean;
  predictionId: string;
  
  // TNM Staging Results (our model's main output)
  results: {
    tnmStaging: {
      tStage: string;           // e.g., "T2a"
      nStage: string;           // e.g., "N1"
      mStage: string;           // e.g., "M0"
      overallStage: string;     // e.g., "IIB"
      confidence: number;       // 0.0 to 1.0
    };
    
    // Survival predictions 
    survivalPrediction?: {
      oneYearSurvival: number;
      threeYearSurvival: number;
      fiveYearSurvival: number;
    };
    
    // Attention maps (optional visualization URLs)
    attentionMaps?: {
      pathologyMapUrl?: string;
      radiologyMapUrl?: string;
    };
    
    // Feature importance (which modality contributed most)
    featureImportance?: {
      pathology: number;
      radiology: number;
      clinical: number;
      rnaSeq: number;      
      mutation: number; 
    };
  };
  
  processingTime: number; // Seconds taken by ML inference
  message?: string;
}

/**
 * Status check response from ML backend
 */
export interface MLStatusResponse {
  predictionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100 percentage
  message?: string;
}

// ==================== MOCK ML SERVICE (Development) ====================

/**
 * Mock ML prediction - simulates our future Python backend
 * Returns fake but realistic TNM staging data
 * 
 * DELETE THIS FUNCTION when integrating real ML backend
 */
const mockMLPrediction = async (
  request: MLPredictionRequest
): Promise<MLPredictionResponse> => {
  logger.info('🧪 MOCK ML: Simulating prediction', { predictionId: request.predictionId });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const tStages = ['T1a', 'T1b', 'T2a', 'T2b', 'T3', 'T4'];
  const nStages = ['N0', 'N1', 'N2', 'N3'];
  const mStages = ['M0', 'M1a'];
  const overallStages = ['IA1', 'IA2', 'IB', 'IIA', 'IIB', 'IIIA', 'IIIB', 'IVA'];
  
  const tStage = tStages[Math.floor(Math.random() * tStages.length)];
  const nStage = nStages[Math.floor(Math.random() * nStages.length)];
  const mStage = mStages[Math.floor(Math.random() * mStages.length)];
  const overallStage = overallStages[Math.floor(Math.random() * overallStages.length)];
  
  // Calculate feature importance dynamically based on what was uploaded
  const hasRnaSeq = !!request.files.rnaSeqData;
  const hasMutation = !!request.files.mutationData;
  
  return {
    success: true,
    predictionId: request.predictionId,
    results: {
      tnmStaging: {
        tStage,
        nStage,
        mStage,
        overallStage,
        confidence: 0.85 + Math.random() * 0.1
      },
      survivalPrediction: {
        oneYearSurvival: 0.7 + Math.random() * 0.2,
        threeYearSurvival: 0.5 + Math.random() * 0.2,
        fiveYearSurvival: 0.3 + Math.random() * 0.2
      },
      // UPDATED: Dynamic feature importance
      featureImportance: {
        pathology: 0.35,
        radiology: 0.25,
        clinical: 0.15,
        rnaSeq: hasRnaSeq ? 0.15 : 0,
        mutation: hasMutation ? 0.10 : 0
      }
    },
    processingTime: 45.3,
    message: `Mock prediction completed (RNA-Seq: ${hasRnaSeq}, Mutations: ${hasMutation})`
  };
};

// ==================== REAL ML SERVICE (Production) ====================

/**
 * Send prediction request to REAL Python ML backend
 * 
 * UNCOMMENT AND USE THIS when our ML backend is ready
 * 
 * our Python backend should expose:
 * POST /predict
 * Headers: { 'X-API-Key': ML_API_KEY }
 * Body: MLPredictionRequest (JSON)
 * Returns: { jobId: string, status: 'pending' }
 */
const realMLPrediction = async (
  request: MLPredictionRequest
): Promise<{ jobId: string; status: string }> => {
  try {
    logger.info('🚀 Sending prediction to REAL ML backend', {
      url: ML_API_URL,
      predictionId: request.predictionId
    });
    
    // ============================================================
    // REAL ML INTEGRATION: Uncomment when Python backend ready
    // ============================================================
    /*
    const response = await axios.post(
      `${ML_API_URL}/predict`,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': ML_API_KEY
        },
        timeout: 30000 // 30 second timeout for initial request
      }
    );
    
    return response.data;
    */
    
    // Temporary: throw error if accidentally called without ML backend
    throw new Error('Real ML backend not configured. Set USE_MOCK_ML=true or deploy ML backend');
    
  } catch (error: any) {
    logger.error('❌ ML backend request failed', {
      error: error.message,
      predictionId: request.predictionId
    });
    throw error;
  }
};

/**
 * Check status of ML prediction job
 * 
 * our Python backend should expose:
 * GET /status/:predictionId
 * Returns: MLStatusResponse
 */
export const checkMLStatus = async (predictionId: string): Promise<MLStatusResponse> => {
  if (USE_MOCK_ML) {
    // Mock: always return completed immediately
    return {
      predictionId,
      status: 'completed',
      progress: 100,
      message: 'Mock prediction completed'
    };
  }
  
  // ============================================================
  // REAL ML INTEGRATION: Uncomment when Python backend ready
  // ============================================================
  /*
  try {
    const response = await axios.get(
      `${ML_API_URL}/status/${predictionId}`,
      {
        headers: { 'X-API-Key': ML_API_KEY },
        timeout: 10000
      }
    );
    
    return response.data;
  } catch (error: any) {
    logger.error('❌ ML status check failed', { error: error.message, predictionId });
    throw error;
  }
  */
  
  throw new Error('Real ML backend not configured');
};

// ==================== PUBLIC API ====================

/**
 * Main function to request ML prediction
 * Automatically uses mock or real ML based on USE_MOCK_ML flag
 * 
 * Call this from our prediction controller
 */
export const requestMLPrediction = async (
  request: MLPredictionRequest
): Promise<MLPredictionResponse | { jobId: string; status: string }> => {
  if (USE_MOCK_ML) {
    logger.info('Using MOCK ML service (development mode)');
    return await mockMLPrediction(request);
  } else {
    logger.info('Using REAL ML service (production mode)');
    return await realMLPrediction(request);
  }
};

/**
 * Webhook handler for when ML backend completes prediction
 * our Python backend will POST to /api/predictions/webhook/:predictionId
 * 
 * Body will contain: MLPredictionResponse
 */
export const handleMLWebhook = async (
  predictionId: string,
  mlResponse: MLPredictionResponse
): Promise<void> => {
  // This will be implemented in prediction controller
  logger.info('📥 ML webhook received', { predictionId });
  
  // Validation happens in controller
  // Just log here for now
};
