import { Request, Response, NextFunction } from 'express';
import Patient from '../models/Patient';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';

/**
 * @route   POST /api/patients
 * @desc    Create a new patient
 * @access  Admin, Doctor
 */
export const createPatient = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const {
      firstName,
      lastName,
      dateOfBirth,
      sex,
      anatomicalSite,
      contactNumber,
      email,
      notes,
      assignedDoctor,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !sex || !anatomicalSite) {
      throw new BadRequestError(
        'firstName, lastName, dateOfBirth, sex, and anatomicalSite are required'
      );
    }
    if (!assignedDoctor) {
      throw new BadRequestError('assignedDoctor is required when creating a patient');
    }

    // Generate patient ID (UUID-based, concurrency-safe)
    const patientId = `PAT-${uuidv4().slice(0, 8).toUpperCase()}`;

    const patient = await Patient.create({
      patientId,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      sex,
      anatomicalSite,
      contactNumber,
      email,
      notes,
      assignedDoctor: assignedDoctor || undefined,
      createdBy: req.user!.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient,
    });
  }
);

/**
 * @route   GET /api/patients
 * @desc    Get all patients (with search and pagination)
 * @access  Admin, Doctor
 */
export const getPatients = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 20, search } = req.query;

    const query: any = { isActive: true };

    // Role-based filtering: doctors see only their assigned patients
    if (req.user!.role === 'doctor') {
      query.assignedDoctor = req.user!.userId;
    }

    // Search by name or patient ID
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { patientId: searchRegex },
      ];
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [patients, total] = await Promise.all([
      Patient.find(query)
        .populate('assignedDoctor', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Patient.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: patients,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  }
);

/**
 * @route   GET /api/patients/:id
 * @desc    Get a single patient
 * @access  Admin, Doctor
 */
export const getPatientById = asyncHandler(
  async (req: Request, res: Response) => {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedDoctor', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');

    if (!patient || !patient.isActive) {
      throw new NotFoundError('Patient not found');
    }

    res.status(200).json({
      success: true,
      data: patient,
    });
  }
);

/**
 * @route   PUT /api/patients/:id
 * @desc    Update a patient
 * @access  Admin, Doctor
 */
export const updatePatient = asyncHandler(
  async (req: Request, res: Response) => {
    const patient = await Patient.findById(req.params.id);

    if (!patient || !patient.isActive) {
      throw new NotFoundError('Patient not found');
    }

    const allowedFields = [
      'firstName',
      'lastName',
      'dateOfBirth',
      'sex',
      'anatomicalSite',
      'contactNumber',
      'email',
      'notes',
      'assignedDoctor',
    ];

    const updates: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    updates.updatedBy = req.user!.userId;

    const updated = await Patient.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('assignedDoctor', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: updated,
    });
  }
);

/**
 * @route   DELETE /api/patients/:id
 * @desc    Soft-delete (deactivate) a patient
 * @access  Admin
 */
export const deletePatient = asyncHandler(
  async (req: Request, res: Response) => {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    patient.isActive = false;
    patient.updatedBy = req.user!.userId as any;
    await patient.save();

    res.status(200).json({
      success: true,
      message: 'Patient deactivated successfully',
    });
  }
);