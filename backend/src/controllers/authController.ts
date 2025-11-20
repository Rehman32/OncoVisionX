import { Request, Response, NextFunction } from "express";
import { BadRequestError, ConflictError } from "../utils/errors";
import User, { IUser } from "../models/User";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

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
