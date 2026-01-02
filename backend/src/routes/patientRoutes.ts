import express from 'express';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deactivatePatient
} from '../controllers/patientController';
import { protect, authorize } from '../middleware/auth';
import { auditLogger } from '../middleware/auditLogger';

const router = express.Router();

// All patient routes require authentication
router.use(protect);

// List & detail
router.get('/', authorize('admin', 'doctor', 'researcher'), getPatients);
router.get('/:id', authorize('admin', 'doctor', 'researcher'), getPatientById);

// Create & update (admin + doctor)
router.post(
  '/',
  authorize('admin', 'doctor'),
  createPatient,
  auditLogger('CREATE_PATIENT', 'patient')
);
router.put(
  '/:id',
  authorize('admin', 'doctor'),
  updatePatient,
  auditLogger('UPDATE_PATIENT', 'patient')
);

// Deactivate (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  deactivatePatient,
  auditLogger('DELETE_PATIENT', 'patient')
);

export default router;
