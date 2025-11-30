export interface Patient {
  _id: string;
  patientId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
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
  medicalInfo?: {
    height?: number;
    weight?: number;
    smokingStatus?: 'never' | 'former' | 'current';
    smokingPackYears?: number;
    comorbidities?: string[];
    allergies?: string[];
    currentMedications?: string[];
    performanceStatus?: number;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  assignedDoctor?: string;
  createdBy: string;
  updatedBy?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fullName?: string;
  age?: number;
  bmi?: number;
}

export interface CreatePatientRequest {
  personalInfo: Patient['personalInfo'];
  medicalInfo?: Patient['medicalInfo'];
  emergencyContact?: Patient['emergencyContact'];
  assignedDoctor?: string;
}
