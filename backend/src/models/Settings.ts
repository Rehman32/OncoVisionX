import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  userId: mongoose.Types.ObjectId;
  
  notifications: {
    email: {
      predictions: boolean;
      systemAlerts: boolean;
      weeklyReports: boolean;
    };
    inApp: {
      predictions: boolean;
      systemAlerts: boolean;
      messages: boolean;
    };
  };
  
  privacy: {
    profileVisibility: 'public' | 'private' | 'institution';
    dataSharing: boolean;
    analyticsTracking: boolean;
  };
  
  display: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timeFormat: '12h' | '24h';
    dateFormat: string;
  };
  
  roleSpecific?: any;
  
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginAlerts: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    
    notifications: {
      email: {
        predictions: { type: Boolean, default: true },
        systemAlerts: { type: Boolean, default: true },
        weeklyReports: { type: Boolean, default: false },
      },
      inApp: {
        predictions: { type: Boolean, default: true },
        systemAlerts: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
      },
    },
    
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'institution'],
        default: 'private',
      },
      dataSharing: { type: Boolean, default: false },
      analyticsTracking: { type: Boolean, default: true },
    },
    
    display: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      language: { type: String, default: 'en' },
      timeFormat: {
        type: String,
        enum: ['12h', '24h'],
        default: '12h',
      },
      dateFormat: { type: String, default: 'MMM DD, YYYY' },
    },
    
    roleSpecific: Schema.Types.Mixed,
    
    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      sessionTimeout: { type: Number, default: 30 },
      loginAlerts: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model<ISettings>('Settings', SettingsSchema);