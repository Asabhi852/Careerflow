'use server';

/**
 * @fileOverview A job match suggestion AI agent.
 *
 * - jobMatchSuggestions - A function that suggests job matches based on a user profile and resume.
 * - JobMatchSuggestionsInput - The input type for the jobMatchSuggestions function.
 * - JobMatchSuggestionsOutput - The return type for the jobMatchSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JobMatchSuggestionsInputSchema = z.object({
  profileData: z
    .string()
    .describe('The user profile data including skills, education, and experience.'),
  resumeDataUri: z
    .string()
    .describe(
      "The user's resume data as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  jobRequirements: z.string().describe('The job requirements for which to find matches.'),
});
export type JobMatchSuggestionsInput = z.infer<typeof JobMatchSuggestionsInputSchema>;

const JobMatchSuggestionsOutputSchema = z.object({
  jobMatches: z
    .array(z.string())
    .describe('A list of job titles that are a good match for the user.'),
  summaryForRecruiters: z.string().describe('A summary of the candidate optimized for recruiters based on the job requirements.'),
});
export type JobMatchSuggestionsOutput = z.infer<typeof JobMatchSuggestionsOutputSchema>;

export async function jobMatchSuggestions(input: JobMatchSuggestionsInput): Promise<JobMatchSuggestionsOutput> {
  return jobMatchSuggestionsFlow(input);
}

const assessRelevanceTool = ai.defineTool({
  name: 'assessRelevance',
  description: 'Assess the relevance of a profile credential to specific job requirements.',
  inputSchema: z.object({
    credential: z.string().describe('The credential from the profile to assess.'),
    jobRequirement: z.string().describe('The specific job requirement to compare against.'),
  }),
  outputSchema: z.number().describe('A numerical score (0-1) representing the relevance, where 1 is highly relevant.'),
});

const prompt = ai.definePrompt({
  name: 'jobMatchSuggestionsPrompt',
  input: {schema: JobMatchSuggestionsInputSchema},
  output: {schema: JobMatchSuggestionsOutputSchema},
  prompt: `You are an AI job matching expert. Given a user profile, their resume, and job requirements, you will suggest potential job matches and provide a summary for recruiters.

User Profile:
{{profileData}}

Resume:
{{media url=resumeDataUri}}

Job Requirements:
{{jobRequirements}}

Suggest job titles that the user would be a good fit for, and create a summary for recruiters highlighting the most relevant skills and experience from the user profile and resume, emphasizing aspects most applicable to the job requirements. Use the assessRelevance tool to decide which credentials to emphasize.

Here is the suggested formatting for the summary:

[Candidate Name] possesses a strong background in [relevant skills/experience]. Highlights include [specific achievements] and expertise in [key areas].  This candidate's profile and resume data indicates strong alignment with the job requirements.
`,
  tools: [assessRelevanceTool],
});

const jobMatchSuggestionsFlow = ai.defineFlow(
  {
    name: 'jobMatchSuggestionsFlow',
    inputSchema: JobMatchSuggestionsInputSchema,
    outputSchema: JobMatchSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
