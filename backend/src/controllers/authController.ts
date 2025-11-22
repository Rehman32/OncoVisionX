import { Request, Response, NextFunction } from "express";
import { BadRequestError, ConflictError, UnauthorizedError } from "../utils/errors";
import User, { IUser } from "../models/User";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
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

