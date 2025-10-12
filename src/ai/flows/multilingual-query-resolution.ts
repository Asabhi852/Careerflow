'use server';

/**
 * @fileOverview A multilingual query resolution AI agent.
 *
 * - multilingualQueryResolution - A function that handles query resolution in multiple languages.
 * - MultilingualQueryResolutionInput - The input type for the multilingualQueryResolution function.
 * - MultilingualQueryResolutionOutput - The return type for the multilingualQueryResolution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MultilingualQueryResolutionInputSchema = z.object({
  query: z.string().describe('The user query in any language, either text or voice transcription.'),
  language: z.string().optional().describe('The language of the query. If not provided, the system will attempt to detect it.'),
  userData: z.string().optional().describe('User data to personalize the answer.'),
});

export type MultilingualQueryResolutionInput = z.infer<typeof MultilingualQueryResolutionInputSchema>;

const MultilingualQueryResolutionOutputSchema = z.object({
  answer: z.string().describe('The answer to the query in the same language as the query.'),
});

export type MultilingualQueryResolutionOutput = z.infer<typeof MultilingualQueryResolutionOutputSchema>;

export async function multilingualQueryResolution(input: MultilingualQueryResolutionInput): Promise<MultilingualQueryResolutionOutput> {
  return multilingualQueryResolutionFlow(input);
}

const queryResolutionPrompt = ai.definePrompt({
  name: 'queryResolutionPrompt',
  input: {schema: MultilingualQueryResolutionInputSchema},
  output: {schema: MultilingualQueryResolutionOutputSchema},
  prompt: `You are a multilingual chatbot assistant for a career platform. Your goal is to answer user queries related to job seeking and candidate information in their native language.

  {{#if language}}The user has asked in {{language}}.
  {{else}}Please detect the language used by the user.
  {{/if}}
  Answer the question in the same language as the question.

  {{#if userData}}Here is some data about the user to help personalize the answer: {{userData}}.
  {{/if}}

  Question: {{{query}}}`,
});

const multilingualQueryResolutionFlow = ai.defineFlow(
  {
    name: 'multilingualQueryResolutionFlow',
    inputSchema: MultilingualQueryResolutionInputSchema,
    outputSchema: MultilingualQueryResolutionOutputSchema,
  },
  async input => {
    const {output} = await queryResolutionPrompt(input);
    return output!;
  }
);
