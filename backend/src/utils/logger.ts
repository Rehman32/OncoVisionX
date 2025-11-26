import winston from 'winston';

const { combine, timestamp, json, errors, colorize, printf } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp(),
  printf(({ level, message, timestamp, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ''
    }`;
  })
);

const prodFormat = combine(
  errors({ stack: true }),
  timestamp(),
  json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'development' ? devFormat : prodFormat,
  transports: [new winston.transports.Console()]
});
