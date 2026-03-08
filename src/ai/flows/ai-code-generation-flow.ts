'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating and managing code.
 * It uses the core `ai.generate()` function to support a BYOK (Bring Your Own Key) model.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GENKIT_MODEL } from '@/lib/constants';

// Utility function for validating file paths to prevent traversal attacks
function validateFilePath(path: string): boolean {
  if (!path || typeof path !== 'string') return false;
  if (path.includes('..') || path.includes('~') || path.includes('\0')) {
    return false;
  }
  return true;
}

// 1. Define Schemas
const FileOperationSchema = z.object({
  type: z.enum(['createFile', 'updateFile', 'deleteFile', 'renameFile', 'createFolder', 'moveNode']),
  path: z.string().refine(validateFilePath, { message: 'Invalid file path' }).describe('The path of the file or folder'),
  content: z.string().optional().describe('Content for creation or update'),
  newName: z.string().optional().describe('New name for renaming'),
  destinationPath: z.string().optional().refine((path) => path ? validateFilePath(path) : true, { message: 'Invalid destination path' }).describe('Target folder for move operations'),
});

const AiCodeGenerationInputSchema = z.object({
  userPrompt: z.string(),
  programmingLanguage: z.string(),
  complexityLevel: z.enum(['simple', 'medium', 'complex']),
  workspaceContext: z.array(z.object({
    path: z.string(),
    type: z.enum(['file', 'folder']),
    content: z.string().optional(),
    children: z.array(z.string()).optional(),
  })).optional(),
  apiKey: z.string().optional(), // User-provided API key
});
export type AiCodeGenerationInput = z.infer<typeof AiCodeGenerationInputSchema>;

const AiCodeGenerationOutputSchema = z.object({
  generatedCode: z.string().describe('Main generated code, if applicable.'),
  explanation: z.string().describe('Explanation of actions taken or code generated.'),
  operations: z.array(FileOperationSchema).optional().describe('File operations to perform.'),
});
export type AiCodeGenerationOutput = z.infer<typeof AiCodeGenerationOutputSchema>;

// 2. Define the Prompt Template
const PROMPT_TEMPLATE = `You are an expert software developer.
Your task is to fulfill the user's request by generating code and performing workspace operations.

Capabilities:
- Create, update, delete, rename, and move files and folders.
- If the request is complex, break it down into multiple file operations.
- Use the 'moveNode' operation for moving files/folders.
- All paths must be relative to the workspace root.

Workspace Context:
{{#each workspaceContext}}
- {{{type}}}: {{{path}}}
{{#if content}}
  Content: \`\`\`
  {{{content}}}
  \`\`\`
{{/if}}
{{/each}}

User Prompt: {{{userPrompt}}}
Programming Language: {{{programmingLanguage}}}
Complexity Level: {{{complexityLevel}}}

IMPORTANT: If you need to perform file system changes, return a list of 'operations'.`;

// 3. Define the exported wrapper function
export async function generateCode(input: AiCodeGenerationInput): Promise<AiCodeGenerationOutput> {
  // Separate the API key from the rest of the prompt input
  const { apiKey, ...promptData } = input;

  // Use the core `generate` function to allow for per-request API key
  const response = await ai.generate({
    model: GENKIT_MODEL,
    prompt: PROMPT_TEMPLATE,
    input: promptData, // Pass template variables here
    output: {
      schema: AiCodeGenerationOutputSchema,
    },
    config: {
      apiKey: apiKey, // Pass the user's key in the config
    },
  });

  const output = response.output;
  if (!output) {
    throw new Error('AI failed to generate a valid response.');
  }
  return output;
}
