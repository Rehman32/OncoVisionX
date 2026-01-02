import { Request,Response,NextFunction } from "express";
import User from "../models/User";
import { verifyAccessToken } from "../utils/jwt";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";

declare global {
    namespace Express{
        interface Request{
            user? : {
                userId : string;
                email : string;
                role : 'admin' | 'doctor' | 'researcher'
            }
        }
    }
}

//protect routes
export const protect =async (req:Request,res:Response,next:NextFunction) :Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')){
            throw new UnauthorizedError('No token is provided. Please Log in ')
        }
        const token = authHeader.split(' ')[1];

        if(!token){
            throw new UnauthorizedError('Invalid format of token');
        }

        //verify token
        const decoded = verifyAccessToken(token);

        const user = await User.findById(decoded.userId);

        if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is deactivated');
    }

    req.user ={
        userId : decoded.userId,
        email: decoded.email,
        role: decoded.role
    };
    next();

    } catch (error) {
        next(error);
    }
};

//authorize based on user roles
export const authorize = (...roles: ('admin' | 'doctor' | 'researcher')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
     
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }

     
    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next(); 
  };
};


//Optional authentication 
 
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
          
        }
      }
    }

    next(); 
  } catch (error) {
    next(error);
  }
};