import { User } from './auth';
import { Patient } from './patient';

export type DecisionType = 'ACCEPT' | 'DEFER_TO_DOCTOR' | 'REJECT_QUALITY' | 'REJECT_OOD';

export interface Prediction {
  _id: string;
  predictionId: string;
  patient: string | Patient;
  requestedBy: string | User;
  
  // New backend maps synchronous API, removed status polling 'pending'|'processing'
  status: 'completed' | 'failed';
  
  // Uploaded image metadata (Optional if not always returned via the API listing payload)
  imageFileId?: string;
  originalFileName?: string;

  // New Triage Decision metrics
  decision: DecisionType;
  predictionSet: string[];
  predictedClass?: string;
  confidence: number;
  entropy: number;
  oodSimilarity: number;
  coverageGuarantee: number;
  blurVariance: number;
  saliencyMapUrl: string;
  referenceImageUrl?: string;
  inferenceTimeMs: number;
  
  errorMessage?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePredictionRequest {
  patientId: string;
  // NOTE: When actually transmitting to the backend, Axios consumes `FormData`. 
  // This type represents the logical argument sent to our hook.
  file: File;
}
