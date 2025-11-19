import mongoose, { mongo } from "mongoose";

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

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(` Database Name: ${conn.connection.name}`);


    //handle connection events 
    mongoose.connection.on("error", (err) => {
      console.error(` MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("  MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });
  } catch (error:any) {

    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};


//close database connection
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error: any) {
    console.error(`Error closing MongoDB connection: ${error.message}`);
  }
};

export default connectDatabase;