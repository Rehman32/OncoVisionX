import { Request, Response, NextFunction } from 'express';
import Patient from '../models/Patient';
import Prediction from '../models/Prediction';
import User from '../models/User';
import { logger } from '../utils/logger';

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private (All roles)
 * 
 * Returns role-specific statistics:
 * - Admin: System-wide metrics
 * - Doctor: Only their patients and predictions
 * - Researcher: De-identified aggregated data
 */
export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    let stats: any = {};

    // ========================================================
    // ADMIN DASHBOARD: System-wide statistics
    // ========================================================
    if (userRole === 'admin') {
      const [
        totalPatients,
        totalPredictions,
        totalUsers,
        pendingPredictions,
        processingPredictions,
        completedPredictions,
        failedPredictions,
        recentPatients,
        recentPredictions
      ] = await Promise.all([
        Patient.countDocuments({ isActive: true }),
        Prediction.countDocuments(),
        User.countDocuments({ isActive: true }),
        Prediction.countDocuments({ status: 'pending' }),
        Prediction.countDocuments({ status: 'processing' }),
        Prediction.countDocuments({ status: 'completed' }),
        Prediction.countDocuments({ status: 'failed' }),
        
        // Recent patients (last 5)
        Patient.find({ isActive: true })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('patientId personalInfo createdAt')
          .populate('assignedDoctor', 'firstName lastName'),
        
        // Recent predictions (last 5)
        Prediction.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('patient', 'patientId personalInfo')
          .populate('requestedBy', 'firstName lastName')
      ]);

      // User role breakdown
      const usersByRole = await User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      stats = {
        overview: {
          totalPatients,
          totalPredictions,
          totalUsers,
          activeUsers: totalUsers
        },
        predictions: {
          pending: pendingPredictions,
          processing: processingPredictions,
          completed: completedPredictions,
          failed: failedPredictions
        },
        users: {
          byRole: usersByRole.reduce((acc: any, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        },
        recent: {
          patients: recentPatients,
          predictions: recentPredictions
        }
      };
    }

    // ========================================================
    // DOCTOR DASHBOARD: Only their patients and predictions
    // ========================================================
    else if (userRole === 'doctor') {
      // Get patients assigned to this doctor
      const assignedPatients = await Patient.find({ 
        assignedDoctor: userId,
        isActive: true 
      }).select('_id');
      
      const patientIds = assignedPatients.map(p => p._id);

      const [
        totalPatients,
        totalPredictions,
        pendingPredictions,
        processingPredictions,
        completedPredictions,
        failedPredictions,
        recentPatients,
        recentPredictions
      ] = await Promise.all([
        Patient.countDocuments({ assignedDoctor: userId, isActive: true }),
        
        Prediction.countDocuments({
          $or: [
            { patient: { $in: patientIds } },
            { requestedBy: userId }
          ]
        }),
        
        Prediction.countDocuments({
          status: 'pending',
          $or: [
            { patient: { $in: patientIds } },
            { requestedBy: userId }
          ]
        }),
        
        Prediction.countDocuments({
          status: 'processing',
          $or: [
            { patient: { $in: patientIds } },
            { requestedBy: userId }
          ]
        }),
        
        Prediction.countDocuments({
          status: 'completed',
          $or: [
            { patient: { $in: patientIds } },
            { requestedBy: userId }
          ]
        }),
        
        Prediction.countDocuments({
          status: 'failed',
          $or: [
            { patient: { $in: patientIds } },
            { requestedBy: userId }
          ]
        }),
        
        // Recent patients assigned to this doctor
        Patient.find({ assignedDoctor: userId, isActive: true })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('patientId personalInfo createdAt'),
        
        // Recent predictions for their patients
        Prediction.find({
          $or: [
            { patient: { $in: patientIds } },
            { requestedBy: userId }
          ]
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('patient', 'patientId personalInfo')
      ]);

      stats = {
        overview: {
          myPatients: totalPatients,
          myPredictions: totalPredictions
        },
        predictions: {
          pending: pendingPredictions,
          processing: processingPredictions,
          completed: completedPredictions,
          failed: failedPredictions
        },
        recent: {
          patients: recentPatients,
          predictions: recentPredictions
        }
      };
    }

    // ========================================================
    // RESEARCHER DASHBOARD: Aggregated, de-identified data
    // ========================================================
    else if (userRole === 'researcher') {
      const [
        totalPatients,
        totalPredictions,
        completedPredictions,
        stageDistribution
      ] = await Promise.all([
        Patient.countDocuments({ isActive: true }),
        Prediction.countDocuments(),
        Prediction.countDocuments({ status: 'completed' }),
        
        // Stage distribution (aggregated)
        Prediction.aggregate([
          { $match: { status: 'completed' } },
          { 
            $group: { 
              _id: '$results.tnmStaging.overallStage', 
              count: { $sum: 1 } 
            } 
          }
        ])
      ]);

      stats = {
        overview: {
          totalPatients,
          totalPredictions,
          completedPredictions
        },
        analytics: {
          stageDistribution: stageDistribution.reduce((acc: any, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        },
        message: 'Researcher view provides aggregated, de-identified statistics'
      };
    }

    logger.info('Dashboard stats accessed', {
      userId,
      userRole
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get recent activity feed
 * @route   GET /api/dashboard/activity
 * @access  Private (All roles)
 * 
 * Returns chronological activity log:
 * - Patient registrations
 * - Prediction requests
 * - Prediction completions
 */
export const getRecentActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { limit = 10 } = req.query;

    let activity: any[] = [];

    // Get recent patients
    let patientsQuery: any = { isActive: true };
    if (userRole === 'doctor') {
      patientsQuery.assignedDoctor = userId;
    }

    const recentPatients = await Patient.find(patientsQuery)
      .sort({ createdAt: -1 })
      .limit(+limit / 2)
      .select('patientId personalInfo createdAt')
      .populate('assignedDoctor', 'firstName lastName');

    // Get recent predictions
    let predictionsQuery: any = {};
    if (userRole === 'doctor') {
      const assignedPatients = await Patient.find({ 
        assignedDoctor: userId 
      }).select('_id');
      const patientIds = assignedPatients.map(p => p._id);
      
      predictionsQuery.$or = [
        { patient: { $in: patientIds } },
        { requestedBy: userId }
      ];
    }

    const recentPredictions = await Prediction.find(predictionsQuery)
      .sort({ createdAt: -1 })
      .limit(+limit / 2)
      .populate('patient', 'patientId personalInfo')
      .populate('requestedBy', 'firstName lastName');

    // Combine and format activity
    const patientActivity = recentPatients.map((p: any) => ({
      id: p._id,
      type: 'patient_registered',
      title: `New patient: ${p.personalInfo.firstName} ${p.personalInfo.lastName}`,
      description: `Patient ID: ${p.patientId}`,
      timestamp: p.createdAt,
      metadata: {
        patientId: p._id,
        assignedDoctor: p.assignedDoctor ? 
          `${p.assignedDoctor.firstName} ${p.assignedDoctor.lastName}` : null
      }
    }));

    const predictionActivity = recentPredictions.map((p: any) => ({
      id: p._id,
      type: p.status === 'completed' ? 'prediction_completed' : 'prediction_requested',
      title: p.status === 'completed' 
        ? `Prediction completed for ${p.patient?.personalInfo?.firstName || 'Patient'}`
        : `New prediction request`,
      description: `Prediction ID: ${p.predictionId}`,
      timestamp: p.status === 'completed' ? (p.completedAt || p.createdAt) : p.createdAt,
      metadata: {
        predictionId: p._id,
        status: p.status,
        stage: p.results?.tnmStaging?.overallStage,
        requestedBy: p.requestedBy ? 
          `${p.requestedBy.firstName} ${p.requestedBy.lastName}` : null
      }
    }));

    // Merge and sort by timestamp
    activity = [...patientActivity, ...predictionActivity]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, +limit);

    res.json({
      success: true,
      data: activity
    });

  } catch (err) {
    next(err);
  }
};
