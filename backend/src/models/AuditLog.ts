import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  user: Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  statusCode: number;
  details?: Record<string, any>;
  timestamp: Date;
}


const AuditLogSchema = new Schema<IAuditLog>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'FAILED_LOGIN',
      'CREATE_PATIENT',
      'UPDATE_PATIENT',
      'DELETE_PATIENT',
      'VIEW_PATIENT',
      'UPLOAD_FILE',
      'DOWNLOAD_FILE',
      'DELETE_FILE',
      'CREATE_PREDICTION',
      'VIEW_PREDICTION',
      'DELETE_PREDICTION',
      'UPDATE_USER',
      'DELETE_USER',
      'CHANGE_PASSWORD'
    ],
    index: true
  },
  
  resource: {
    type: String,
    required: true,
    enum: ['user', 'patient', 'prediction', 'file', 'auth'],
    index: true
  },
  
  resourceId: String, // ID of the resource accessed
  
  ipAddress: String, // user's IP address
  
  userAgent: String, // browser/client information
  
  statusCode: {
    type: Number,
    required: true
  },
  
  details: Schema.Types.Mixed, // Additional context
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});


//indexes
AuditLogSchema.index({ user: 1, timestamp: -1 }); // user's actions over time
AuditLogSchema.index({ resource: 1, action: 1 }); // actions on specific resources

//TTL index to auto-delete old logs after 7 years 
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 220752000 }); // 7 years

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
