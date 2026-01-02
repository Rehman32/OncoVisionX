import { Request, Response, NextFunction } from 'express';
import Patient from '../models/Patient';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';
import { deidentifyPatient } from '../utils/deidentify';


// Helper: Generate Patient ID
const generatePatientId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await Patient.countDocuments({});
  const sequence = String(count + 1).padStart(3, '0');
  return `P-${year}-${sequence}`;
};



/**
 * GET /api/patients
 Get all patients
 */
export const getPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const query: any = { isActive: true };

    // 1. RBAC filters
    if (userRole === 'doctor') {
      query.assignedDoctor = userId;
    }

    if (search) {
      const s = search as string;
      query.$or = [
        { patientId: { $regex: new RegExp(s, 'i') } },
        { 'personalInfo.firstName': { $regex: new RegExp(s, 'i') } },
        { 'personalInfo.lastName': { $regex: new RegExp(s, 'i') } }
      ];
    }

    // 2. Fetch Hydrated Mongoose Documents
    const patientDocs = await Patient.find(query)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    const total = await Patient.countDocuments(query);

    // 3. Prepare Response Data
    // We use "any[]" or a union type here because the shape changes for researchers
    let responseData: any[];

    if (userRole === 'researcher') {
      // Transform to plain objects and strip PII
      responseData = patientDocs.map(p => deidentifyPatient(p.toObject()));
      
      logger.info('De-identified patient data served to researcher', { 
        userId, 
        count: responseData.length 
      });
    } else {
      // For doctors/admins, return the full object (including virtuals)
      responseData = patientDocs.map(p => p.toObject());
      
      logger.info('Full patient list accessed', {
        userId,
        userRole,
        count: responseData.length
      });
    }

    // 4. Send Response
    res.json({
      success: true,
      data: responseData,
      meta: { 
        total, 
        page: +page, 
        limit: +limit 
      }
    });
  } catch (err) { 
    next(err); 
  }
};

/**
 * GET /api/patients/:id
 */
export const getPatientById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    let patient = await Patient.findById(req.params.id);

    if (!patient || !patient.isActive) {
      throw new NotFoundError('Patient not found');
    }

    // RBAC: Doctor authorization
    if (userRole === 'doctor') {
      if (patient.assignedDoctor?.toString() !== userId) {
        throw new ForbiddenError('You are not authorized to access this patient');
      }
    }

    // DE-IDENTIFICATION: Transform for researchers
    if (userRole === 'researcher') {
      patient = deidentifyPatient(patient.toObject()) as any;
      logger.info('De-identified patient detail served to researcher', { userId, patientId: req.params.id });
    }

    logger.info('Patient detail accessed', {
      userId,
      userRole,
      patientId: patient?.patientId
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