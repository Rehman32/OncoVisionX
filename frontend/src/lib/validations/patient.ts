import { z } from 'zod';

export const patientFormSchema = z.object({
  // Personal Information
  personalInfo: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    gender: z.enum(['male', 'female', 'other']),
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    contactNumber: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  }),

  // Medical Information
  medicalInfo: z.object({
    height: z.number().min(50).max(300).optional().or(z.nan()),
    weight: z.number().min(10).max(500).optional().or(z.nan()),
    smokingStatus: z.enum(['never', 'former', 'current']).optional(),
    smokingPackYears: z.number().min(0).optional().or(z.nan()),
    comorbidities: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    currentMedications: z.array(z.string()).optional(),
    performanceStatus: z.number().min(0).max(5).optional().or(z.nan()),
  }).optional(),

  // Emergency Contact
  emergencyContact: z.object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    phoneNumber: z.string().optional(),
  }).optional(),

  assignedDoctor: z.string().optional(),
});

export type PatientFormData = z.infer<typeof patientFormSchema>;
