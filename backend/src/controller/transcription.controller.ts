import axios from "axios";
import { Request, Response } from "express";
import { supabase } from "../utils/supabase/client";

const baseUrl = "https://api.assemblyai.com";

interface TranscriptionRequest {
    userId: string;
    audioUrl: string;
    fileName?: string;
}

interface TranscriptionResult {
    id: string;
    text: string;
    status: 'queued' | 'processing' | 'completed' | 'error';
    confidence?: number;
    audio_duration?: number;
    words?: any[];
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    timestamp: string;
}

// Helper function to create consistent API responses
const createResponse = <T>(
    success: boolean, 
    message: string, 
    data?: T, 
    error?: string
): ApiResponse<T> => ({
    success,
    message,
    data,
    error,
    timestamp: new Date().toISOString()
});

const transcribeAudio = async (req: Request, res: Response) => {
    try {
        const { userId, audioUrl, fileName }: TranscriptionRequest = req.body;

        // Validate required fields
        if (!userId || !audioUrl) {
            return res.status(400).json(
                createResponse(false, "Missing required fields: userId and audioUrl")
            );
        }

        // Verify user authentication
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        if (userError || !userData.user) {
            return res.status(401).json(
                createResponse(false, "Invalid or unauthorized user", null, userError?.message)
            );
        }

        const headers = {
            authorization: process.env.ASSEMBLY_AI_AUTHORIZATION_KEY,
        };

        if (!process.env.ASSEMBLY_AI_AUTHORIZATION_KEY) {
            return res.status(500).json(
                createResponse(false, "Assembly AI API key not configured")
            );
        }

        // Start transcription
        const transcriptionResponse = await axios.post(`${baseUrl}/v2/transcript`, {
            audio_url: audioUrl,
            speech_model: "universal",
            speaker_labels: true, // Enable speaker detection
            auto_highlights: true, // Enable key phrase detection
            sentiment_analysis: true, // Enable sentiment analysis
        }, { headers });

        const transcriptId = transcriptionResponse.data.id;

        // Save initial transcription record to database
        const { data: transcriptionRecord, error: dbError } = await supabase
            .from('transcriptions')
            .insert({
                id: transcriptId,
                user_id: userId,
                audio_url: audioUrl,
                file_name: fileName || 'Untitled',
                status: 'processing',
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json(
                createResponse(false, "Failed to save transcription record", null, dbError.message)
            );
        }

        // Return success response with transcription details
        res.status(202).json(
            createResponse(true, "Transcription started successfully", {
                transcriptionId: transcriptId,
                status: "processing",
                fileName: fileName || 'Untitled',
                audioUrl: audioUrl,
                estimatedTime: "2-5 minutes",
                features: {
                    speakerLabels: true,
                    autoHighlights: true,
                    sentimentAnalysis: true
                }
            })
        );

        // Continue processing in background
        processTranscriptionInBackground(transcriptId, userId, headers);

    } catch (error: any) {
        console.error('Transcription error:', error.message);
        res.status(500).json(
            createResponse(false, "Error starting transcription", null, error.message)
        );
    }
};

// Background processing function
const processTranscriptionInBackground = async (
    transcriptId: string, 
    userId: string, 
    headers: any
) => {
    const pollingEndpoint = `${baseUrl}/v2/transcript/${transcriptId}`;
    const maxAttempts = 60; // 5 minutes max polling
    let attempts = 0;

    try {
        while (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
            
            const pollingResponse = await axios.get(pollingEndpoint, { headers });
            const transcriptionResult = pollingResponse.data;
            attempts++;

            if (transcriptionResult.status === "completed") {
                // Update database with completed transcription
                await supabase
                    .from('transcriptions')
                    .update({
                        status: 'completed',
                        text: transcriptionResult.text,
                        confidence: transcriptionResult.confidence,
                        audio_duration: transcriptionResult.audio_duration,
                        words: transcriptionResult.words,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', transcriptId);

                console.log(`Transcription ${transcriptId} completed successfully`);
                return transcriptionResult.text;
                break;

            } else if (transcriptionResult.status === "error") {
                // Update database with error status
                await supabase
                    .from('transcriptions')
                    .update({
                        status: 'error',
                        error_message: transcriptionResult.error,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', transcriptId);

                console.error(`Transcription ${transcriptId} failed:`, transcriptionResult.error);
                break;
            }
        }

        if (attempts >= maxAttempts) {
            // Timeout - update database
            await supabase
                .from('transcriptions')
                .update({
                    status: 'error',
                    error_message: 'Transcription timeout - processing took longer than expected',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', transcriptId);
        }

    } catch (error: any) {
        console.error(`Background processing error for ${transcriptId}:`, error.message);
        
        // Update database with error
        await supabase
            .from('transcriptions')
            .update({
                status: 'error',
                error_message: error.message,
                updated_at: new Date().toISOString(),
            })
            .eq('id', transcriptId);
    }
};

// Get transcription status
const getTranscriptionStatus = async (req: Request, res: Response) => {
    try {
        const { transcriptionId } = req.params;
        const { userId } = req.query;

        if (!transcriptionId || !userId) {
            return res.status(400).json(
                createResponse(false, "Missing required parameters: transcriptionId and userId")
            );
        }

        const { data, error } = await supabase
            .from('transcriptions')
            .select('*')
            .eq('id', transcriptionId)
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return res.status(404).json(
                createResponse(false, "Transcription not found or access denied", null, error?.message)
            );
        }

        // Format response based on status
        let statusMessage = "";
        let additionalInfo = {};

        switch (data.status) {
            case 'processing':
                statusMessage = "Transcription is currently being processed";
                additionalInfo = {
                    estimatedCompletion: "1-3 minutes remaining",
                    progress: "In progress"
                };
                break;
            case 'completed':
                statusMessage = "Transcription completed successfully";
                additionalInfo = {
                    wordCount: data.text ? data.text.split(' ').length : 0,
                    duration: data.audio_duration ? `${Math.round(data.audio_duration / 60)} minutes` : 'Unknown',
                    confidence: data.confidence ? `${Math.round(data.confidence * 100)}%` : 'N/A'
                };
                break;
            case 'error':
                statusMessage = "Transcription failed";
                additionalInfo = {
                    errorReason: data.error_message || "Unknown error occurred"
                };
                break;
            default:
                statusMessage = "Transcription status unknown";
        }

        res.status(200).json(
            createResponse(true, statusMessage, {
                ...data,
                ...additionalInfo
            })
        );

    } catch (error: any) {
        console.error('Get transcription error:', error.message);
        res.status(500).json(
            createResponse(false, "Error retrieving transcription status", null, error.message)
        );
    }
};

// Get user's transcription history
const getTranscriptionHistory = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10, status, search } = req.query;

        // Validate userId
        if (!userId) {
            return res.status(400).json(
                createResponse(false, "Missing required parameter: userId")
            );
        }

        const offset = (Number(page) - 1) * Number(limit);
        
        // Build query with optional filters
        let query = supabase
            .from('transcriptions')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);

        // Add status filter if provided
        if (status && ['processing', 'completed', 'error'].includes(status as string)) {
            query = query.eq('status', status);
        }

        // Add search filter if provided
        if (search) {
            query = query.or(`file_name.ilike.%${search}%,text.ilike.%${search}%`);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + Number(limit) - 1);

        if (error) {
            return res.status(500).json(
                createResponse(false, "Error retrieving transcription history", null, error.message)
            );
        }

        // Calculate summary statistics
        const totalTranscriptions = count || 0;
        const currentPage = Number(page);
        const totalPages = Math.ceil(totalTranscriptions / Number(limit));
        const hasNextPage = currentPage < totalPages;
        const hasPreviousPage = currentPage > 1;

        // Format transcriptions with additional info
        const formattedTranscriptions = data?.map(transcription => ({
            ...transcription,
            duration: transcription.audio_duration 
                ? `${Math.round(transcription.audio_duration / 60)} min` 
                : 'Unknown',
            wordCount: transcription.text 
                ? transcription.text.split(' ').length 
                : 0,
            createdDate: new Date(transcription.created_at).toLocaleDateString(),
            statusDisplay: transcription.status.charAt(0).toUpperCase() + transcription.status.slice(1)
        }));

        res.status(200).json(
            createResponse(true, `Retrieved ${data?.length || 0} transcription(s) successfully`, {
                transcriptions: formattedTranscriptions,
                pagination: {
                    currentPage,
                    totalPages,
                    totalItems: totalTranscriptions,
                    itemsPerPage: Number(limit),
                    hasNextPage,
                    hasPreviousPage
                },
                summary: {
                    totalTranscriptions,
                    completedCount: data?.filter(t => t.status === 'completed').length || 0,
                    processingCount: data?.filter(t => t.status === 'processing').length || 0,
                    errorCount: data?.filter(t => t.status === 'error').length || 0
                },
                filters: {
                    status: status || 'all',
                    search: search || null
                }
            })
        );

    } catch (error: any) {
        console.error('Get history error:', error.message);
        res.status(500).json(
            createResponse(false, "Error retrieving transcription history", null, error.message)
        );
    }
};

export { transcribeAudio, getTranscriptionStatus, getTranscriptionHistory };