import { Request, Response, NextFunction } from "express";
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from "../utils/errors";
import User, { IUser } from "../models/User";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { userInfo } from "os";

export const register = async (
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
      department,
    } = req.body;

    if (!email || !password || !firstName || !lastName) {
      throw new BadRequestError("Please provide all required fields");
    }
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictError("User Already Exists ");
    }

    if (password.length < 8) {
      throw new BadRequestError("Password must be atleast 8 characters");
    }

    const user: IUser = await User.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role,
      phoneNumber,
      licenseNumber,
      institution,
      department,
    });

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const userResponse = user.toJSON();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};


//login user 

export const login = async (req:Request,res:Response,next:NextFunction) : Promise<void> => {
  try {
    const {email, password} = req.body;


    if(!email || !password){
      throw new BadRequestError("Email and password are required .")
    }

    const user =await User.findOne({email:email.toLowerCase()}).select('+password');

    if(!user){
      throw new UnauthorizedError("Invalid email or password")
    }

    if(!user.isActive){
      throw new BadRequestError("Your Account has been  deactivated , Please contact support. ")
    }

    const isPasswordValid = await user.comparePassword(password);

    if(!isPasswordValid){
      throw new UnauthorizedError("Password is Invalid. ")
    }

    user.lastLogin=new Date();

    await user.save();

    const accessToken = generateAccessToken(
      {
        userId : user._id.toString(),
        email: user.email,
        role: user.role
      }
    );

    const refreshToken = generateRefreshToken({
      userId:user._id.toString(),
      email : user.email,
      role : user.role
    });

    const userResponse =user.toJSON();

    res.status(200).json({
      success : true,
      message : 'Login Successful',
      data : {
        user: userResponse,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    next(error)
  }
};

//get current user 
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    
    const userId =  (req as any).user.userId;

    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};


//generate refresh token 
export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required');
    }

   
    const decoded = verifyRefreshToken(refreshToken);


    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      success: true,
      message: 'Access token refreshed',
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

//logout user
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // in a token-based system logout is handled at client-side
   
    res.status(200).json({
      success: true,
      message: 'Logout successful. Please delete tokens from client.'
    });
  } catch (error) {
    next(error);
  }
};

//update user profile
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const {
      firstName,
      lastName,
      phoneNumber,
      licenseNumber,
      institution,
      department
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (licenseNumber) user.licenseNumber = licenseNumber;
    if (institution) user.institution = institution;
    if (department) user.department = department;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

//change passowrd

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new BadRequestError('Please provide current and new password');
    }

    if (newPassword.length < 8) {
      throw new BadRequestError('New password must be at least 8 characters long');
    }

    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};