import { Request, Response, NextFunction } from 'express';
import Patient from '../models/Patient';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';


// Helper: Generate Patient ID
const generatePatientId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await Patient.countDocuments({});
  const sequence = String(count + 1).padStart(3, '0');
  return `P-${year}-${sequence}`;
};


/**
 * GET /api/patients
 * 
 * RBAC Logic:
 * - Admin: See all patients
 * - Doctor: See only assigned patients
 * - Researcher: See de-identified data only (Task 2.2)
 */
export const getPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Build base query
    const query: any = { isActive: true };

    // RBAC: Row-Level Security
    if (userRole === 'doctor') {
      // Doctors only see their assigned patients
      query.assignedDoctor = userId;
      logger.info('Doctor filtered patient query', { doctorId: userId });
    }
    // Admin sees all (no filter)
    // Researcher filter handled in Task 2.2

    // Search filter (if provided)
    if (search) {
      const s = search as string;
      query.$or = [
        { patientId: { $regex: new RegExp(s, 'i') } },
        { 'personalInfo.firstName': { $regex: new RegExp(s, 'i') } },
        { 'personalInfo.lastName': { $regex: new RegExp(s, 'i') } }
      ];
    }

    const patients = await Patient.find(query)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    const total = await Patient.countDocuments(query);

    // Log data access for audit trail
    logger.info('Patient list accessed', {
      userId,
      userRole,
      count: patients.length,
      filters: { search, page, limit }
    });

    res.json({
      success: true,
      data: patients,
      meta: { total, page: +page, limit: +limit }
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/patients/:id
 * 
 * Authorization:
 * - Admin: Access any patient
 * - Doctor: Only if assignedDoctor matches
 * - Researcher: De-identified view only
 */
export const getPatientById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const patient = await Patient.findById(req.params.id);

    if (!patient || !patient.isActive) {
      throw new NotFoundError('Patient not found');
    }

    // RBAC: Authorization Check
    if (userRole === 'doctor') {
      if (patient.assignedDoctor?.toString() !== userId) {
        logger.warn('Unauthorized patient access attempt', {
          doctorId: userId,
          patientId: patient._id,
          assignedDoctor: patient.assignedDoctor
        });
        throw new ForbiddenError('You are not authorized to access this patient');
      }
    }

    // Researcher de-identification handled in Task 2.2

    // Log access for audit trail
    logger.info('Patient detail accessed', {
      userId,
      userRole,
      patientId: patient._id
    });

    res.json({ success: true, data: patient });
  } catch (err) { next(err); }
};

/**
 * POST /api/patients
 * 
 * Business Rule:
 * - Doctors can only create patients assigned to themselves
 * - Admins can assign to any doctor
 */
export const createPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const {
      personalInfo,
      medicalInfo,
      emergencyContact,
      assignedDoctor
    } = req.body;

    // Validation
    if (!personalInfo?.firstName || !personalInfo?.lastName || !personalInfo?.dateOfBirth || !personalInfo?.gender) {
      throw new BadRequestError('Missing required personal information fields');
    }

    // RBAC: Doctors can't assign patients to other doctors
    let finalAssignedDoctor = assignedDoctor;
    if (userRole === 'doctor') {
      if (assignedDoctor && assignedDoctor !== userId) {
        logger.warn('Doctor attempted to assign patient to different doctor', {
          requestingDoctor: userId,
          attemptedAssignment: assignedDoctor
        });
        throw new ForbiddenError('You can only create patients assigned to yourself');
      }
      finalAssignedDoctor = userId; // Force assignment to self
    }

    // Generate patient ID
    const patientId = await generatePatientId();

    const patient = await Patient.create({
      patientId,
      personalInfo,
      medicalInfo,
      emergencyContact,
      assignedDoctor: finalAssignedDoctor || userId,
      createdBy: userId
    });

    logger.info('Patient created', {
      patientId: patient._id,
      createdBy: userId,
      assignedDoctor: patient.assignedDoctor
    });

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient
    });
  } catch (err) { next(err); }
};

/**
 * PUT /api/patients/:id
 * 
 * Authorization:
 * - Admin: Can update any patient
 * - Doctor: Only if assignedDoctor matches
 */
export const updatePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const patient = await Patient.findById(req.params.id);

    if (!patient || !patient.isActive) {
      throw new NotFoundError('Patient not found');
    }

    // RBAC: Authorization
    if (userRole === 'doctor' && patient.assignedDoctor?.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to modify this patient');
    }

    // Update fields
    patient.personalInfo = { ...patient.personalInfo, ...req.body.personalInfo };
    patient.medicalInfo = { ...patient.medicalInfo, ...req.body.medicalInfo };
    patient.emergencyContact = { ...patient.emergencyContact, ...req.body.emergencyContact };
    
    // Admin can reassign patients, doctors cannot
    if (req.body.assignedDoctor) {
      if (userRole === 'admin') {
        patient.assignedDoctor = req.body.assignedDoctor;
      } else {
        logger.warn('Non-admin attempted to reassign patient', {
          userId,
          patientId: patient._id
        });
        throw new ForbiddenError('Only admins can reassign patients');
      }
    }

    patient.updatedBy = userId;
    await patient.save();

    logger.info('Patient updated', {
      patientId: patient._id,
      updatedBy: userId
    });

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: patient
    });
  } catch (err) { next(err); }
};




//delete patient : soft delete
export const deactivatePatient= async (req:Request,res:Response,next:NextFunction) =>{
    try {
        const patient = await Patient.findByIdAndUpdate(req.params.id,{isActive: false}, {new: true});
        
        if (!patient) throw new NotFoundError('Patient not found');

        res.json({ success: true, message: 'Patient deactivated' });

    } catch (error) {
        next(error)
    }
    
}