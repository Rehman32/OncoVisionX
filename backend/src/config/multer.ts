import multer from 'multer';
import fs from 'fs';
import { BadRequestError } from '../utils/errors';

const storage = multer.memoryStorage();

const fileFilter = (req:any , file : Express.Multer.File, cb:multer.FileFilterCallback) => {
  if(!file){
    cb(new BadRequestError('No file Provided'))

  }else{
    cb(null,true);
  }
  
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB per chunk
  }
});

