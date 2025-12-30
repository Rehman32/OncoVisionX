import mongoose from 'mongoose';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

/**
 * Seed Root Admin Script
 * 
 * Usage: npm run seed:admin
 * 
 * This script creates the initial SuperAdmin account if one doesn't exist.
 * The root admin credentials are read from environment variables.
 * 
 * SECURITY: Never commit .env with real admin credentials.
 */

const seedRootAdmin = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not defined in environment');
    }

    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    // Check if root admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      logger.warn('⚠️  Root admin already exists. Skipping seed.');
      logger.info(`Existing admin email: ${existingAdmin.email}`);
      process.exit(0);
    }

    // Get credentials from environment
    const adminEmail = process.env.ROOT_ADMIN_EMAIL;
    const adminPassword = process.env.ROOT_ADMIN_PASSWORD;
    const adminFirstName = process.env.ROOT_ADMIN_FIRST_NAME || 'System';
    const adminLastName = process.env.ROOT_ADMIN_LAST_NAME || 'Administrator';

    if (!adminEmail || !adminPassword) {
      throw new Error(
        'ROOT_ADMIN_EMAIL and ROOT_ADMIN_PASSWORD must be defined in .env'
      );
    }

    // Validate password strength
    if (adminPassword.length < 12) {
      throw new Error(
        'ROOT_ADMIN_PASSWORD must be at least 12 characters for security'
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create root admin
    const rootAdmin = await User.create({
      email: adminEmail,
      password: hashedPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      role: 'admin',
      isEmailVerified: true, // Auto-verify root admin
      isActive: true,
    });

    logger.info('✅ Root admin created successfully!');
    logger.info(`Email: ${rootAdmin.email}`);
    logger.info(`ID: ${rootAdmin._id}`);
    logger.warn('⚠️  IMPORTANT: Change the password after first login!');

    process.exit(0);
  } catch (error: any) {
    logger.error('Failed to seed root admin', { error: error.message });
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedRootAdmin();
}

export default seedRootAdmin;
