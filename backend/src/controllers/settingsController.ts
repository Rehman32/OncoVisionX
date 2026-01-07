import { Request, Response, NextFunction } from 'express';
import Settings from '../models/Settings';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * @desc    Get user settings
 * @route   GET /api/settings
 * @access  Private (All roles)
 */
export const getUserSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    let settings = await Settings.findOne({ userId });

    // Create default settings if not exists
    if (!settings) {
      settings = new Settings({
        userId,
        notifications: {
          email: {
            predictions: true,
            systemAlerts: true,
            weeklyReports: false,
          },
          inApp: {
            predictions: true,
            systemAlerts: true,
            messages: true,
          },
        },
        privacy: {
          profileVisibility: 'private',
          dataSharing: false,
          analyticsTracking: true,
        },
        display: {
          theme: 'system',
          language: 'en',
          timeFormat: '12h',
          dateFormat: 'MMM DD, YYYY',
        },
        security: {
          twoFactorEnabled: false,
          sessionTimeout: 30,
          loginAlerts: true,
        },
      });
      await settings.save();
    }

    logger.info('Settings retrieved', { userId });

    res.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user settings (partial or full)
 * @route   PUT /api/settings
 * @access  Private (All roles)
 */
export const updateUserSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const updates = req.body;

    // Validate input
    if (!updates || Object.keys(updates).length === 0) {
      throw new BadRequestError('No updates provided');
    }

    let settings = await Settings.findOne({ userId });

    if (!settings) {
      // Create new settings with updates
      settings = new Settings({
        userId,
        ...updates,
      });
    } else {
      // Update existing settings (deep merge for nested objects)
      if (updates.notifications) {
        settings.notifications = {
          ...settings.notifications,
          ...updates.notifications,
          email: { ...settings.notifications.email, ...updates.notifications.email },
          inApp: { ...settings.notifications.inApp, ...updates.notifications.inApp },
        };
      }

      if (updates.privacy) {
        settings.privacy = { ...settings.privacy, ...updates.privacy };
      }

      if (updates.display) {
        settings.display = { ...settings.display, ...updates.display };
      }

      if (updates.security) {
        settings.security = { ...settings.security, ...updates.security };
      }

      if (updates.roleSpecific) {
        settings.roleSpecific = { ...settings.roleSpecific, ...updates.roleSpecific };
      }
    }

    await settings.save();

    logger.info('Settings updated', {
      userId,
      updatedFields: Object.keys(updates),
    });

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Reset settings to defaults
 * @route   POST /api/settings/reset
 * @access  Private (All roles)
 */
export const resetSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    await Settings.findOneAndUpdate(
      { userId },
      {
        notifications: {
          email: {
            predictions: true,
            systemAlerts: true,
            weeklyReports: false,
          },
          inApp: {
            predictions: true,
            systemAlerts: true,
            messages: true,
          },
        },
        privacy: {
          profileVisibility: 'private',
          dataSharing: false,
          analyticsTracking: true,
        },
        display: {
          theme: 'system',
          language: 'en',
          timeFormat: '12h',
          dateFormat: 'MMM DD, YYYY',
        },
        security: {
          twoFactorEnabled: false,
          sessionTimeout: 30,
          loginAlerts: true,
        },
      },
      { new: true }
    );

    logger.info('Settings reset to defaults', { userId });

    res.json({
      success: true,
      message: 'Settings reset to defaults',
    });
  } catch (err) {
    next(err);
  }
};