import React from 'react';
import { motion } from 'framer-motion';
import './App.css';
import Navigations from './navigation/Navigations';
import { useMediaQuery } from 'react-responsive';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';

// Set Axios defaults
axios.defaults.baseURL = "http://localhost:3000";
axios.defaults.withCredentials = false;


const App = () => {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

  const styles = {
    container: {
      background: 'linear-gradient(270deg, #3b82f6, #8b5cf6, #ec4899, #facc15)',
      backgroundSize: '300% 300%',
      height: isMobile ? 'fit-content' : '100vh',
      width: '100%',
    },
  };

  return (
    <>
      <motion.div
        className="App"
        style={styles.container}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 10,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        {/* Toaster with custom position, duration, and small size */}
        <Toaster 
          options={{ 
            position: "top-right", 
            toastOptions: {
              style: {
                fontSize: '12px',
                padding: '8px 16px', 
                maxWidth: '300px', 
              },
            },
          }} 
        />
        <Navigations />
      </motion.div>
    </>
  );
};

export default App;
