import crypto from 'crypto';

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash OTP for storage (prevents DB leak exposure)
 */
export const hashOTP = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Verify OTP matches hash
 */
export const verifyOTP = (otp: string, hash: string): boolean => {
  return hashOTP(otp) === hash;
};
