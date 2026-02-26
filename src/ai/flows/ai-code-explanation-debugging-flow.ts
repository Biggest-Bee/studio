'use server';
/**
 * @fileOverview A Genkit flow for explaining and debugging code.
 *
 * - aiCodeExplanationAndDebugging - A function that handles the code explanation and debugging process.
 * - AiCodeExplanationAndDebuggingInput - The input type for the aiCodeExplanationAndDebugging function.
 * - AiCodeExplanationAndDebuggingOutput - The return type for the aiCodeExplanationAndDebugging function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the schema for a single file's content
const FileContentSchema = z.object({
  fileName: z.string().describe('The name of the file (e.g., "src/index.ts").'),
  fileContent: z.string().describe('The full content of the file.'),
});

// Define the input schema for the AI code explanation and debugging flow
const AiCodeExplanationAndDebuggingInputSchema = z.object({
  filesToAnalyze: z.array(FileContentSchema).describe('An array of files to analyze, including their names and content. This can represent files from a single folder or selected individual files.'),
});
export type AiCodeExplanationAndDebuggingInput = z.infer<typeof AiCodeExplanationAndDebuggingInputSchema>;

// Define the output schema for the AI code explanation and debugging flow
const AiCodeExplanationAndDebuggingOutputSchema = z.object({
  explanation: z.string().describe('A comprehensive explanation of the selected code or folder content, detailing its functionality and purpose.'),
  potentialIssues: z.array(z.string()).describe('A list of potential issues, bugs, inefficiencies, or areas for improvement identified in the code. Each item should be a concise description of an issue.'),
  suggestions: z.array(z.string()).describe('Specific and actionable suggestions for how to resolve identified issues, improve code quality, optimize performance, or refactor for better design. Each item should be a concise suggestion.'),
  summary: z.string().describe('A brief, high-level summary of the overall analysis, highlighting the main points of the explanation and any critical findings.'),
});
export type AiCodeExplanationAndDebuggingOutput = z.infer<typeof AiCodeExplanationAndDebuggingOutputSchema>;

// Wrapper function to call the Genkit flow
export async function aiCodeExplanationAndDebugging(
  input: AiCodeExplanationAndDebuggingInput
): Promise<AiCodeExplanationAndDebuggingOutput> {
  return aiCodeExplanationAndDebuggingFlow(input);
}

// Define the prompt for the AI model
const aiCodeExplanationAndDebuggingPrompt = ai.definePrompt({
  name: 'aiCodeExplanationAndDebuggingPrompt',
  input: { schema: AiCodeExplanationAndDebuggingInputSchema },
  output: { schema: AiCodeExplanationAndDebuggingOutputSchema },
  prompt: `You are an expert software engineer and debugger. Your task is to provide a comprehensive analysis of the given code, which may span multiple files. Follow these steps:

1.  **Explanation**: Detail the functionality, purpose, and overall architecture of the code. Explain how different files (if any) interact.
2.  **Potential Issues**: Identify any bugs, inefficiencies, security vulnerabilities, poor coding practices, design flaws, or areas that could lead to unexpected behavior.
3.  **Suggestions**: Offer specific, actionable recommendations for resolving identified issues, improving code quality, optimizing performance, refactoring, or enhancing maintainability.
4.  **Summary**: Provide a brief, high-level overview of your entire analysis.

Consider the entire context of the provided files as part of a single project.

Here are the files for your analysis:

{{#each filesToAnalyze}}
### File: {{{fileName}}}
\`\`\`
{{{fileContent}}}
\`\`\`
---
{{/each}}

Please provide your analysis in the JSON format specified by the output schema.
`,
});

// Define the Genkit flow
const aiCodeExplanationAndDebuggingFlow = ai.defineFlow(
  {
    name: 'aiCodeExplanationAndDebuggingFlow',
    inputSchema: AiCodeExplanationAndDebuggingInputSchema,
    outputSchema: AiCodeExplanationAndDebuggingOutputSchema,
  },
  async (input) => {
    // Call the prompt with the input and get the structured output
    const { output } = await aiCodeExplanationAndDebuggingPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate a valid output for code explanation and debugging.');
    }
    return output;
  }
);
