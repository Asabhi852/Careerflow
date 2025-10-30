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
  confidence: z.number().optional().describe('Confidence score of the answer (0-1)'),
});

export type MultilingualQueryResolutionOutput = z.infer<typeof MultilingualQueryResolutionOutputSchema>;

export async function multilingualQueryResolution(input: MultilingualQueryResolutionInput): Promise<MultilingualQueryResolutionOutput> {
  return multilingualQueryResolutionFlow(input);
}

const queryResolutionPrompt = ai.definePrompt({
  name: 'queryResolutionPrompt',
  input: {schema: MultilingualQueryResolutionInputSchema},
  output: {schema: MultilingualQueryResolutionOutputSchema},
  prompt: `You are a helpful AI career assistant for a job platform called CareerFlow. You help users with:

1. Job search strategies and tips
2. Resume writing and optimization
3. Interview preparation and techniques
4. Career advice and planning
5. Profile building and optimization
6. Job application processes
7. Industry insights and trends
8. Skill development recommendations

You should:
- Provide helpful, accurate, and actionable advice
- Be conversational and friendly
- Keep responses concise but comprehensive
- Use bullet points and formatting for better readability when appropriate
- If the query is unclear, ask for clarification
- If you don't know something, admit it and suggest alternatives

{{#if language}}Respond in {{language}}.
{{else}}Respond in English.
{{/if}}

{{#if userData}}Here is some context about the user: {{userData}}
{{/if}}

User Question: {{{query}}}

Provide a helpful response:`,
});

const multilingualQueryResolutionFlow = ai.defineFlow(
  {
    name: 'multilingualQueryResolutionFlow',
    inputSchema: MultilingualQueryResolutionInputSchema,
    outputSchema: MultilingualQueryResolutionOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await queryResolutionPrompt(input);
      return {
        answer: output?.answer || "I'm sorry, I couldn't generate a response right now. Please try again.",
        confidence: 0.8, // Default confidence score
      };
    } catch (error) {
      console.error('Error in multilingual query resolution:', error);
      return {
        answer: "I'm experiencing some technical difficulties right now. Please try asking your question again in a moment.",
        confidence: 0.0,
      };
    }
  }
);
