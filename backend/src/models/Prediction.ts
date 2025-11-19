import { Document, Schema, Types } from "mongoose";
import mongoose from "mongoose";

//tnm stages according AJJC 8 edition
export type TStage =
  | "T0"
  | "T1"
  | "T1a"
  | "T1b"
  | "T1c"
  | "T2"
  | "T2a"
  | "T2b"
  | "T3"
  | "T4";
export type NStage = "N0" | "N1" | "N2" | "N3";
export type MStage = "M0" | "M1" | "M1a" | "M1b" | "M1c";
export type OverallStage =
  | "IA1"
  | "IA2"
  | "IA3"
  | "IB"
  | "IIA"
  | "IIB"
  | "IIIA"
  | "IIIB"
  | "IIIC"
  | "IVA"
  | "IVB";

export interface IPrediction extends Document {
  _id: mongoose.Types.ObjectId;
  predictionId: String;
  patient: Types.ObjectId; //references to patient
  requestedBy: Types.ObjectId; //references to user
  status: "pending" | "processing" | "completed" | "failed";

  //uplaod files metadata(actual files will be GridFS or cloud )
  uploadedFiles: {
    pathologyImages?: Array<{
      fileId: string;
      fileName: string;
      fileSize: number;
      uploadedAt: Date;
    }>;
    radiologyScans?: Array<{
      fileId: string;
      fileName: string;
      fileSize: number;
      uploadedAt: Date;
    }>;
    clinicalData?: {
      fileId: string;
      fileName: string;
      uploadedAt: Date;
    };
    genomicData?: {
      fileId: string;
      fileName: string;
      uploadedAt: Date;
    };
  };

  // results from ML model (populated when status = 'completed')
  results?: {
    tnmStaging: {
      tStage: TStage;
      nStage: NStage;
      mStage: MStage;
      overallStage: OverallStage;
      confidence: number; // 0-1 - yes or no
    };
    survivalPrediction?: {
      oneYearSurvival: number; // Probability 0-1
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
  processingTime?: number; // seconds
  errorMessage?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
}

//Schema
const PredictionSchema = new Schema<IPrediction>(
  {
    predictionId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true
    },
    
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },
    
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    
    uploadedFiles: {
      pathologyImages: [
        {
          fileId: String,
          fileName: String,
          fileSize: Number,
          uploadedAt: Date
        }
      ],
      
      radiologyScans: [
        {
          fileId: String,
          fileName: String,
          fileSize: Number,
          uploadedAt: Date
        }
      ],
      
      clinicalData: {
        fileId: String,
        fileName: String,
        uploadedAt: Date
      },
      
      genomicData: {
        fileId: String,
        fileName: String,
        uploadedAt: Date
      }
    },
    
    results: {
      tnmStaging: {
        tStage: {
          type: String,
          enum: ['T0', 'T1', 'T1a', 'T1b', 'T1c', 'T2', 'T2a', 'T2b', 'T3', 'T4']
        },
        nStage: {
          type: String,
          enum: ['N0', 'N1', 'N2', 'N3']
        },
        mStage: {
          type: String,
          enum: ['M0', 'M1', 'M1a', 'M1b', 'M1c']
        },
        overallStage: {
          type: String,
          enum: ['IA1', 'IA2', 'IA3', 'IB', 'IIA', 'IIB', 'IIIA', 'IIIB', 'IIIC', 'IVA', 'IVB']
        },
        confidence: {
          type: Number,
          min: 0,
          max: 1
        }
      },
      
      survivalPrediction: {
        oneYearSurvival: {
          type: Number,
          min: 0,
          max: 1
        },
        threeYearSurvival: {
          type: Number,
          min: 0,
          max: 1
        },
        fiveYearSurvival: {
          type: Number,
          min: 0,
          max: 1
        }
      },
      
      attentionMaps: {
        pathologyMapUrl: String,
        radiologyMapUrl: String
      },
      
      featureImportance: {
        pathology: Number,
        radiology: Number,
        clinical: Number,
        genomic: Number
      }
    },
    
    processingTime: Number,
    errorMessage: String,
    completedAt: Date
  },
  {
    timestamps: true
  }
);


//indexs
PredictionSchema.index({ patient: 1, createdAt: -1 }); 
PredictionSchema.index({ requestedBy: 1, status: 1 }); // user pending predictions

export default mongoose.model<IPrediction>('Prediction', PredictionSchema);