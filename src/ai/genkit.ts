import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Dynamically selects an API key based on the current UTC hour.
 * This ensures rotation across the 7 provided keys.
 */
function getRotatedApiKey(): string {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
  ];
  
  const now = new Date();
  const index = now.getUTCHours() % 7;
  
  return keys[index] || keys[0] || '';
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: getRotatedApiKey(),
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
