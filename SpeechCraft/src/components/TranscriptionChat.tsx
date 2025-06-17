import React, { useState, useRef, useEffect, } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileAudio, Mic, Download, Copy, Clock, CheckCircle, AlertCircle, User, LogOut, ChevronDown, Play, Pause, Volume2 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { logout } from '../redux/slice/authSlice';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '../../utils/supabase/client';
import  { useTranscription } from '../hooks/useTranscription';

interface AudioFile {
  name: string;
  size: number;
  duration?: string;
  url?: string; // Added for playback
  blob?: Blob; // Added for recorded audio
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  audioFile?: AudioFile;
  transcription?: {
    text: string;
    confidence: number;
    status: 'processing' | 'completed' | 'error';
  };
}

const TranscriptionChat: React.FC = () => {
  const dispatch = useDispatch();
  const { user: userDetails } = useSelector((state: RootState) => state.user);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Welcome to SpeechCraft! Upload an audio file or record directly to get started with AI-powered transcription.',
      timestamp: new Date(),
    }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<{ [key: string]: number }>({});
  const [audioDurations, setAudioDurations] = useState<{ [key: string]: number }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);


  // Get user initials
  const getUserInitials = () => {
    if (!userDetails?.profile?.firstName || !userDetails?.profile?.lastName) {
      return 'U';
    }
    return `${userDetails.profile.firstName.charAt(0)}${userDetails.profile.lastName.charAt(0)}`.toUpperCase();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Audio playback functions
  const createAudioElement = (messageId: string, audioFile: AudioFile) => {
    if (audioRefs.current[messageId]) {
      return audioRefs.current[messageId];
    }

    const audio = new Audio();
    if (audioFile.url) {
      audio.src = audioFile.url;
    } else if (audioFile.blob) {
      audio.src = URL.createObjectURL(audioFile.blob);
    }

    audio.addEventListener('loadedmetadata', () => {
      setAudioDurations(prev => ({
        ...prev,
        [messageId]: audio.duration
      }));
    });

    audio.addEventListener('timeupdate', () => {
      setAudioProgress(prev => ({
        ...prev,
        [messageId]: (audio.currentTime / audio.duration) * 100
      }));
    });

    audio.addEventListener('ended', () => {
      setCurrentlyPlaying(null);
      setAudioProgress(prev => ({
        ...prev,
        [messageId]: 0
      }));
    });

    audioRefs.current[messageId] = audio;
    return audio;
  };

  const toggleAudioPlayback = (messageId: string, audioFile: AudioFile) => {
    const audio = createAudioElement(messageId, audioFile);

    if (currentlyPlaying === messageId) {
      audio.pause();
      setCurrentlyPlaying(null);
    } else {
      // Pause any currently playing audio
      if (currentlyPlaying) {
        const currentAudio = audioRefs.current[currentlyPlaying];
        if (currentAudio) {
          currentAudio.pause();
        }
      }

      audio.play();
      setCurrentlyPlaying(messageId);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userDetails?.profile?.id || 'anonymous'}/${fileName}`;

      // Convert file to array buffer for upload
      const arrayBuffer = await file.arrayBuffer();

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-audio')
        .upload(filePath, arrayBuffer, {
          contentType: file.type || 'audio/mpeg',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get signed URL for playback
      const { data: signedData, error: signedError } = await supabase.storage
        .from('user-audio')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signedError || !signedData?.signedUrl) {
        throw new Error(`Failed to generate signed URL: ${signedError?.message}`);
      }

      // Create user message with uploaded file info
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: `Uploaded audio file: ${file.name}`,
        timestamp: new Date(),
        audioFile: {
          name: file.name,
          size: file.size,
          duration: '0:00', // Will be updated when audio loads
          url: signedData.signedUrl // Use the signed URL from Supabase
        }
      };

      setMessages(prev => [...prev, userMessage]);

      // Show success message
      const successMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: `File uploaded successfully to Supabase! Processing transcription...`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, successMessage]);

      // Simulate transcription processing
      setTimeout(() => {
        const processingMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'assistant',
          content: 'Processing your audio file...',
          timestamp: new Date(),
          transcription: {
            text: '',
            confidence: 0,
            status: 'processing'
          }
        };
        setMessages(prev => [...prev, processingMessage]);

        //will transcribe file here 
        

        // Simulate completion
        setTimeout(() => {
          const completedMessage: Message = {
            id: (Date.now() + 3).toString(),
            type: 'assistant',
            content: 'Transcription completed successfully!',
            timestamp: new Date(),
            transcription: {
              text: "Hello, this is a sample transcription of your audio file. The AI has processed your speech and converted it into text with high accuracy. You can now copy, download, or edit this transcription as needed.",
              confidence: 0.96,
              status: 'completed'
            }
          };
          setMessages(prev => [...prev.slice(0, -1), completedMessage]);
        }, 3000);
      }, 1000);

      return {
        signedUrl: signedData.signedUrl,
        filePath: data.path,
      };

    } catch (error) {
      console.error('Upload error:', error);

      // Show error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);

      // Fallback to local URL for immediate playback
      const audioUrl = URL.createObjectURL(file);
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'user',
        content: `Local file: ${file.name} (Upload failed, using local preview)`,
        timestamp: new Date(),
        audioFile: {
          name: file.name,
          size: file.size,
          duration: '0:00',
          url: audioUrl
        }
      };
      setMessages(prev => [...prev, fallbackMessage]);
    }
  };

  const startRecording = async () => {
  try {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Your browser does not support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.');
    }

    // Request microphone access with better error handling
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      } 
    });

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    recordedChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'audio/wav' });
      const file = new File([blob], 'voice-recording.wav', { type: 'audio/wav' });

      // Upload the recorded file
      await handleFileUpload(file);

      // Clean up
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    setIsRecording(true);

    const recordingMessage: Message = {
      id: Date.now().toString(),
      type: 'system',
      content: '🎙️ Recording started... Click the microphone again to stop.',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, recordingMessage]);

  } catch (error) {
    console.error('Error starting recording:', error);
    
    let errorMessage = 'Failed to start recording. ';
    // Narrow error to type with 'name' and 'message'
    if (typeof error === 'object' && error !== null && 'name' in error && typeof (error as any).name === 'string') {
      const err = error as { name: string; message?: string };
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Microphone access was denied. Please allow microphone permissions in your browser settings and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No microphone found. Please connect a microphone and try again.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Microphone is already in use by another application. Please close other apps using the microphone and try again.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Microphone constraints could not be satisfied. Please try again.';
      } else if (err.name === 'SecurityError') {
        errorMessage += 'Recording is only allowed on secure connections (HTTPS). Please use HTTPS.';
      } else {
        errorMessage += err.message || 'Unknown error occurred.';
      }
    } else {
      errorMessage += (typeof error === 'string' ? error : 'Unknown error occurred.');
    }

    const errorMsg: Message = {
      id: Date.now().toString(),
      type: 'system',
      content: errorMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, errorMsg]);
  }
};

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadTranscription = (text: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const navigate = useNavigate();
  const handleViewProfile = () => {
    setShowProfileDropdown(false);
    console.log('View Profile clicked');
  };

  const handleLogout = () => {
    setShowProfileDropdown(false);
    dispatch(logout());
    navigate({ to: '/' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Fixed Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex-shrink-0 relative z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
             AI Transcription
            </h1>
            <p className="text-gray-600 text-sm">
              Welcome back, {userDetails?.profile?.firstName}! Upload audio or record to transcribe.
            </p>
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {getUserInitials()}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {showProfileDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                >
                  {/* User Info */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {userDetails?.profile?.firstName} {userDetails?.profile?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {userDetails?.profile?.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <motion.button
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                    onClick={handleViewProfile}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>View Profile</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ backgroundColor: '#fef2f2' }}
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Scrollable Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-3xl ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
                  <div
                    className={`rounded-2xl px-6 py-4 ${message.type === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : message.type === 'system'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-white border border-gray-200 shadow-sm'
                      }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>

                    {/* Audio File Info with Playback */}
                    {message.audioFile && (
                      <div className="mt-3 p-3 bg-black/10 rounded-lg space-y-3">
                        <div className="flex items-center space-x-3">
                          <FileAudio className="h-5 w-5" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{message.audioFile.name}</p>
                            <p className="text-xs opacity-75">
                              {(message.audioFile.size / (1024 * 1024)).toFixed(2)} MB
                              {message.audioFile.duration && ` • ${message.audioFile.duration}`}
                            </p>
                          </div>
                        </div>

                        {/* Audio Player */}
                        <div className="bg-black/5 rounded-lg p-3 space-y-2">
                          <div className="flex items-center space-x-3">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => toggleAudioPlayback(message.id, message.audioFile!)}
                              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                            >
                              {currentlyPlaying === message.id ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4 ml-0.5" />
                              )}
                            </motion.button>

                            <div className="flex-1">
                              <div className="w-full bg-black/10 rounded-full h-2">
                                <div
                                  className="bg-white/60 h-2 rounded-full transition-all duration-200"
                                  style={{
                                    width: `${audioProgress[message.id] || 0}%`
                                  }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center space-x-1">
                              <Volume2 className="h-3 w-3 opacity-60" />
                              <span className="text-xs opacity-75">
                                {audioDurations[message.id]
                                  ? formatTime(audioDurations[message.id])
                                  : message.audioFile.duration || '0:00'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Transcription Result */}
                    {message.transcription && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(message.transcription.status)}
                          <span className="text-sm font-medium">
                            {message.transcription.status === 'processing' && 'Processing...'}
                            {message.transcription.status === 'completed' && `Transcription (${Math.round(message.transcription.confidence * 100)}% confidence)`}
                            {message.transcription.status === 'error' && 'Transcription failed'}
                          </span>
                        </div>

                        {message.transcription.status === 'completed' && message.transcription.text && (
                          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <p className="text-gray-800 leading-relaxed">
                              {message.transcription.text}
                            </p>
                            <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => copyToClipboard(message.transcription!.text)}
                                className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 text-sm"
                              >
                                <Copy className="h-4 w-4" />
                                <span>Copy</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => downloadTranscription(message.transcription!.text, 'transcription.txt')}
                                className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 text-sm"
                              >
                                <Download className="h-4 w-4" />
                                <span>Download</span>
                              </motion.button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-2 px-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 flex-shrink-0 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Drag and Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 mb-4 text-center transition-colors duration-200 ${dragActive
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
              }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-700 font-medium">
                  Drop your audio file here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-purple-600 hover:text-purple-700 underline"
                  >
                    browse
                  </button>
                </p>
                <p className="text-gray-500 text-sm">
                  Supports MP3, WAV, M4A files up to 100MB
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-shadow duration-200"
            >
              <Upload className="h-5 w-5" />
              <span>Upload Audio</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRecording}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium border-2 transition-all duration-200 ${isRecording
                ? 'bg-red-500 text-white border-red-500 shadow-lg'
                : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                }`}
            >
              <Mic className={`h-5 w-5 ${isRecording ? 'animate-pulse' : ''}`} />
              <span>{isRecording ? 'Stop Recording' : 'Record Audio'}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionChat;