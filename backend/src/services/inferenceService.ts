import axios from 'axios';
import FormData from 'form-data';
import { logger } from '../utils/logger';
import { saveSaliencyMap } from '../utils/saliencyStorage';

/**
 * ====================================================================
 * INFERENCE SERVICE — Synchronous FastAPI ML Proxy
 * ====================================================================
 * 
 * Acts as the bridge between the Express API and the local FastAPI
 * skin cancer triage ML service. Sends a dermoscopy image + patient
 * metadata, awaits the synchronous response, and extracts the
 * saliency map to a static file.
 */

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
const PREDICT_ENDPOINT = `${FASTAPI_URL}/api/v1/predict`;

// ==================== REQUEST / RESPONSE TYPES ====================

export interface InferenceRequest {
  imageBuffer: Buffer;
  fileName: string;
  metadata: {
    age: number;
    sex: string;
    anatomical_site: string;
  };
}

/** Raw JSON response from FastAPI /api/v1/predict */
export interface FastAPIResponse {
  request_id: string;
  decision: 'ACCEPT' | 'DEFER_TO_DOCTOR' | 'REJECT_QUALITY' | 'REJECT_OOD';
  prediction_set: string[];
  predicted_class?: string;
  confidence: number;
  entropy: number;
  ood_similarity: number;
  coverage_guarantee: number;
  blur_variance: number;
  saliency_map_b64: string;
  inference_time_ms: number;
}

/** Processed result for storage in MongoDB (camelCase, URL not base64) */
export interface InferenceResult {
  requestId: string;
  decision: string;
  predictionSet: string[];
  predictedClass?: string;
  confidence: number;
  entropy: number;
  oodSimilarity: number;
  coverageGuarantee: number;
  blurVariance: number;
  saliencyMapUrl: string;
  inferenceTimeMs: number;
}

// ==================== MAIN FUNCTION ====================

/**
 * Sends a dermoscopy image + patient metadata to the FastAPI ML service,
 * extracts the saliency map to disk, and returns a clean result object.
 */
export async function requestPrediction(
  request: InferenceRequest
): Promise<InferenceResult> {
  const { imageBuffer, fileName, metadata } = request;

  // Build the strict 2-field FormData as required by FastAPI
  const formData = new FormData();
  formData.append('image', imageBuffer, { filename: fileName });
  formData.append('metadata', JSON.stringify(metadata));

  logger.info(`[InferenceService] Sending prediction request to ${PREDICT_ENDPOINT}`);
  logger.info(`[InferenceService] Metadata: age=${metadata.age}, sex=${metadata.sex}, site=${metadata.anatomical_site}`);

  try {
    const response = await axios.post<FastAPIResponse>(PREDICT_ENDPOINT, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 60000, // 60s timeout for ML inference
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const data = response.data;

    logger.info(`[InferenceService] Prediction received: decision=${data.decision}, confidence=${data.confidence}`);

    // Extract saliency map from base64 to filesystem
    let saliencyMapUrl = '';
    if (data.saliency_map_b64) {
      saliencyMapUrl = await saveSaliencyMap(data.saliency_map_b64);
      logger.info(`[InferenceService] Saliency map saved: ${saliencyMapUrl}`);
    }

    // Map snake_case FastAPI response to camelCase for MongoDB
    return {
      requestId: data.request_id,
      decision: data.decision,
      predictionSet: data.prediction_set || [],
      predictedClass: data.predicted_class,
      confidence: data.confidence,
      entropy: data.entropy,
      oodSimilarity: data.ood_similarity,
      coverageGuarantee: data.coverage_guarantee,
      blurVariance: data.blur_variance,
      saliencyMapUrl,
      inferenceTimeMs: data.inference_time_ms,
    };
  } catch (error: any) {
    // Handle FastAPI errors
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail || error.response.data?.message || 'Unknown ML service error';
      logger.error(`[InferenceService] FastAPI returned ${status}: ${detail}`);
      throw new Error(`ML service error (${status}): ${detail}`);
    }

    if (error.code === 'ECONNREFUSED') {
      logger.error('[InferenceService] Cannot connect to FastAPI ML service. Is it running?');
      throw new Error('ML service is unavailable. Please ensure the FastAPI service is running.');
    }

    if (error.code === 'ECONNABORTED') {
      logger.error('[InferenceService] FastAPI request timed out');
      throw new Error('ML service request timed out. The model may be overloaded.');
    }

    logger.error(`[InferenceService] Unexpected error: ${error.message}`);
    throw new Error(`Inference failed: ${error.message}`);
  }
}
