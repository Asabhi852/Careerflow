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
  prompt: `You are a helpful AI career assistant for a job platform called CareerFlow. You help users in their preferred language (English, Hindi, Kannada, Telugu, Tamil).

Your expertise includes:
1. Job search strategies and tips
2. Resume writing and optimization
3. Interview preparation and techniques
4. Career advice and planning
5. Profile building and optimization
6. Job application processes
7. Industry insights and trends
8. Skill development recommendations
9. Local job market insights for Indian job seekers

You should:
- Provide helpful, accurate, and actionable advice
- Be conversational, friendly, and culturally sensitive
- Keep responses concise but comprehensive (2-3 paragraphs max)
- Use bullet points and formatting for better readability when appropriate
- If the query is unclear, ask for clarification politely
- If you don't know something, admit it and suggest alternatives
- Be empathetic to users from rural areas who may be new to job searching
- Provide practical advice considering the Indian job market context

IMPORTANT LANGUAGE INSTRUCTIONS:
{{#if language}}
- The user's selected language is: {{language}}
- ALWAYS respond in the EXACT same language that the user is using
- If language is 'en', respond in English
- If language is 'hi', respond in Hindi (हिन्दी) - write everything in Devanagari script
- If language is 'kn', respond in Kannada (ಕನ್ನಡ) - write everything in Kannada script
- If language is 'te', respond in Telugu (తెలుగు) - write everything in Telugu script
- If language is 'ta', respond in Tamil (தமிழ்) - write everything in Tamil script
- Use natural, colloquial language that rural users can understand
- Avoid complex English words when responding in regional languages
{{else}}
- Respond in English by default
{{/if}}

{{#if userData}}User Context: {{userData}}
{{/if}}

User Question: {{{query}}}

Provide a helpful response in the user's language:`,
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
