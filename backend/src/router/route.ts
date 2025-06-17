import express, { RequestHandler, Request, Response } from 'express';
import { 
  transcribeAudio, 
  getTranscriptionStatus, 
  getTranscriptionHistory 
} from '../controller/transcription.controller'
import { authenticateUser } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { body, param, query } from 'express-validator';
import { supabase } from '../utils/supabase/client';

const router = express.Router();

// Validation middleware for transcription requests
const validateTranscriptionRequest = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string'),
  
  body('audioUrl')
    .notEmpty()
    .withMessage('Audio URL is required')
    .isURL()
    .withMessage('Audio URL must be a valid URL'),
  
  body('fileName')
    .optional()
    .isString()
    .withMessage('File name must be a string')
    .isLength({ max: 255 })
    .withMessage('File name must be less than 255 characters'),
];

const validateStatusRequest = [
  param('transcriptionId')
    .notEmpty()
    .withMessage('Transcription ID is required')
    .isString()
    .withMessage('Transcription ID must be a string'),
  
  query('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string'),
];

const validateHistoryRequest = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['processing', 'completed', 'error'])
    .withMessage('Status must be one of: processing, completed, error'),
  
  query('search')
    .optional()
    .isString()
    .withMessage('Search term must be a string')
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters'),
];

/**
 * @route POST /api/transcriptions
 * @description Start a new transcription
 * @access Private
 * @example
 * POST /api/transcribe
 * {
 *   "userId": "user123",
 *   "audioUrl": "https://example.com/audio.mp3",
 *   "fileName": "meeting_recording.mp3"
 * }
 */
router.post(
  '/transcribe',
  
  validateTranscriptionRequest,
  validateRequest,
  transcribeAudio as RequestHandler
);

/**
 * @route GET /api/transcriptions/:transcriptionId/status
 * @description Get transcription status and details
 * @access Private
 * @example
 * GET /api/transcriptions/abc123/status?userId=user123
 */
router.get(
  '/:transcriptionId/status',
  authenticateUser,
  validateStatusRequest,
  validateRequest,
  getTranscriptionStatus as RequestHandler
);

/**
 * @route GET /api/transcriptions/history/:userId
 * @description Get user's transcription history with pagination and filtering
 * @access Private
 * @example
 * GET /api/transcriptions/history/user123?page=1&limit=10&status=completed&search=meeting
 */
router.get(
  '/history/:userId',
  authenticateUser,
  validateHistoryRequest,
  validateRequest,
  getTranscriptionHistory as RequestHandler
);



/**
 * @route DELETE /api/transcriptions/:transcriptionId
 * @description Delete a transcription
 * @access Private
 */
router.delete(
  '/:transcriptionId',
  authenticateUser,
  param('transcriptionId').notEmpty().withMessage('Transcription ID is required'),
  query('userId').notEmpty().withMessage('User ID is required'),
  validateRequest,
  async (req, res): Promise<void> => {
    try {
      const { transcriptionId } = req.params;
      const { userId } = req.query;

      // Verify ownership
      const { data: transcription, error: fetchError } = await supabase
        .from('transcriptions')
        .select('id')
        .eq('id', transcriptionId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !transcription) {
        res.status(404).json({
          success: false,
          message: "Transcription not found or access denied",
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Delete transcription
      const { error: deleteError } = await supabase
        .from('transcriptions')
        .delete()
        .eq('id', transcriptionId)
        .eq('user_id', userId);

      if (deleteError) {
        res.status(500).json({
          success: false,
          message: "Failed to delete transcription",
          error: deleteError.message,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Transcription deleted successfully",
        data: { transcriptionId },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error deleting transcription",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @route GET /api/transcriptions/stats/:userId
 * @description Get user's transcription statistics
 * @access Private
 */
router.get(
  '/stats/:userId',
  authenticateUser,
  param('userId').notEmpty().withMessage('User ID is required'),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Get transcription statistics
      const { data, error } = await supabase
        .from('transcriptions')
        .select('status, audio_duration, created_at')
        .eq('user_id', userId);

      if (error) {
        res.status(500).json({
          success: false,
          message: "Failed to fetch transcription statistics",
          error: error.message,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const stats = {
        total: data.length,
        completed: data.filter(t => t.status === 'completed').length,
        processing: data.filter(t => t.status === 'processing').length,
        failed: data.filter(t => t.status === 'error').length,
        totalDuration: data
          .filter(t => t.audio_duration)
          .reduce((sum, t) => sum + (t.audio_duration || 0), 0),
        thisMonth: data.filter(t => {
          const created = new Date(t.created_at);
          const now = new Date();
          return created.getMonth() === now.getMonth() && 
                 created.getFullYear() === now.getFullYear();
        }).length
      };

      res.status(200).json({
        success: true,
        message: "Statistics retrieved successfully",
        data: {
          ...stats,
          totalDurationFormatted: `${Math.round(stats.totalDuration / 60)} minutes`,
          successRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error retrieving statistics",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Transcription service is healthy",
    timestamp: new Date().toISOString(),
    service: "transcription-api",
    version: "1.0.0"
  });
});

export default router;