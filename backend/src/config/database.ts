import mongoose, { mongo } from "mongoose";
import { logger } from '../utils/logger';

//connect database
const connectDatabase = async (): Promise<void> => {
  try {
    const mongouri = process.env.MONGODB_URI;
    if (!mongouri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    //connection options
    const options = {
      maxPoolSize: 10,
      minPoolSize: 10,
      socketTimeoutMS: 45000,
      family: 4,
    };

    //connect to mongo db
    const conn = await mongoose.connect(mongouri, options);

    logger.info('MongoDB connected', {
      host: conn.connection.host,
      database: conn.connection.name,
    });

    //handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err instanceof Error ? err.message : err });
    });
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error:any) {
    logger.error('MongoDB connection failed', { error: error?.message ?? error });
    process.exit(1);
  }
};

//close database connection
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error: any) {
    logger.error('Error closing MongoDB connection', { error: error?.message ?? error });
  }
};

export default connectDatabase;