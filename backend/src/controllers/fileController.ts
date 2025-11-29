// backend/src/controllers/fileController.ts
import { Request,Response,NextFunction } from "express";
import { ValidationError } from "../utils/errors";
const {v4:uuidv4} = require('uuid');
const fs= require('fs');
const path = require('path');

const allowedTypes = ['']
const max_file_size= 0
// 1. START UPLOAD SESSION
export const startUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract from req.body: fileName, fileType, totalSize, fileHash
    const {fileName,fileType,totalSize,fileHash} = req.body;
    // Validate: fileType in allowed list, totalSize < MAX_FILE_SIZE
    if(!allowedTypes.includes(fileType)){
      throw new ValidationError('File type is not supported')

    }
    if(!(totalSize<max_file_size)){
      throw new ValidationError('file size is larger than max allowed size')
    }
    // Generate: unique sessionId
    const uniqueSessionId= uuidv4();

    // Create: temporary folder in uploads/sessions/{sessionId}
    const createTempraryFolder = (uniqueSessionId : any) =>{
      const baseDir= path.join(__dirname,'uploads','sessions');
      const sessionDir = path.join(baseDir,uniqueSessionId);
      if(!fs.existsSync(baseDir)){
        fs.mkdirSync(baseDir,{recursive :true })
      }

      if(!fs.existsSync(sessionDir)){
        fs.mkdirSync(sessionDir,{recursive: {true}})
      }

      
    }
    // Save: metadata in database or temp file
    const metaData = {
      fileType : fileType,
      fileName: fileName,
      size : totalSize
    }
    // Return: { sessionId, uploadedChunks: 0 }
  } catch (err) { next(err); }
};

// 2. UPLOAD CHUNK
export const uploadChunk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract: sessionId, chunkNumber, file (from multer)
    // Validate: sessionId exists, chunkNumber correct
    // Save: chunk to uploads/sessions/{sessionId}/chunk-{chunkNumber}
    // Return: { chunkNumber, nextChunkExpected: chunkNumber + 1 }
  } catch (err) { next(err); }
};

// 3. COMPLETE UPLOAD
export const completeUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract: sessionId, fileHash (from frontend)
    // Verify: all chunks exist
    // Merge: all chunks into final file
    // Validate: final file hash matches, type correct, size correct
    // Store: metadata in Prediction or File collection
    // Cleanup: delete temp folder
    // Return: { fileId, message: 'Upload complete' }
  } catch (err) { next(err); }
};
