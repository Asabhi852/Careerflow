'use server';
/**
 * @fileOverview Generates a tailored profile summary for recruiters, emphasizing the most relevant skills and experience based on job requirements.
 *
 * - profileSummaryForRecruiters - A function that generates the profile summary.
 * - ProfileSummaryForRecruitersInput - The input type for the profileSummaryForRecruiters function.
 * - ProfileSummaryForRecruitersOutput - The return type for the profileSummaryForRecruiters function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProfileSummaryForRecruitersInputSchema = z.object({
  profileData: z.string().describe('The job seeker profile data, including skills, experience, and education.'),
  jobRequirements: z.string().describe('The job requirements and desired qualifications for the specific job.'),
});
export type ProfileSummaryForRecruitersInput = z.infer<typeof ProfileSummaryForRecruitersInputSchema>;

const ProfileSummaryForRecruitersOutputSchema = z.object({
  summary: z.string().describe('A concise and compelling summary of the job seeker most relevant skills and experience, tailored to the job requirements.'),
});
export type ProfileSummaryForRecruitersOutput = z.infer<typeof ProfileSummaryForRecruitersOutputSchema>;

export async function profileSummaryForRecruiters(input: ProfileSummaryForRecruitersInput): Promise<ProfileSummaryForRecruitersOutput> {
  return profileSummaryForRecruitersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'profileSummaryForRecruitersPrompt',
  input: {schema: ProfileSummaryForRecruitersInputSchema},
  output: {schema: ProfileSummaryForRecruitersOutputSchema},
  prompt: `You are an expert resume writer, tailoring job seeker profiles to specific job requirements.

  Given the following job seeker profile data:
  {{profileData}}

  And the following job requirements:
  {{jobRequirements}}

  Create a concise and compelling summary (around 150 words) of the job seeker most relevant skills and experience, highlighting how they align with the job requirements. Emphasize quantifiable achievements and specific skills mentioned in the job requirements. Focus on creating a strong first impression for recruiters.
  `,
});

const profileSummaryForRecruitersFlow = ai.defineFlow(
  {
    name: 'profileSummaryForRecruitersFlow',
    inputSchema: ProfileSummaryForRecruitersInputSchema,
    outputSchema: ProfileSummaryForRecruitersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
