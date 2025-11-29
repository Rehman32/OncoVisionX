import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

export let bucket: GridFSBucket;

export const initGridFS = () => {
  const conn = mongoose.connection;

  bucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads",
  });

  console.log("GridFS Initialized");
};
