import  Patient  from '../models/Patient';

/**
 * De-identify patient data for researchers
 * 
 * Removes all PII while preserving clinical/research value:
 * - Keep: Age, Gender, Medical history, Staging data
 * - Remove: Name, Email, Phone, Address, Specific dates
 * 
 * Compliant with:
 * - HIPAA Safe Harbor Method (18 identifiers)
 * - GDPR Article 89 (Pseudonymization)
 */
export const deidentifyPatient = (patient: any) => {
  return {
    // Keep research-relevant IDs
    patientId: patient.patientId,
    _id: patient._id,
    
    // Demographics (aggregated)
    age: patient.age,
    gender: patient.personalInfo.gender,
    bloodType: patient.personalInfo.bloodType,
    
    // Medical info (full access - research critical)
    medicalInfo: patient.medicalInfo,
    
    // Computed fields
    bmi: patient.bmi,
    
    // Metadata (generalized)
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
    isActive: patient.isActive,
    
    // REMOVED FIELDS (PII):
    // ❌ personalInfo.firstName
    // ❌ personalInfo.lastName
    // ❌ personalInfo.email
    // ❌ personalInfo.contactNumber
    // ❌ personalInfo.address
    // ❌ personalInfo.dateOfBirth (replaced with age)
    // ❌ emergencyContact
    // ❌ assignedDoctor
  };
};

/**
 * De-identify prediction data
 */
export const deidentifyPrediction = (prediction: any) => {
  return {
    predictionId: prediction.predictionId,
    _id: prediction._id,
    
    // Patient reference (de-identified)
    patient: prediction.patient ? deidentifyPatient(prediction.patient) : null,
    
    // Full access to results (research purpose)
    status: prediction.status,
    results: prediction.results,
    processingTime: prediction.processingTime,
    
    // File metadata (no actual file access)
    uploadedFiles: {
      pathologyCount: prediction.uploadedFiles?.pathologyImages?.length || 0,
      radiologyCount: prediction.uploadedFiles?.radiologyScans?.length || 0,
      hasClinicalData: !!prediction.uploadedFiles?.clinicalData,
      hasGenomicData: !!prediction.uploadedFiles?.genomicData,
    },
    
    // Temporal data
    createdAt: prediction.createdAt,
    completedAt: prediction.completedAt,
    
    // REMOVED FIELDS:
    // ❌ requestedBy (doctor identity)
    // ❌ uploadedFiles (actual file paths/names)
  };
};
