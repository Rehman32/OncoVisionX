import { Request, Response, NextFunction } from "express";
import Patient from "../models/Patient";
import { Types } from "mongoose";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/errors";

export const getPatients = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const query: any = { isActive: true };

    if (search) {
      const s = search as string;
      query.$or = [
        { patientId: { $regex: new RegExp(s, "i") } },
        { "personalInfo.firstName": { $regex: new RegExp(s, "i") } },
        { "personalInfo.lastName": { $regex: new RegExp(s, "i") } },
      ];
    }

    const patient = await Patient.find(query)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    const total = await Patient.countDocuments(query);
    res.json({
      success: true,
      data: patient,
      meta: {
        total,
        page: +page,
        limit: +limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

//get patient by id
export const getPatientById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient || !patient.isActive) {
      throw new NotFoundError("User not found ");
    }
    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

// generate patientId like P-2025-001
const generatePatientId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await Patient.countDocuments({});
  const sequence = String(count + 1).padStart(3, "0");
  return `P-${year}-${sequence}`;
};

//create patient
export const createPatient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ForbiddenError("User context missing");
    }

    const { personalInfo, medicalInfo, emergencyContact, assignedDoctor } =
      req.body;
    console.log("req body :",req.body);
    if (
      !personalInfo.firstName ||
      !personalInfo.lastName ||
      !personalInfo.dateOfBirth ||
      !personalInfo.gender
    ) {
      throw new BadRequestError("Missing required perosnal information field");
    }

    const patientId = await generatePatientId();
    const patient = await Patient.create({
      patientId,
      personalInfo,
      medicalInfo,
      emergencyContact,
      assignedDoctor: assignedDoctor || req.user.userId, // default to current doctor
      createdBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: patient,
    });
  } catch (error) {
    next(error);
  }
  
};


//update patient : put
export const updatePatient = async (req:Request,res:Response,next :NextFunction) => {
try {
    if(!req.user){
        throw new ForbiddenError('User context missing')
    };

    const patient = await Patient.findById(req.params.id);
    if(!patient || !patient.isActive){
        throw new NotFoundError('User not found')
    };

    //only assigned doctor can edit the patient info
    if(req.user.role === 'doctor' && patient.assignedDoctor?.toString() !== req.user.userId){
        throw new ForbiddenError('You are not allowed to modify this patient')
    };

    patient.personalInfo= {...patient.personalInfo, ...req.body.personalInfo};
    patient.medicalInfo = {...patient.medicalInfo, ...req.body.medicalInfo};
    patient.emergencyContact = {...patient.emergencyContact, ...req.body.emergencyContact};
    if(req.body.assignedDoctor){
        patient.assignedDoctor = req.body.assignedDoctor
    };
    patient.updatedBy = new Types.ObjectId(req.user.userId);

    await patient.save();

    res.json({
        success: true,
        message : "Patient updated successfully",
        data : patient
    });
} catch (error) {
    next(error)
}
}

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