import mongoose, { Schema, Document } from 'mongoose';

export interface IUploadSession extends Document {
  sessionId: string;
  userId: string;
  fileName: string;
  fileType: string;
  totalSize: number;
  totalChunks: number;
  uploadedChunks: number;
  fileHash: string; // SHA-256 hash from frontend
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  sessionPath: string; // Path to temp folder
  createdAt: Date;
  expiresAt: Date;
}

const UploadSessionSchema = new Schema<IUploadSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    totalSize: {
      type: Number,
      required: true
    },
    totalChunks: {
      type: Number,
      required: true
    },
    uploadedChunks: {
      type: Number,
      default: 0
    },
    fileHash: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'uploading', 'completed', 'failed'],
      default: 'pending'
    },
    sessionPath: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Auto-delete expired sessions (MongoDB TTL index)
UploadSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IUploadSession>('UploadSession', UploadSessionSchema);
