export interface JWTPayload {
    userId: string;
    email : string;
    role : 'admin' | 'doctor' | 'researcher';
    iat? : number;
    exp? : number ;
}

export const jwtConfig = {
    accessToken  : {
        secret : process.env.JWT_SECRET as string ||  'fallback-secret-change-in-production',
        expiresIn : process.env.JWT_EXPIRE as string || '7d'
    },

    refreshToken : {
        secret : process.env.JWT_REFRESH_SECRET as string ||  'fallback-refresh-secret',
        expiresIn : process.env.JWT_REFRESH_EXPIRE as string || '30d' 

    },

    options: {
    issuer: 'OncoVisionX', 
    audience: 'OncoVisionX-users' 
  }
}

export const validateJWTConfig = () : void => {
    if(process.env.NODE_ENV === 'production'){
        if(!process.env.JWT_SECRET || process.env.JWT_SECRET === 'fallback-secret-change-in-production'){
            throw new Error('JWT_SECRET must be set in production')
        }
        if(!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET ===  'fallback-refresh-secret'){
            throw new Error('JWT_REFRESH_SECRET must be set in production')
        }
        
    }
}