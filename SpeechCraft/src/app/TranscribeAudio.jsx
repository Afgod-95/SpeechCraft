import React, { useState } from 'react';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import AudioVisualizer from '../components/AudioVisualizer';
import { IoReturnUpBack } from "react-icons/io5";
import { motion } from 'framer-motion'; 
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { toast } from "react-hot-toast";



const TranscribeAudio = () => {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const navigate = useNavigate(); 
  const [isCopied, setIsCopied] = useState(false);
  const [copiedText, setCopiedText] = useState(""); // Store the copied text


  const copiedToClipboard = async (text) => {
    setCopiedText(text); // Set the copied text to display in the span
    toast.success('Transcription copied to clipboard!', {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    setIsCopied(true);
  }

  //upload file file



  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: isMobile ? '100%' : '90vh',
      color: '#fff',
      padding: '20px',
    },
    header: {
      marginBottom: '20px',
      textAlign: 'center',
    },
    title: {
      fontSize: isMobile ? '25px' : '40px',
      fontWeight: 'bold',
      paddingTop: isMobile ? '50px' : ''
    },
    subtitle: {
      fontSize: '18px',
      marginTop: '10px',
      color: 'rgba(255, 255, 255, 0.7)',
    },
    inputContainer: {
      width: isMobile ? '80%' : '50%',
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '10px',
      padding: '15px',
      color: '#fff',
      fontSize: '16px',
      lineHeight: '1.5',
      overflowY: 'auto',
      minHeight: '200px',
      maxHeight: '500px',
    },
    placeholder: {
      color: 'rgba(255, 255, 255, 0.5)',
    },
    backBtn: {
      position: 'fixed',
      top: isMobile ? '10px' : '20px',
      left: isMobile ? '10px' : '30px',
      fontSize: '24px',
      cursor: 'pointer',
      display: 'flex',
      zIndex: 100,
      borderRadius: '50%',
      alignItems: 'center',
      justifyContent: 'center',
      width: isMobile ? '50px' : '60px',
      height: isMobile ? '50px' : '60px',
      backdropFilter: 'blur(10px)',
      backgroundColor: 'rgba(255, 255,255, 0.3)',
      border: 'thin solid rgba(255, 255, 255, 0.3)',
    },
    clipboard: {
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      gap: '.2rem', 
      backdropFilter: 'blur(10px)',
      backgroundColor: 'rgba(255, 255,255, 0.3)',
      borderRadius: '10px',
      height: '30px',
      width: '70px',
      marginBottom: '15px',
      cursor: 'pointer',
      position: 'fixed',
      right: '10px',
    }
  };

  return (
    <>
      <motion.div onClick={() => navigate(-1)}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, damping: 10 }}
        style={styles.backBtn}>
        <IoReturnUpBack size={isMobile ? 24 : 32} color={'#fff'} fontWeight={'bold'} />
      </motion.div>

      <motion.div
        style={styles.container}
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ duration: 0.5, staggerChildren: 0.3 }}
      >
        <motion.div
          style={styles.header}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 style={styles.title}>Real-Time Speech-to-Text</h1>
          <p style={styles.subtitle}>Speak or record live audio and watch the transcription appear instantly.</p>
        </motion.div>

        <motion.div
          style={styles.inputContainer}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CopyToClipboard onCopy={() => copiedToClipboard("Your transcription text here")} text="Your transcription text here">
            <motion.div style={styles.clipboard}>
              <HiOutlineClipboardDocumentList size={18} />
              <p style={{ fontSize: '13px' }}>Copy</p>
            </motion.div>
          </CopyToClipboard>

          <span style={styles.placeholder}>
            {isCopied ? `Copied: ${copiedText}` : 'Click or drag and drop your audio file here, or select from your device.'}
            <br />
            Supported formats: MP3, WAV, and AIFF.
          </span>
        </motion.div>

        <AudioVisualizer />

        <motion.div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginTop: '20px',
          }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button text={"Cancel"} />
          <Button text={"Upload Audio"} />
          <Button text={"Save Transcription"}  />
        </motion.div>
      </motion.div>
    </>
  );
};

export default TranscribeAudio;



















