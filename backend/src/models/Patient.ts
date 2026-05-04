import mongoose, { Schema, Document } from 'mongoose';

// ==================== HAM10000 ANATOMICAL SITES ====================
export const ANATOMICAL_SITES = [
  'abdomen', 'acral', 'back', 'chest', 'ear', 'face', 'foot',
  'genital', 'hand', 'lower extremity', 'neck', 'scalp', 'trunk',
  'unknown', 'upper extremity',
] as const;

export type AnatomicalSite = typeof ANATOMICAL_SITES[number];
export type PatientSex = 'male' | 'female' | 'unknown';

// ==================== INTERFACE ====================
export interface IPatient extends Document {
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  sex: PatientSex;
  anatomicalSite: AnatomicalSite;
  contactNumber?: string;
  email?: string;
  notes?: string;
  assignedDoctor?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  fullName: string;
  age: number;
}

// ==================== SCHEMA ====================
const PatientSchema = new Schema<IPatient>(
  {
    patientId: {
      type: String,
      unique: true,
      required: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    sex: {
      type: String,
      enum: ['male', 'female', 'unknown'],
      required: [true, 'Sex is required'],
      default: 'unknown',
    },
    anatomicalSite: {
      type: String,
      enum: ANATOMICAL_SITES,
      required: [true, 'Anatomical site is required'],
      default: 'unknown',
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    assignedDoctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== VIRTUALS ====================
PatientSchema.virtual('fullName').get(function (this: IPatient) {
  return `${this.firstName} ${this.lastName}`;
});

PatientSchema.virtual('age').get(function (this: IPatient) {
  if (!this.dateOfBirth) return 0;
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
});

// ==================== INDEXES ====================
// patientId unique index is auto-created by schema `unique: true`
PatientSchema.index({ lastName: 1, firstName: 1 });
PatientSchema.index({ assignedDoctor: 1 });
PatientSchema.index({ isActive: 1 });
PatientSchema.index({ createdAt: -1 });

export default mongoose.model<IPatient>('Patient', PatientSchema);