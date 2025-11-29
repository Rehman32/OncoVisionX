import { bucket } from "../config/gridfs";
import crypto from "crypto";
import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";

export const uploadFile = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) return next(new Error("No file uploaded"));

  const randomName = crypto.randomBytes(16).toString("hex");

  const uploadStream = bucket.openUploadStream(randomName, {
    metadata: {
      uploadedBy: req.user?.userId,
      patientId: req.body.patientId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    },
  });

  uploadStream.end(req.file.buffer);

  uploadStream.on("finish", (file) => {
    res.status(201).json({
      success: true,
      fileId: file._id,
      filename: file.filename,
      metadata: file.metadata,
    });
  });

  uploadStream.on("error", (err) => next(err));
};

export const getFile = (req: Request, res: Response, next: NextFunction) => {
  const id = new mongoose.Types.ObjectId(req.params.id);

  const stream = bucket.openDownloadStream(id);

  stream.on("error", () => next(new Error("File not found")));

  stream.pipe(res);
};
