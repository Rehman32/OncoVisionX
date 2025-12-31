import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';
import { ForbiddenError } from '../utils/errors';

/**
 * @desc    Get audit logs with filters
 * @route   GET /api/audit?userId=&action=&resourceType=&page=&limit=
 * @access  Private (Admin only)
 */
export const getAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      userId,
      action,
      resourceType,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const query: any = {};

    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .populate('userId', 'firstName lastName email role');

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      meta: { total, page: +page, limit: +limit }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get audit statistics
 * @route   GET /api/audit/stats
 * @access  Private (Admin only)
 */
export const getAuditStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const totalLogs = await AuditLog.countDocuments();
    
    const actionStats = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const userStats = await AuditLog.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        totalLogs,
        actionStats,
        topUsers: userStats
      }
    });
  } catch (err) {
    next(err);
  }
};
