import dotenv from 'dotenv';
import connectDatabase from './config/database';
import app from './app';
dotenv.config();

// validate required env variables
const requiredEnvVar = ['NODE_ENV','PORT','JWT_SECRET','MONGODB_URI'];
const missingEnvVar = requiredEnvVar.filter((envVar)=> !process.env[envVar]);

if (missingEnvVar.length > 0) {
    console.error(` Missing required environment variables: ${missingEnvVar.join(', ')}`);
    process.exit(1);
};

const PORT = process.env.PORT || 5000;

//start the server
const startServer = async () => {
    try {
        await connectDatabase();
        const server = app.listen(PORT,() => {
             console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            console.log(` API URL: http://localhost:${PORT}/api`);
        });

    // handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      console.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });
    
    // handle SIGTERM signal 
    process.on('SIGTERM', () => {
      console.log(' SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated');
      });
    });
    } catch (error : any) {
        console.error(`❌ Server startup failed: ${error.message}`);
    process.exit(1);
    }
}

// Start the server
startServer();
