import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { FaMicrophone, FaStopCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useMediaQuery } from 'react-responsive';
import { RxCaretDown } from "react-icons/rx";
import { IoIosLink } from "react-icons/io";
import TextField from '@mui/material/TextField';
import { HiOutlineComputerDesktop } from "react-icons/hi2";
import axios from "axios";
import { toast } from 'react-hot-toast';


const AudioVisualizer = ({ transcribeAudio, summarize, transcribeText }) => {

  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

  const [playing, setPlaying] = React.useState(false); 
  const [recording, setRecording] = React.useState(false); 
  const [currentTime, setCurrentTime] = React.useState(0); 
  const [audioUrl, setAudioUrl] = React.useState(null); 
  const audioRef = React.useRef(null);
  const mediaRecorderRef = React.useRef(null);
  const [recordedChunks, setRecordedChunks] = React.useState([]);
  const [isVisibile, setIsVisibile] = React.useState(false);
  const [webUrl, setWebUrl] = React.useState("");
  const [showTextField, setShowTextField] = React.useState(false);

  //transript state change
  const [transcription, setTranscription] = React.useState(null);

  const handleInputChange = (e) => {
    e.stopPropagation();
    const newValue = e.target.value;
  
    console.log("New input:", newValue);
    setWebUrl(newValue);
  };
  

  //handle file upload from device
  const handleFileChange = async (event) => {
    event.preventDefault();
    try{
      const file = event.target.files[0];
      if (!file) {
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('/upload-audio', formData, {
        headers: {
          'Content-Type':'multipart/form-data'
        }
      });
      
      if (response.status === 200) {
        console.log("File uploaded successfully");
        console.log(`File path: ${response.data.filePath}`,`File name: ${response.data.filename}`);
        const audioSrc = URL.createObjectURL(file);
        setAudioUrl(audioSrc);
        setWebUrl(response.data.filePath);
        toast.success(response.data.messsage)
      }
      else{
        toast.error(response.data.error)
      }
    }
    catch(error){
      console.error(error);
    }
  };


  //handle audio transcription
  const handleTranscribe = async () => {
    try{
      if(!webUrl){
        toast.error("Please select an audio file first")
        return;
      }
      const response = await axios.post('/transcribe-audio', { filePath: webUrl });
      if (response.status === 200) {
        console.log("Audio transcribed successfully");
        console.log(`Transcript: ${response.data.transcript}`);
        setTranscription(response.data.transcript);
        toast.success(response.data.message)
      }
      else{
        toast.error(response.data.error)
      }
    }
    catch(error){
      console.error(error);
    }
  };


  //summarize transcript 
  const handleSummarize = async () => {
    try{
      if(!webUrl){
        toast.error("Please select an audio file first")
        return;
      }
      const response = await axios.post('/summarize-transcript', { filePath: webUrl, prompt: "Your summary prompt here" });
      if (response.status === 200) {
        console.log("Transcript summarized successfully");
        console.log(`Summary: ${response.data.summary}`);
        toast.success(response.data.message)
      }
      else{
        toast.error(response.data.error)
      }
    }
    catch(error){
      console.error(error);

    }
  };

  const FileUploadOptions = () => {
    return (
      <motion.div
        onClick={() => setIsVisibile(false)}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(3px)',
          position: 'absolute',
          width: '100%',
          top: 0,
          left: 0,
          height: '100%',
          zIndex: 20,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <motion.div
          initial={{ y: '-100vh', opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{
            type: 'spring',
            stiffness: 120,
            damping: 15,
            bounce: 0.5, // Adds bounce effect when settled
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            borderRadius: '20px',
            boxShadow: '0 0 10px rgba(0,0,0,0.3)',
            backgroundColor: '#F8F8F8',
            gap: '2rem',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
          }}
        >
          <Button
          
            variant="contained"
            component="label"
            sx={{
              backgroundColor: '#f50213',
              width: '100%',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'flex-start',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <IoIosLink />
            From my computer
            <input type="file" accept="audio/*" hidden />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setShowTextField(prev => !prev);
            }}
            variant="contained"
            sx={{
              backgroundColor: '#f50213',
              width: '100%',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'flex-start',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <HiOutlineComputerDesktop />
            By URL
          </Button>
          {showTextField && (
            <TextField
              id="outlined-basic"
              label="Enter URL"
              variant="outlined"
              fullWidth
              value={webUrl}
              onChange={handleInputChange}
            />
          )}
        </motion.div>
      </motion.div>
    );
  };
  








  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;

      const blob = new Blob(recordedChunks, { type: "audio/webm" });
      const audioSrc = URL.createObjectURL(blob);
      setAudioUrl(audioSrc);
      setRecordedChunks([]);
    }
    setRecording(false);
  };

  React.useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.addEventListener("timeupdate", () => {
        setCurrentTime(audioElement.currentTime);
      });
    }
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.removeEventListener("timeupdate", () => { });
      }
    };
  }, []);

  const isAudioSelected = audioUrl !== null;
  const isRecordingOrPlaying = recording || playing;



  return (
    <Box sx={{ color: "#fff", display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', width: '50%', marginBlock: '1.5rem' }}>
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -100, opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ color: "#fff", display: 'flex', alignContent: 'center', justifyContent: 'center' }}>
          <Button
            variant="contained"
            component="label"
            disabled={isRecordingOrPlaying}
            sx={{
              backgroundColor: isRecordingOrPlaying ? "#f26f78" : "#f50213",
              width: isMobile ? "100%" : "100%",
              cursor: isRecordingOrPlaying ? "not-allowed" : "pointer",
            }}
          >
            Select Audio
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              hidden
              disabled={isRecordingOrPlaying}
            />
          </Button>
          <Button
            variant="contained"
            component="label"
            disabled={isRecordingOrPlaying}
            onClick={() => setIsVisibile(true)}
            sx={{
              backgroundColor: "#f50213",
              width: 50,
              cursor: "pointer",
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boorderLeftRadius: '0px'

            }}
          >
            <RxCaretDown size={24} color="#fff" />
          </Button>

        </Box>


      </motion.div>

      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: "center" }}>
          {recording ? (
            <FaStopCircle
              style={{ fontSize: "40px", color: "#ff0000", cursor: "pointer" }}
              onClick={stopRecording}
            />
          ) : (
            <FaMicrophone
              style={{
                fontSize: "40px",
                color: "#fff",
                cursor: isRecordingOrPlaying ? "not-allowed" : "pointer",
              }}
              onClick={startRecording}
              disabled={isRecordingOrPlaying}
            />
          )}
        </Stack>
      </motion.div>
      {/* Audio Player */}
      {audioUrl && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <audio ref={audioRef} src={audioUrl} controls autoPlay={playing}>
            Your browser does not support the audio element.
          </audio>
        </motion.div>
      )}
      {isVisibile && (<FileUploadOptions />)}
    </Box>
  );
};

export default AudioVisualizer;
