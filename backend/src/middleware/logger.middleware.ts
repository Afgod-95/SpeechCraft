// middleware/logger.middleware.ts
import { Request, Response, NextFunction } from 'express';

interface LogLevel {
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

const LOG_LEVELS: LogLevel = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

/**
 * Request logging middleware
 */
export const logger = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log request
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - Started`);
  
  // Log request body for POST/PUT requests (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const sanitizedBody = { ...req.body };
    delete sanitizedBody.password;
    delete sanitizedBody.token;
    console.log(`[${timestamp}] Request body:`, sanitizedBody);
  }

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    
    if (level === LOG_LEVELS.ERROR) {
      console.error(`[${new Date().toISOString()}] Error response:`, body);
    }
    
    return originalJson.call(this, body);
  };
  
  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  
  // Add security headers 
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};