export interface Prediction {
  _id: string;
  predictionId: string;
  patient: string | Patient;
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
    // NEW: RNA-Seq Data
    rnaSeqData?: {
      fileId: string;
      fileName: string;
      uploadedAt: string;
    };
    // NEW: Mutation Data
    mutationData?: {
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
    // UPDATED: Separate RNA-Seq and Mutation importance
    featureImportance?: {
      pathology: number;
      radiology: number;
      clinical: number;
      rnaSeq: number;
      mutation: number;
    };
  };
  processingTime?: number;
  errorMessage?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// UPDATED: New request shape
export interface CreatePredictionRequest {
  patientId: string;
  files: {
    pathologyImages?: string[];
    radiologyScans?: string[];
    clinicalData?: string;
    rnaSeqData?: string;      // NEW
    mutationData?: string;    // NEW
  };
}

import { User } from './auth';
import { Patient } from './patient';
