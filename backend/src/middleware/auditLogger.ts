import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';

/**
 * Fields that must NEVER be logged in audit records.
 */
const REDACTED_FIELDS = new Set([
  'password',
  'newPassword',
  'currentPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'otp',
  'secret',
]);

/**
 * Patterns in field names that indicate binary/heavy data to strip entirely.
 */
const BINARY_PATTERNS = [
  'base64',
  'b64',
  'buffer',
  'image',
  'file',
  'saliency',
];

const MAX_BODY_SIZE = 2048; // Truncate logged body to 2KB max

/**
 * Sanitizes a request body object before saving to audit logs.
 * - Masks sensitive credential fields with '***REDACTED***'
 * - Strips binary/heavy data fields entirely
 * - Truncates the serialized result to MAX_BODY_SIZE
 */
function sanitizeBody(body: any): Record<string, any> {
  if (!body || typeof body !== 'object') return {};

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(body)) {
    const lowerKey = key.toLowerCase();

    // Mask credentials
    if (REDACTED_FIELDS.has(key)) {
      sanitized[key] = '***REDACTED***';
      continue;
    }

    // Strip binary/heavy data
    if (BINARY_PATTERNS.some((pattern) => lowerKey.includes(pattern))) {
      sanitized[key] = '[BINARY_DATA_STRIPPED]';
      continue;
    }

    // Recurse into nested objects (one level deep)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeBody(value);
      continue;
    }

    // Truncate long string values
    if (typeof value === 'string' && value.length > 500) {
      sanitized[key] = value.substring(0, 500) + '...[TRUNCATED]';
      continue;
    }

    sanitized[key] = value;
  }

  // Final size check — truncate entire serialized body if too large
  const serialized = JSON.stringify(sanitized);
  if (serialized.length > MAX_BODY_SIZE) {
    return { _truncated: true, _preview: serialized.substring(0, MAX_BODY_SIZE) };
  }

  return sanitized;
}

/**
 * Audit logger middleware factory.
 * Logs non-GET requests to the AuditLog collection with sanitized body.
 */
export const auditLogger = (action: string, resource: string) =>
  async (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', async () => {
      try {
        if (req.user && req.method !== 'GET') {
          await AuditLog.create({
            user: req.user.userId,
            action,
            resource,
            resourceId: req.params.id || undefined,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || undefined,
            statusCode: res.statusCode,
            details: { body: sanitizeBody(req.body) },
          });
        }
      } catch (err) {
        console.error('Failed to write audit log:', err);
      }
    });
    next();
  };
