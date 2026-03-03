import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Gets the current API key from environment variable.
 * UI-provided keys are passed through request context.
 */
function getApiKey(): string {
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey) return envKey;
  
  // Return a placeholder - actual key comes from UI or environment
  return 'placeholder_configure_via_settings';
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: getApiKey(),
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
