import { z } from 'zod';

export const HAM10000_SITES = [
  'abdomen',
  'acral',
  'back',
  'chest',
  'ear',
  'face',
  'foot',
  'genital',
  'hand',
  'lower extremity',
  'neck',
  'scalp',
  'trunk',
  'unknown',
  'upper extremity',
] as const;

export const patientFormSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  sex: z.enum(['male', 'female', 'unknown']),
  anatomicalSite: z.enum(HAM10000_SITES),
  contactNumber: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().optional(),
  assignedDoctor: z.string().optional(),
});

export type PatientFormData = z.infer<typeof patientFormSchema>;
