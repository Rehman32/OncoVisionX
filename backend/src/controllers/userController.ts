import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import { NotFoundError } from "../utils/errors";

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const query = search
      ? {
          $or: [
            { firstName: { $regex: new RegExp(search as string, "i") } },
            { lastName: { $regex: new RegExp(search as string, "i") } },
            { email: { $regex: new RegExp(search as string, "i") } },
          ],
        }
      : {};

    const users = await User.find(query)
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .sort({ createdAt: -1 })
      .select("-password");
    const total = await User.countDocuments(query);
    res.json({
      success: true,
      data: users,
      meta: { total, page: +page, limit: +limit },
    });
  } catch (error) {
    next(error);
  }
};



// Read user by ID
export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) throw new NotFoundError("User not found");
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// Update user (Admin)
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const fields = [
      "firstName",
      "lastName",
      "role",
      "phoneNumber",
      "institution",
      "department",
      "isActive",
    ];
    const updates: any = {};
    fields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!user) throw new NotFoundError("User not found");
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// Delete/Deactivate user (soft-delete)
export const deactivateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) throw new NotFoundError("User not found");
    res.json({ success: true, message: "User deactivated" });
  } catch (err) {
    next(err);
  }
};

// =ReActivate user
export const activateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    if (!user) throw new NotFoundError("User not found");
    res.json({ success: true, message: "User activated" });
  } catch (err) {
    next(err);
  }
};
