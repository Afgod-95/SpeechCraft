import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={styles.container}
    >
      <motion.div
        initial={{ y: '-100vh', opacity: 0 }} // Slide from top
        animate={{ y: 0, opacity: 1 }} // Slide to final position
        transition={{
          type: 'spring',
          stiffness: 120,
          damping: 12,
          bounce: 0.5, // Adds bounce effect when settled
        }}
        style={styles.content}
      >
        <motion.h1
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 150,
            damping: 12,
          }}
          style={styles.title}
        >
          404
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 15,
            delay: 0.3,
          }}
          style={styles.message}
        >
          The page you’re looking for doesn’t exist or has been moved.
        </motion.p>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.6,
          }}
        >
          <Link to="/" style={styles.link}>
            Go Back Home
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    textAlign: 'center',
    padding: '20px',
  },
  content: {
    maxWidth: '500px',
    padding: '20px',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '6rem',
    margin: '0',
    color: '#000',
  },
  message: {
    fontSize: '1.5rem',
    color: '#374151',
    margin: '20px 0',
  },
  link: {
    display: 'inline-block',
    padding: '10px 20px',
    fontSize: '1rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '5px',
    textDecoration: 'none',
    transition: 'background-color 0.3s ease',
  },
};

export default NotFound;
