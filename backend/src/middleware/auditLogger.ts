import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';

export const auditLogger = (action: string, resource: string) =>
  async (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', async () => {
      if (req.user && req.method !== 'GET') { 
        await AuditLog.create({
          user: req.user.userId,
          action,
          resource,
          resourceId: req.params.id || undefined,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || undefined,
          statusCode: res.statusCode,
          details: { body: req.body }
        });
      }
    });
    next();
  };
