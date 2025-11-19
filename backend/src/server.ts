import dotenv from 'dotenv';
import app from './app';
import connectDatabase from './config/database';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['NODE_ENV', 'PORT', 'MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

// Start the server
 
const startServer = async () => {
  try {
    // Connect to database first
    await connectDatabase();
    
    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(` API URL: http://localhost:${PORT}/api`);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      console.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });
    
    // Handle SIGTERM signal (graceful shutdown)
    process.on('SIGTERM', () => {
      console.log(' SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated');
      });
    });
    
  } catch (error: any) {
    console.error(` Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

// Start the server
startServer();
