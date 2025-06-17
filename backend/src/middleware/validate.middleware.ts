import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

/**
 * Middleware to handle validation results from express-validator
 */
export const validateRequest = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map((error: ValidationError) => ({
      field: 'param' in error ? error.param : 'unknown',
      message: error.msg,
      value: 'value' in error ? error.value : undefined,
      location: 'location' in error ? error.location : undefined
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors,
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  next();
};