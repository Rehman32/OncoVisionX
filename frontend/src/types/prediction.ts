export interface Prediction {
  _id: string;
  predictionId: string;
  patient: string | Patient; // Can be populated
  requestedBy: string | User;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedFiles: {
    pathologyImages?: Array<{
      fileId: string;
      fileName: string;
      fileSize: number;
      uploadedAt: string;
    }>;
    radiologyScans?: Array<{
      fileId: string;
      fileName: string;
      fileSize: number;
      uploadedAt: string;
    }>;
    clinicalData?: {
      fileId: string;
      fileName: string;
      uploadedAt: string;
    };
    genomicData?: {
      fileId: string;
      fileName: string;
      uploadedAt: string;
    };
  };
  results?: {
    tnmStaging: {
      tStage: string;
      nStage: string;
      mStage: string;
      overallStage: string;
      confidence: number;
    };
    survivalPrediction?: {
      oneYearSurvival: number;
      threeYearSurvival: number;
      fiveYearSurvival: number;
    };
    attentionMaps?: {
      pathologyMapUrl?: string;
      radiologyMapUrl?: string;
    };
    featureImportance?: {
      pathology: number;
      radiology: number;
      clinical: number;
      genomic: number;
    };
  };
  processingTime?: number;
  errorMessage?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePredictionRequest {
  patientId: string;
  files: {
    pathologyImages?: string[];
    radiologyScans?: string[];
    clinicalData?: string;
    genomicData?: string;
  };
}

import { User } from './auth';
import { Patient } from './patient';
