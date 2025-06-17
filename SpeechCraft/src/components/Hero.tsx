import React from 'react';
import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { Play, Mic, FileText, Download } from 'lucide-react';
import { useMediaQuery } from 'react-responsive';

const Hero: React.FC = () => {
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={itemVariants} className="mb-8 pt-6">
            <div className="inline-flex items-center bg-white/60 backdrop-blur-sm rounded-full px-6 py-2 mb-6 border border-white/20">
              <span className="text-purple-600 font-medium">✨ AI-Powered Transcription</span>
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className={`font-bold text-gray-900 mb-6 ${
              isMobile ? 'text-4xl' : 'text-6xl lg:text-7xl'
            }`}
          >
            Transform{' '}
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Speech
            </span>{' '}
            into{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Text
            </span>{' '}
            Instantly
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className={`text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed ${
              isMobile ? 'text-lg' : 'text-xl'
            }`}
          >
            Experience the power of AI-driven audio transcription. Upload your audio files and get 
            accurate, searchable transcripts in seconds. Perfect for meetings, interviews, podcasts, and more.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/auth/signup"
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow duration-200 inline-flex items-center space-x-2"
              >
                <Mic className="h-5 w-5" />
                <span>Start Transcribing</span>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button className="bg-white/80 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-full font-semibold text-lg border border-white/20 hover:bg-white transition-colors duration-200 inline-flex items-center space-x-2">
                <Play className="h-5 w-5" />
                <span>Watch Demo</span>
              </button>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: <Mic className="h-8 w-8 text-purple-600" />,
                title: "Upload Audio",
                description: "Drag & drop or select your audio files"
              },
              {
                icon: <FileText className="h-8 w-8 text-blue-600" />,
                title: "AI Processing",
                description: "Advanced AI transcribes with 99% accuracy"
              },
              {
                icon: <Download className="h-8 w-8 text-indigo-600" />,
                title: "Download Text",
                description: "Export in multiple formats (TXT, DOCX, SRT)"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;