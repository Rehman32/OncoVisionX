import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { generateOTP, hashOTP, verifyOTP } from '../utils/otp';
import { sendEmail } from '../utils/email';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * @desc    Enable MFA for user account
 * @route   POST /api/mfa/enable
 * @access  Private
 */
export const enableMFA = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const user = await User.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.mfaEnabled) {
      throw new BadRequestError('MFA is already enabled');
    }

    // Enable MFA
    user.mfaEnabled = true;
    await user.save();

    logger.info('MFA enabled', { userId });

    res.json({
      success: true,
      message: 'MFA enabled successfully. You will receive OTP codes via email on login.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Disable MFA for user account
 * @route   POST /api/mfa/disable
 * @access  Private
 */
export const disableMFA = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { password } = req.body;

    if (!password) {
      throw new BadRequestError('Password is required to disable MFA');
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Verify password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      throw new UnauthorizedError('Invalid password');
    }

    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    await user.save();

    logger.info('MFA disabled', { userId });

    res.json({
      success: true,
      message: 'MFA disabled successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Send OTP code to user email
 * @route   POST /api/mfa/send-otp
 * @access  Public (but requires valid session/temp token)
 */
export const sendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new BadRequestError('Email is required');
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.mfaEnabled) {
      // SECURITY: Don't reveal if user exists or has MFA
      res.json({
        success: true,
        message: 'If MFA is enabled, an OTP has been sent to your email.',
      });
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    // Save to DB with 5-minute expiry
    user.emailOtpCode = otpHash;
    user.emailOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    // Send email
    await sendEmail({
      to: user.email,
      subject: 'Your Login Verification Code - CancerVision360',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Login Verification Code</h2>
          <p>Hi ${user.firstName},</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otp}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code expires in 5 minutes.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email and secure your account.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px;">CancerVision360 - AI-Powered Cancer Staging System</p>
        </div>
      `,
    });

    logger.info('OTP sent', { userId: user._id, email: user.email });

    res.json({
      success: true,
      message: 'If MFA is enabled, an OTP has been sent to your email.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Verify OTP code
 * @route   POST /api/mfa/verify-otp
 * @access  Public (but requires valid session/temp token)
 */
export const verifyOTPCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new BadRequestError('Email and OTP are required');
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      emailOtpExpires: { $gt: new Date() }, // Not expired
    });

    if (!user || !user.emailOtpCode) {
      throw new UnauthorizedError('Invalid or expired OTP');
    }

    // Verify OTP
    const isValid = verifyOTP(otp, user.emailOtpCode);

    if (!isValid) {
      logger.warn('Invalid OTP attempt', { userId: user._id, email });
      throw new UnauthorizedError('Invalid or expired OTP');
    }

    // Clear OTP after successful verification
    user.emailOtpCode = undefined;
    user.emailOtpExpires = undefined;
    await user.save();

    logger.info('OTP verified successfully', { userId: user._id });

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        userId: user._id,
        verified: true,
      },
    });
  } catch (err) {
    next(err);
  }
};
