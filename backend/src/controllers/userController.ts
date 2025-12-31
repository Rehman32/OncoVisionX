import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../utils/email';

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/users?role=&isActive=&page=&limit=
 * @access  Private (Admin)
 */
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role, isActive, search, page = 1, limit = 10 } = req.query;

    const query: any = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    if (search) {
      const s = search as string;
      query.$or = [
        { email: { $regex: new RegExp(s, 'i') } },
        { firstName: { $regex: new RegExp(s, 'i') } },
        { lastName: { $regex: new RegExp(s, 'i') } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    const total = await User.countDocuments(query);

    // Get role counts for stats
    const stats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: users,
      meta: {
        total,
        page: +page,
        limit: +limit,
        stats: stats.reduce((acc: any, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin or Self)
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestingUserId = (req as any).user.userId;
    const requestingUserRole = (req as any).user.role;

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Authorization: Admin can see anyone, others only themselves
    if (requestingUserRole !== 'admin' && requestingUserId !== user._id.toString()) {
      throw new ForbiddenError('You can only view your own profile');
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create new user (admin only)
 * @route   POST /api/users
 * @access  Private (Admin)
 */
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      phoneNumber,
      licenseNumber,
      institution,
      department
    } = req.body;

    // Validation
    if (!email || !firstName || !lastName || !role) {
      throw new BadRequestError('Email, first name, last name, and role are required');
    }

    if (!['admin', 'doctor', 'researcher'].includes(role)) {
      throw new BadRequestError('Invalid role');
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    // Generate temporary password if not provided
    const tempPassword = password || Math.random().toString(36).slice(-10) + 'A1!';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role,
      phoneNumber,
      licenseNumber,
      institution,
      department,
      isActive: true,
      isEmailVerified: false
    });

    // Send welcome email with temp password
    await sendEmail({
      to: user.email,
      subject: 'Welcome to CancerVision360',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Welcome to CancerVision360</h2>
          <p>Hi ${user.firstName},</p>
          <p>Your account has been created. Here are your login credentials:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p><strong>Role:</strong> ${user.role}</p>
          </div>
          <p style="color: #dc2626; font-weight: bold;">⚠️ Please change your password after first login.</p>
          <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; padding: 10px 20px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            Login Now
          </a>
        </div>
      `
    });

    logger.info('User created by admin', {
      createdUserId: user._id,
      createdBy: (req as any).user.userId,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully. Welcome email sent.',
      data: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user (admin or self)
 * @route   PUT /api/users/:id
 * @access  Private (Admin or Self)
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestingUserId = (req as any).user.userId;
    const requestingUserRole = (req as any).user.role;

    const user = await User.findById(req.params.id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Authorization
    const isSelf = requestingUserId === user._id.toString();
    const isAdmin = requestingUserRole === 'admin';

    if (!isSelf && !isAdmin) {
      throw new ForbiddenError('You can only update your own profile');
    }

    // Fields that can be updated
    const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'institution', 'department'];
    
    // Admin can update role and active status
    if (isAdmin) {
      allowedFields.push('role', 'isActive');
    }

    // Update allowed fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        (user as any)[field] = req.body[field];
      }
    });

    await user.save();

    logger.info('User updated', {
      updatedUserId: user._id,
      updatedBy: requestingUserId
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Deactivate user (admin only)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin)
 */
export const deactivateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestingUserId = (req as any).user.userId;

    const user = await User.findById(req.params.id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Prevent self-deactivation
    if (requestingUserId === user._id.toString()) {
      throw new BadRequestError('You cannot deactivate your own account');
    }

    user.isActive = false;
    await user.save();

    logger.warn('User deactivated', {
      deactivatedUserId: user._id,
      deactivatedBy: requestingUserId
    });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Reset user password (admin only)
 * @route   POST /api/users/:id/reset-password
 * @access  Private (Admin)
 */
export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate new temp password
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(tempPassword, salt);
    await user.save();

    // Send email
    await sendEmail({
      to: user.email,
      subject: 'Password Reset - CancerVision360',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Password Reset</h2>
          <p>Hi ${user.firstName},</p>
          <p>Your password has been reset by an administrator.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>New Temporary Password:</strong> ${tempPassword}</p>
          </div>
          <p style="color: #dc2626;">⚠️ Please change this password immediately after logging in.</p>
        </div>
      `
    });

    logger.info('Password reset by admin', {
      userId: user._id,
      resetBy: (req as any).user.userId
    });

    res.json({
      success: true,
      message: 'Password reset successfully. Email sent to user.'
    });
  } catch (err) {
    next(err);
  }
};
