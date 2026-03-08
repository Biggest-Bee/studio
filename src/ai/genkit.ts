import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Gets the current API key from environment variable.
 * UI-provided keys are passed through request context.
 */
function getApiKey(): string {
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey) return envKey;
  
  return '';
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: getApiKey(),
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
