import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import User from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: 'admin' | 'doctor' | 'researcher';
      };
    }
  }
}


export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    // Format: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided. Please log in.');
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Invalid token format');
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check if user still exists
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('User account is deactivated');
    }

    // Attach user to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next(); // Proceed to next middleware/controller
  } catch (error) {
    next(error);
  }
};


export const authorize = (...roles: ('admin' | 'doctor' | 'researcher')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    // Check if user's role is in allowed roles
    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next(); // User is authorized, proceed
  };
};


export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        try {
          const decoded = verifyAccessToken(token);
          
          const user = await User.findById(decoded.userId);
          
          if (user && user.isActive) {
            req.user = {
              userId: decoded.userId,
              email: decoded.email,
              role: decoded.role
            };
          }
        } catch (error) {
          // Token invalid, but that's okay for optional auth
          // Just proceed without user
        }
      }
    }

    next(); // Always proceed, with or without user
  } catch (error) {
    next(error);
  }
};
