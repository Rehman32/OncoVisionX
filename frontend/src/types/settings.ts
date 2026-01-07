export interface UserSettings {
  _id?: string;
  userId: string;
  
  // Notification Settings
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
  
  // Privacy Settings
  privacy: {
    profileVisibility: 'public' | 'private' | 'institution';
    dataSharing: boolean;
    analyticsTracking: boolean;
  };
  
  // Theme & Display
  display: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timeFormat: '12h' | '24h';
    dateFormat: string;
  };
  
  // Role-specific Settings
  roleSpecific?: {
    // Admin settings
    systemMonitoring?: {
      autoAlerts: boolean;
      alertThreshold: number;
    };
    
    // Doctor settings
    clinicalPreferences?: {
      defaultPatientView: 'list' | 'grid';
      autoSaveDrafts: boolean;
      predictionNotifications: boolean;
    };
    
    // Researcher settings
    researchPreferences?: {
      dataExportFormat: 'csv' | 'json' | 'xml';
      batchDownload: boolean;
      apiAccess: boolean;
    };
  };
  
  // Security
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number; // minutes
    loginAlerts: boolean;
  };
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SettingsUpdatePayload {
  notifications?: UserSettings['notifications'];
  privacy?: UserSettings['privacy'];
  display?: UserSettings['display'];
  roleSpecific?: UserSettings['roleSpecific'];
  security?: UserSettings['security'];
}