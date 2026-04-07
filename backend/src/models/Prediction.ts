import mongoose, { Schema, Document } from 'mongoose';

// ==================== ENUMS ====================
export const DECISION_TYPES = [
  'ACCEPT',
  'DEFER_TO_DOCTOR',
  'REJECT_QUALITY',
  'REJECT_OOD',
] as const;

export type DecisionType = typeof DECISION_TYPES[number];

// ==================== INTERFACE ====================
export interface IPrediction extends Document {
  predictionId: string;
  patient: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;

  // Uploaded image
  imageFileId: string;
  originalFileName: string;

  // FastAPI response fields
  requestId: string;
  decision: DecisionType;
  predictionSet: string[];
  predictedClass?: string;
  confidence: number;
  entropy: number;
  oodSimilarity: number;
  coverageGuarantee: number;
  blurVariance: number;
  saliencyMapUrl: string;
  referenceImageUrl: string;
  inferenceTimeMs: number;

  // Status
  status: 'completed' | 'failed';
  errorMessage?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ==================== SCHEMA ====================
const PredictionSchema = new Schema<IPrediction>(
  {
    predictionId: {
      type: String,
      unique: true,
      required: true,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requesting user is required'],
    },

    // Uploaded image
    imageFileId: {
      type: String,
      required: [true, 'Image file path is required'],
    },
    originalFileName: {
      type: String,
      required: true,
    },

    // FastAPI response fields
    requestId: {
      type: String,
    },
    decision: {
      type: String,
      enum: DECISION_TYPES,
    },
    predictionSet: {
      type: [String],
      default: [],
    },
    predictedClass: {
      type: String,
    },
    confidence: {
      type: Number,
    },
    entropy: {
      type: Number,
    },
    oodSimilarity: {
      type: Number,
    },
    coverageGuarantee: {
      type: Number,
    },
    blurVariance: {
      type: Number,
    },
    saliencyMapUrl: {
      type: String,
    },
    referenceImageUrl: {
      type: String,
    },
    inferenceTimeMs: {
      type: Number,
    },

    // Status
    status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed',
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== INDEXES ====================
// predictionId unique index is automatically created by schema
PredictionSchema.index({ patient: 1 });
PredictionSchema.index({ requestedBy: 1 });
PredictionSchema.index({ decision: 1 });
PredictionSchema.index({ status: 1 });
PredictionSchema.index({ createdAt: -1 });

export default mongoose.model<IPrediction>('Prediction', PredictionSchema);
