import nodemailer from 'nodemailer';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email using SMTP
 * 
 * For production, use services like:
 * - SendGrid
 * - AWS SES
 * - Mailgun
 * - Postmark
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    logger.info('Email sent successfully', { to: options.to, subject: options.subject });
  } catch (error: any) {
    logger.error('Failed to send email', { error: error.message, to: options.to });
    throw new Error('Email sending failed');
  }
};
