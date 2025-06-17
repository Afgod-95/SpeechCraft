// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../utils/supabase/client';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
        [key: string]: any;
      };
    }
  }
}

interface JWTPayload {
  sub: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to authenticate users using JWT tokens
 * Supports both Supabase tokens and custom JWT tokens
 */
export const authenticateUser = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    // Check if authorization header exists
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Authorization header is required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Use: Bearer <token>',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Try Supabase authentication first
    try {
      const { data: { user }, error: supabaseError } = await supabase.auth.getUser(token);
      
      if (!supabaseError && user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role || 'user',
          ...user.user_metadata
        };
        next();
        return;
      }
    } catch (supabaseError) {
      console.log('Supabase auth failed, trying JWT verification');
    }

    // Fallback to JWT verification
    if (!process.env.JWT_SECRET) {
      res.status(500).json({
        success: false,
        message: 'JWT secret not configured',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
      
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role || 'user'
      };
      
      next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString()
      });
      return;
    }

  } catch (error: any) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication service error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'User not authenticated',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
      timestamp: new Date().toISOString()
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user owns the resource
 */
export const requireOwnership = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const resourceUserId = req.params[userIdParam] || req.query[userIdParam] || req.body[userIdParam];
    
    if (!resourceUserId) {
      res.status(400).json({
        success: false,
        message: `${userIdParam} is required`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // User can only access their own resources
    if (req.user.id !== resourceUserId) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

// middleware/validation.middleware.ts


/**
 * Rate limiting middleware for specific endpoints
 */
export const createRateLimit = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  max: number = 100,
  message: string = 'Too many requests from this IP'
) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Clean up old entries
    for (const [key, value] of requests.entries()) {
      if (now > value.resetTime) {
        requests.delete(key);
      }
    }

    const userRequests = requests.get(ip);
    
    if (!userRequests) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (now > userRequests.resetTime) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (userRequests.count >= max) {
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
        timestamp: new Date().toISOString()
      });
      return;
    }

    userRequests.count++;
    next();
  };
};



/**
 * Async error wrapper to catch async errors in route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

