import * as jwt from "jsonwebtoken";
import { jwtConfig, JWTPayload } from "../config/jwt";

export const generateAccessToken = (payload: JWTPayload): string => {
  const options: jwt.SignOptions = {
    expiresIn: jwtConfig.accessToken.expiresIn as jwt.SignOptions['expiresIn'],
    issuer: jwtConfig.options.issuer,
    audience: jwtConfig.options.audience
  };

  return jwt.sign(payload, jwtConfig.accessToken.secret, options);
};


//refresh token genearation
export const generateRefreshToken = (payload: JWTPayload): string => {
 
    const options : jwt.SignOptions = {
      expiresIn: jwtConfig.refreshToken.expiresIn as jwt.SignOptions['expiresIn'],
      issuer: jwtConfig.options.issuer,
      audience: jwtConfig.options.audience
    }
   return jwt.sign(
    payload,
    jwtConfig.refreshToken.secret,options); 
};

//verify access token
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(
      token,
      jwtConfig.accessToken.secret,
      {
        issuer: jwtConfig.options.issuer,
        audience: jwtConfig.options.audience
      }
    ) as JWTPayload;
    
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

//verify refresh token

export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(
      token,
      jwtConfig.refreshToken.secret,
      {
        issuer: jwtConfig.options.issuer,
        audience: jwtConfig.options.audience
      }
    ) as JWTPayload;
    
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    } else {
      throw new Error('Refresh token verification failed');
    }
  }
};


//decode token without verification -- this is only for debugging . will be replaced for authentication
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};