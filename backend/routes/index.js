import { uploadMiddleware } from "../middlewares/uploadAudio.js"; 
import { client } from "../utils/assembly_Client.js";
import util from "util";
import { pipeline } from "stream";
import fs from "fs";

// Utility function to handle streams
const pump = util.promisify(pipeline);

export const routes = async (fastify) => {
  // Route to upload the audio file
  fastify.post('/upload-audio', async (request, reply) => {
    try {
      const parts = request.parts();

      for await (const part of parts) {
        if (part.file) {
          // Save the uploaded file to the 'uploads' directory
          const filePath = `./uploads/${part.filename}`;
          await pump(part.file, fs.createWriteStream(filePath));
          console.log(`File ${part.filename} uploaded successfully`);

          reply.send({
            status: 'success',
            message: 'File uploaded successfully',
            filename: part.filename,
            filePath,  // Send back the file path in the response
          });
        } else {
          reply.send({
            status: 'error',
            message: 'No file part found',
          });
        }
      }
    } catch (err) {
      console.error(err);
      reply.status(500).send({ error: err.message });
    }
  });

  // Route to transcribe the uploaded audio file
  fastify.post('/transcribe-audio', async (request, reply) => {
    try {
      const { filePath } = request.body;  // Get the file path from the uploaded response

      if (!filePath || !fs.existsSync(filePath)) {
        throw new Error('Audio file not found at the specified path');
      }

      // Prepare transcription parameters
      const params = {
        audio: filePath, 
        speaker_labels: true, 
      };

      // Transcribe the audio file
      const transcript = await client.transcripts.transcribe(params);

      if (transcript.status === 'error') {
        throw new Error(`Transcript error: ${transcript.error}`);
      }

      // Log and return transcript details
      transcript.utterances.forEach((utterance) => {
        console.log(`Utterance: ${utterance.text}`);
        console.log(`Confidence: ${utterance.confidence}`);
        console.log(`Speaker: ${utterance.speaker_label}`);
        console.log(`Start time: ${utterance.start_time_seconds} seconds`);
        console.log(`End time: ${utterance.end_time_seconds} seconds`);
        console.log('-----------------------------------------------');
      });

      reply.send({
        message: 'Audio transcribed successfully',
        transcript: transcript,
      });

    } catch (error) {
      console.error(error);
      reply.status(500).send({ error: error.message });
    }
  });

  // Route to summarize the transcript
  fastify.post('/summarize-transcript', async (request, reply) => {
    try {
      const { filePath } = request.body;  // Get file path and summary prompt from request body

      if (!filePath || !fs.existsSync(filePath)) {
        throw new Error('Audio file not found');
      }

      if (!prompt) {
        throw new Error('No summary prompt provided');
      }

      // First, transcribe the audio
      const transcript = await client.transcripts.transcribe({ audio: filePath, speaker_labels: true });

      // Summarize the transcript
      const { response } = await client.lemur.task({
        transcript_ids: [transcript.id],
        final_model: 'anthropic/claude-3-5-sonnet',
        answer_format: 'TLDR',
      });

      reply.send({
        message: 'Transcript summarized successfully',
        summary: response,
      });

    } catch (error) {
      console.error(error);
      reply.status(500).send({ error: error.message });
    }
  });
};
