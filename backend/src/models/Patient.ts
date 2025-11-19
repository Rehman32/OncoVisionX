import mongoose, { Document, Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";
import { kMaxLength } from "buffer";

export interface IPatient extends Document {
  _id: mongoose.Types.ObjectId;
  patientId: String;

  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: "male" | "female" | "other";
    bloodType?: string;
    contactNumber?: string;
    email?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };

  medicalInfo: {
    height?: number; // cm
    weight?: number; // kg
    smokingStatus?: "never" | "former" | "current";
    smokingPackYears?: number;
    comorbidities?: string[];
    allergies?: string[];
    currentMedications?: string[];
    performanceStatus?: number; // ECOG scale 0-5
  };

  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };

  assignedDoctor?: Types.ObjectId; // reference to User (doctor)
  createdBy: Types.ObjectId; // reference to User who created
  updatedBy?: Types.ObjectId; // reference to User who last updated
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    patientId: {
      type: String,
      required: [true, "Patient Id is required"],
      unique: true,
      uppercase: true,
      match: [
        /^P-\d{4}-\d{3}$/,
        "Patient ID must follow format: P-YYYY-XXX (e.g., P-2024-001)",
      ],
      index: true,
    },
    personalInfo: {
      firstName: {
        type: String,
        required: [true, "First Name is required "],
        trim: true,
        maxlength: [20, "First name cannot exceed 20 characters"],
      },
      lastName: {
        type: String,
        required: [true, "Last Name is required "],
        trim: true,
        maxlength: [20, "Last name cannot exceed 20 characters"],
      },

      dateOfBirth: {
        type: Date,
        required: [true, "DOB is required "],
        validate: {
          validator: function (value: Date): boolean {
            return value < new Date(); // Must be in the past
          },
          message: "Date of birth must be in the past",
        },
      },

      gender: {
        type: String,
        required: [true, "Gender is Required "],
        enum: {
          values: ["Male", "Female", "Other"],
          message: "{VALUE} is not a valid gender",
        },
        trim: true,
      },
      bloodType: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      },
      contactNumber: String,

      email: {
        type: String,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
      },

      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
      },
    },

    medicalInfo: {
      height: {
        type: Number,
        min: [50, "Height must be at least 50 cm"],
        max: [300, "Height cannot exceed 300 cm"],
      },

      weight: {
        type: Number,
        min: [10, "Weight must be at least 10 kg"],
        max: [500, "Weight cannot exceed 500 kg"],
      },

      smokingStatus: {
        type: String,
        enum: ["never", "former", "current"],
      },

      smokingPackYears: {
        type: Number,
        min: 0,
      },

      comorbidities: [String],
      allergies: [String],
      currentMedications: [String],

      performanceStatus: {
        type: Number,
        min: 0,
        max: 5,
      },
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phoneNumber: String,
    },

    assignedDoctor: {
      type: Schema.Types.ObjectId,
      ref: "User", // reference to User collection
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

//indexes 

PatientSchema.index({
    'personalInfo.firstName' : 1, "personalInfo.lastName" : 1
});

PatientSchema.index({
    createdAt: -1
});

PatientSchema.index({
    'assignedDoctor' : 1, 'isActive' : 1
});

//virtual fields 

//full name
PatientSchema.virtual('fullName').get(function (){
    return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`
});


//age
PatientSchema.virtual('age').get(function () {
  const today = new Date();
  const birthDate = new Date(this.personalInfo.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});


//bmi
PatientSchema.virtual('bmi').get(function () {
  const { height, weight } = this.medicalInfo;
  if (!height || !weight) return null;
  
  const heightInMeters = height / 100; // Convert cm to meters
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
});

// enable virtuals in JSON output 
PatientSchema.set('toJSON', { virtuals: true });
PatientSchema.set('toObject', { virtuals: true });

export default mongoose.model<IPatient>('Patient',PatientSchema);