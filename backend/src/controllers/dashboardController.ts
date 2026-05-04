import { Request, Response } from 'express';
import Patient from '../models/Patient';
import Prediction from '../models/Prediction';
import User from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get role-specific dashboard statistics
 * @access  Admin, Doctor
 */
export const getDashboardStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { role, userId } = req.user!;

    let stats: any = {};

    if (role === 'admin') {
      // Admin sees system-wide metrics
      const [
        totalPatients,
        totalPredictions,
        totalUsers,
        decisionCounts,
        recentPredictions,
      ] = await Promise.all([
        Patient.countDocuments({ isActive: true }),
        Prediction.countDocuments(),
        User.countDocuments({ isActive: true }),
        Prediction.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: '$decision', count: { $sum: 1 } } },
        ]),
        Prediction.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),
      ]);

      const decisions = decisionCounts.reduce(
        (acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>
      );

      stats = {
        totalPatients,
        totalPredictions,
        totalUsers,
        predictionsThisWeek: recentPredictions,
        decisionBreakdown: {
          accept: decisions['ACCEPT'] || 0,
          deferToDoctor: decisions['DEFER_TO_DOCTOR'] || 0,
          rejectQuality: decisions['REJECT_QUALITY'] || 0,
          rejectOod: decisions['REJECT_OOD'] || 0,
        },
      };
    } else if (role === 'doctor') {
      // Doctor sees their own patients and predictions
      const [
        myPatients,
        myPredictions,
        myDecisionCounts,
      ] = await Promise.all([
        Patient.countDocuments({ assignedDoctor: userId, isActive: true }),
        Prediction.countDocuments({ requestedBy: userId }),
        Prediction.aggregate([
          { $match: { requestedBy: userId, status: 'completed' } },
          { $group: { _id: '$decision', count: { $sum: 1 } } },
        ]),
      ]);

      const decisions = myDecisionCounts.reduce(
        (acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>
      );

      stats = {
        myPatients,
        myPredictions,
        decisionBreakdown: {
          accept: decisions['ACCEPT'] || 0,
          deferToDoctor: decisions['DEFER_TO_DOCTOR'] || 0,
          rejectQuality: decisions['REJECT_QUALITY'] || 0,
          rejectOod: decisions['REJECT_OOD'] || 0,
        },
      };
    }

    res.status(200).json({
      success: true,
      data: stats,
    });
  }
);

/**
 * @route   GET /api/dashboard/activity
 * @desc    Get recent activity feed
 * @access  Admin, Doctor
 */
export const getRecentActivity = asyncHandler(
  async (req: Request, res: Response) => {
    const { role, userId } = req.user!;
    const limit = Number(req.query.limit) || 10;

    const query: any = {};
    if (role === 'doctor') {
      query.requestedBy = userId;
    }

    const recentPredictions = await Prediction.find(query)
      .populate('patient', 'patientId firstName lastName')
      .populate('requestedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const activity = recentPredictions.map((pred: any) => ({
      id: pred._id,
      type: 'prediction',
      predictionId: pred.predictionId,
      patient: pred.patient,
      requestedBy: pred.requestedBy,
      decision: pred.decision,
      predictedClass: pred.predictedClass,
      status: pred.status,
      createdAt: pred.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: activity,
    });
  }
);
