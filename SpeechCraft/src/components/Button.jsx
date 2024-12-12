import React from 'react';
import { motion } from 'framer-motion'; // Import motion from framer-motion
import { useMediaQuery } from 'react-responsive';

const Button = ({ onClick, text, isLoading }) => {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const styles = {
    button: {
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(50px)',
      border: '1px solid rgba(255, 255, 255, 0.5)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: isMobile ? '300px' : '350px',
      fontSize: '18px',
      color: '#fff',
      height: '50px',
      borderRadius: '26px',
      cursor: 'pointer',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    },
    text: {
      fontWeight: 'bold',
      textAlign: 'center',
    },
    hover: {
      boxShadow: '0 6px 10px rgba(0, 0, 0, 0.2)',
    },
  };

  return (
    <motion.div
      style={styles.button}
      onClick={onClick}
      aria-disabled={isLoading}
      onMouseEnter={(e) =>
        Object.assign(e.currentTarget.style, styles.hover)
      }
      onMouseLeave={(e) =>
        Object.assign(e.currentTarget.style, styles.button)
      }
      // Add sliding animation with Framer Motion
      initial={{ opacity: 0, x: -100 }} 
      animate={{ opacity: 1, x: 0 }}    
      exit={{ opacity: 0, x: 100 }}  
      transition={{ duration: 0.5 }}   
    >
      <p style={styles.text}>{text}</p>
    </motion.div>
  );
};

export default Button;
