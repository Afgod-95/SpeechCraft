import { AssemblyAI } from 'assemblyai';
import { configDotenv } from 'dotenv';

// Load environment variables from.env file
configDotenv();

// Initialize assembly client instance
export const client = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY
})