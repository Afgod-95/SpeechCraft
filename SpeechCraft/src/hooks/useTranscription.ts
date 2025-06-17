import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase/client';

export interface Transcription {
  id: string;
  user_id: string;
  audio_url: string;
  file_name: string;
  type: 'user' | 'assistant' | 'system';
  audio_duration?: number;
  error_message?: string;
  timestamp: Date;
  created_at: string;
  updated_at: string;
  content: string;
  status: 'processing' | 'completed' | 'error';
  transcription?: {
    text: string;
    confidence: number;
    status: 'processing' | 'completed' | 'error';
  };
}

interface UseTranscriptionReturn {
  transcriptions: Transcription[];
  setTranscriptions: React.Dispatch<React.SetStateAction<Transcription[]>>;
  loading: boolean;
  error: string | null;
  startTranscription: (user_id: string, audioUrl: string, fileName?: string) => Promise<string | null>;
  getTranscriptionStatus: (id: string) => Transcription | undefined;
  deleteTranscription: (id: string) => Promise<boolean>;
  refreshTranscriptions: () => Promise<void>;
}

export const useTranscription = (userId: string): UseTranscriptionReturn => {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial transcriptions
  const fetchTranscriptions = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to ensure proper date handling
      const transformedData = (data || []).map(item => ({
        ...item,
        timestamp: new Date(item.created_at),
      }));
      
      setTranscriptions(transformedData);
      setError(null);
    } catch (err: unknown) {
      console.error('Error fetching transcriptions:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching transcriptions');
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Refresh transcriptions (public method)
  const refreshTranscriptions = useCallback(async () => {
    await fetchTranscriptions();
  }, [fetchTranscriptions]);

  // Set up realtime subscription
  useEffect(() => {
    if (!userId) return;

    fetchTranscriptions();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel(`transcriptions-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transcriptions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Realtime transcription update:', payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;

          setTranscriptions(prev => {
            switch (eventType) {
              case 'INSERT': {
                const insertRecord = {
                  ...newRecord,
                  timestamp: new Date(newRecord.created_at),
                } as Transcription;
                return [insertRecord, ...prev];
              }
              
              case 'UPDATE': {
                const updateRecord = {
                  ...newRecord,
                  timestamp: new Date(newRecord.created_at),
                } as Transcription;
                return prev.map(t => 
                  t.id === newRecord.id ? updateRecord : t
                );
              }
              
              case 'DELETE': {
                return prev.filter(t => t.id !== oldRecord?.id);
              }
              
              default:
                return prev;
            }
          });

          // Show notification for completed transcriptions
          if (eventType === 'UPDATE' && newRecord.status === 'completed') {
            console.log(`Transcription "${newRecord.file_name}" completed!`);
            // You can integrate with a toast notification library here
            // toast.success(`Transcription "${newRecord.file_name}" completed!`);
          }

          if (eventType === 'UPDATE' && newRecord.status === 'error') {
            console.error(`Transcription "${newRecord.file_name}" failed:`, newRecord.error_message);
            // toast.error(`Transcription "${newRecord.file_name}" failed`);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, fetchTranscriptions]);

  // Start new transcription
  const startTranscription = async (
    user_id: string, 
    audioUrl: string, 
    fileName?: string
  ): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/transcriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id,
          audioUrl,
          filename: fileName || 'audio-file',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Transcription started successfully:', result);
      
      // Return the transcription ID or text based on your API response structure
      return result.text || result.id || 'success';
      
    } catch (err: unknown) {
      console.error('Error starting transcription:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start transcription';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get specific transcription status
  const getTranscriptionStatus = (id: string): Transcription | undefined => {
    return transcriptions.find(t => t.id === id);
  };

  // Delete transcription
  const deleteTranscription = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      // First, get the transcription to delete associated audio file
      const transcription = transcriptions.find(t => t.id === id);
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('transcriptions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (dbError) throw dbError;

      // If there's an associated audio file, try to delete it from storage
      if (transcription?.audio_url) {
        try {
          // Extract file path from URL if it's a Supabase storage URL
          const url = new URL(transcription.audio_url);
          const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/user-audio\/(.+)/);
          if (pathMatch) {
            const filePath = pathMatch[1];
            const { error: storageError } = await supabase.storage
              .from('user-audio')
              .remove([filePath]);
            
            if (storageError) {
              console.warn('Failed to delete audio file from storage:', storageError);
            }
          }
        } catch (storageErr) {
          console.warn('Failed to parse audio URL or delete from storage:', storageErr);
        }
      }

      return true;
    } catch (err: unknown) {
      console.error('Error deleting transcription:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while deleting transcription');
      }
      return false;
    }
  };

  return {
    transcriptions,
    setTranscriptions,
    loading,
    error,
    startTranscription,
    getTranscriptionStatus,
    deleteTranscription,
    refreshTranscriptions,
  };
};