'use server';
/**
 * @fileOverview A Genkit flow for explaining and debugging code, using the core `ai.generate()`
 * function to support a BYOK (Bring Your Own Key) model.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GENKIT_MODEL } from '@/lib/constants';

// 1. Define Schemas
const FileContentSchema = z.object({
  fileName: z.string().describe('The name of the file.'),
  fileContent: z.string().describe('The full content of the file.'),
});

const AiCodeExplanationAndDebuggingInputSchema = z.object({
  filesToAnalyze: z.array(FileContentSchema).describe('An array of files to be analyzed.'),
  apiKey: z.string().optional(), // User-provided API key
});
export type AiCodeExplanationAndDebuggingInput = z.infer<typeof AiCodeExplanationAndDebuggingInputSchema>;

const AiCodeExplanationAndDebuggingOutputSchema = z.object({
  explanation: z.string().describe('A comprehensive explanation of the code.'),
  potentialIssues: z.array(z.string()).describe('A list of potential issues or bugs.'),
  suggestions: z.array(z.string()).describe('Actionable suggestions for improvement.'),
  summary: z.string().describe('A high-level summary of the analysis.'),
});
export type AiCodeExplanationAndDebuggingOutput = z.infer<typeof AiCodeExplanationAndDebuggingOutputSchema>;

// 2. Define the Prompt Template
const PROMPT_TEMPLATE = `You are an expert software engineer and debugger.
Your task is to provide a comprehensive analysis of the given code, which may span multiple files.

Follow these steps:
1.  **Explanation**: Detail the functionality, purpose, and architecture.
2.  **Potential Issues**: Identify bugs, vulnerabilities, and poor coding practices.
3.  **Suggestions**: Offer specific, actionable recommendations for improvement.
4.  **Summary**: Provide a brief, high-level overview of your analysis.

Here are the files for your analysis:
{{#each filesToAnalyze}}
### File: {{{fileName}}}
\`\`\`
{{{fileContent}}}
\`\`\`
---
{{/each}}

Please provide your analysis in the specified JSON output format.`;

// 3. Define the exported wrapper function
export async function aiCodeExplanationAndDebugging(
  input: AiCodeExplanationAndDebuggingInput
): Promise<AiCodeExplanationAndDebuggingOutput> {
  // Perform input validation
  if (input.filesToAnalyze.length > 50) {
    throw new Error('Too many files. A maximum of 50 files is allowed.');
  }
  const totalSize = input.filesToAnalyze.reduce((sum, f) => sum + (f.fileContent?.length || 0), 0);
  if (totalSize > 500000) {
    throw new Error('Files are too large. Total size must be under 500KB.');
  }

  // Separate the API key from the rest of the prompt input
  const { apiKey, ...promptData } = input;

  // Use the core `generate` function to allow for per-request API key
  const response = await ai.generate({
    model: GENKIT_MODEL,
    prompt: PROMPT_TEMPLATE,
    input: promptData, // Pass template variables here
    output: {
      schema: AiCodeExplanationAndDebuggingOutputSchema,
    },
    config: {
      apiKey: apiKey, // Pass the user's key in the config
    },
  });

  const output = response.output;
  if (!output) {
    throw new Error('AI failed to generate a valid analysis.');
  }
  return output;
}
