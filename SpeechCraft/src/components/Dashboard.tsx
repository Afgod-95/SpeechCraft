import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileAudio, Clock, CheckCircle, Download, Play } from 'lucide-react';
import { useMediaQuery } from 'react-responsive';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

interface Transcription {
  id: string;
  fileName: string;
  status: 'processing' | 'completed' | 'failed';
  duration: string;
  createdAt: string;
  size: string;
}

const Dashboard: React.FC = () => {
  const { user: userCredentials } = useSelector((state: RootState) => state.user)
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Mock transcription data
  const [transcriptions] = useState<Transcription[]>([
    {
      id: '1',
      fileName: 'meeting-recording.mp3',
      status: 'completed',
      duration: '45:32',
      createdAt: '2 hours ago',
      size: '12.5 MB'
    },
    {
      id: '2',
      fileName: 'interview-session.wav',
      status: 'processing',
      duration: '28:17',
      createdAt: '30 minutes ago',
      size: '8.2 MB'
    },
    {
      id: '3',
      fileName: 'podcast-episode.mp3',
      status: 'completed',
      duration: '1:23:45',
      createdAt: 'Yesterday',
      size: '25.1 MB'
    }
  ]);

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
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <div className="h-5 w-5 bg-red-500 rounded-full" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {userCredentials?.profile?.lastName}!
              </h1>
              <p className="text-gray-600 mt-1">
                Upload your audio files and get instant transcriptions
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {userCredentials?.profile?.firstName}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Audio File</h2>
          
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${
              dragActive
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop your audio file here, or{' '}
                  <label className="text-purple-600 cursor-pointer hover:text-purple-700">
                    browse
                    <input
                      type="file"
                      className="hidden"
                      accept="audio/*"
                      onChange={handleFileSelect}
                    />
                  </label>
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Supports MP3, WAV, M4A files up to 100MB
                </p>
              </div>
            </div>
          </div>

          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileAudio className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Start Transcription
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Recent Transcriptions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Transcriptions</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {transcriptions.map((transcription, index) => (
              <motion.div
                key={transcription.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="p-6 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                      <FileAudio className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{transcription.fileName}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>{transcription.duration}</span>
                        <span>{transcription.size}</span>
                        <span>{transcription.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-center ${isMobile ? 'justify-between' : 'space-x-4'}`}>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(transcription.status)}
                      <span className="text-sm font-medium text-gray-700">
                        {getStatusText(transcription.status)}
                      </span>
                    </div>

                    {transcription.status === 'completed' && (
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-purple-600 hover:text-purple-700 p-2 rounded-lg hover:bg-purple-50"
                        >
                          <Play className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-purple-600 hover:text-purple-700 p-2 rounded-lg hover:bg-purple-50"
                        >
                          <Download className="h-4 w-4" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;