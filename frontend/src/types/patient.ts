export type AnatomicalSite =
  | 'abdomen'
  | 'acral'
  | 'back'
  | 'chest'
  | 'ear'
  | 'face'
  | 'foot'
  | 'genital'
  | 'hand'
  | 'lower extremity'
  | 'neck'
  | 'scalp'
  | 'trunk'
  | 'unknown'
  | 'upper extremity';

export interface Patient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: "male" | "female" | "unknown";
  anatomicalSite: AnatomicalSite;

  contactNumber?: string;
  email?: string;
  notes?: string;

  assignedDoctor?: string | Doctor;
  createdBy: string;
  updatedBy?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fullName?: string;
  age?: number;
}

export interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: "male" | "female" | "unknown";
  anatomicalSite: AnatomicalSite;
  contactNumber?: string;
  email?: string;
  notes?: string;
  assignedDoctor?: string;
}
