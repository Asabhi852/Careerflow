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
import { ParsedResume } from './resume-parser';

/**
 * Calculate match score STRICTLY from user's technical skills overlap with job skills.
 * Score = percentage overlap: (matched / jobSkills) * 100.
 */
function calculateMatchScore(resume: any, job: any): number {
  const normalize = (s: string) => s.trim().toLowerCase();
  const unique = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));

  const jobSkills: string[] = unique((job.skills || []).map(normalize));
  const userSkills: string[] = unique((resume?.skills?.technical || []).map(normalize));

  if (jobSkills.length === 0 || userSkills.length === 0) return 0;

  const jobSkillSet = new Set(jobSkills);
  const matched = userSkills.filter(s => jobSkillSet.has(s));

  const ratio = matched.length / jobSkills.length;
  return Math.round(Math.max(0, Math.min(1, ratio)) * 100);
}

/**
 * Generate match reasons based on SKILLS ONLY (matched and missing skills).
 */
function generateMatchReasons(resume: any, job: any): string[] {
  const normalize = (s: string) => s.trim().toLowerCase();
  const unique = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));

  const jobSkills: string[] = unique((job.skills || []).map(normalize));
  const userSkills: string[] = unique((resume?.skills?.technical || []).map(normalize));

  if (jobSkills.length === 0) return ['Job does not specify required skills'];
  if (userSkills.length === 0) return ['No technical skills found in resume'];

  const jobSet = new Set(jobSkills);
  const userSet = new Set(userSkills);

  const matched = jobSkills.filter(s => userSet.has(s));
  const missing = jobSkills.filter(s => !userSet.has(s));

  const reasons: string[] = [];
  if (matched.length > 0) {
    reasons.push(`Matched skills: ${matched.slice(0, 5).join(', ')}`);
  }
  if (missing.length > 0) {
    reasons.push(`Missing skills: ${missing.slice(0, 3).join(', ')}`);
  }
  return reasons.length > 0 ? reasons : ['No skills overlap identified'];
}

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
  userPreferences: z.object({
    preferredLocations: z.array(z.string()).optional(),
    preferredJobTypes: z.array(z.string()).optional(),
    expectedSalary: z.number().optional(),
    availability: z.enum(['available', 'not_available', 'open_to_offers']).optional(),
  }).optional(),
});
export type JobMatchSuggestionsInput = z.infer<typeof JobMatchSuggestionsInputSchema>;

const JobMatchSuggestionsOutputSchema = z.object({
  jobMatches: z
    .array(z.object({
      title: z.string(),
      company: z.string(),
      location: z.string(),
      matchScore: z.number().min(0).max(100),
      matchReasons: z.array(z.string()),
      salaryRange: z.string().optional(),
      jobType: z.string(),
      description: z.string(),
      requirements: z.array(z.string()),
      url: z.string().optional(),
    }))
    .describe('A list of job opportunities that are a good match for the user.'),
  summaryForRecruiters: z.string().describe('A summary of the candidate optimized for recruiters based on the job requirements.'),
  skillGaps: z.array(z.object({
    skill: z.string(),
    importance: z.enum(['high', 'medium', 'low']),
    learningResources: z.array(z.string()),
  })).optional(),
  careerAdvice: z.string().optional(),
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
}, async (input) => {
  // Tool implementation
  return {
    relevance: 0.8,
    reasoning: 'Credential matches job requirement'
  };
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

User Preferences:
{{userPreferences}}

Suggest specific job opportunities that the user would be a good fit for, and create a summary for recruiters highlighting the most relevant skills and experience from the user profile and resume, emphasizing aspects most applicable to the job requirements. Use the assessRelevance tool to decide which credentials to emphasize.

For each job match, provide:
1. Job title and company
2. Location
3. Match score (0-100)
4. Specific reasons why this job matches the candidate
5. Salary range if available
6. Job type
7. Brief description
8. Key requirements
9. Application URL if available

Also provide:
- Skill gaps that the candidate should address
- Personalized career advice based on their profile and preferences
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

/**
 * Enhanced Job Opportunities Flow
 * Combines resume parsing, external job fetching, and AI matching
 */
export const jobOpportunitiesFlow = ai.defineFlow(
  {
    name: 'jobOpportunities',
    inputSchema: z.object({
      resumeText: z.string().describe('The full text content of the user resume'),
      userPreferences: z.object({
        location: z.string().optional(),
        jobType: z.string().optional(),
        experienceLevel: z.string().optional(),
        salaryMin: z.number().optional(),
      }).optional(),
    }),
    outputSchema: z.object({
      parsedResume: z.any(),
      jobMatches: z.array(z.object({
        title: z.string(),
        company: z.string(),
        location: z.string(),
        matchScore: z.number().min(0).max(100),
        matchReasons: z.array(z.string()),
        salaryRange: z.string().optional(),
        jobType: z.string(),
        description: z.string(),
        requirements: z.array(z.string()),
        url: z.string().optional(),
        source: z.string(),
      })),
      summaryForRecruiters: z.string(),
      skillGaps: z.array(z.object({
        skill: z.string(),
        importance: z.enum(['high', 'medium', 'low']),
        learningResources: z.array(z.string()),
      })),
      careerAdvice: z.string(),
    }),
  },
  async (input) => {
    // First, parse the resume
    const { resumeParserFlow } = await import('./resume-parser');
    const parsedResume = await resumeParserFlow({ resumeText: input.resumeText });

    // Generate skills summary for job matching
    const allSkills = [
      ...parsedResume.skills.technical,
      ...parsedResume.skills.soft,
      ...parsedResume.skills.certifications,
    ].join(', ');

    const experienceSummary = parsedResume.workExperience.map(exp =>
      `${exp.position} at ${exp.company} (${exp.description.substring(0, 100)}...)`
    ).join('\n');

    const educationSummary = parsedResume.education.map(edu =>
      `${edu.degree} in ${edu.field} from ${edu.institution}`
    ).join(', ');

    const profileData = `Skills: ${allSkills}\nExperience: ${experienceSummary}\nEducation: ${educationSummary}`;

    // Generate job search query based on profile
    const searchQuery = `${parsedResume.professionalSummary.currentJobTitle || parsedResume.skills.technical[0] || 'software developer'}`;

    // Get user preferences for job search
    const location = input.userPreferences?.location || parsedResume.personalInfo.location;
    const jobType = input.userPreferences?.jobType || parsedResume.preferredJobTypes?.[0] || 'full-time';

    // Fetch real jobs from external sources
    let realJobs = [];
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
      const jobsResponse = await fetch(`${baseUrl}/api/jobs/external?source=all&query=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location || '')}&limit=20`);
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        const externalJobs = jobsData.data || [];
        
        // Transform external jobs to match expected schema
        realJobs = externalJobs.map((job: any) => ({
          title: job.title || '',
          company: job.company || '',
          location: job.location || '',
          matchScore: calculateMatchScore(parsedResume, job),
          matchReasons: generateMatchReasons(parsedResume, job),
          salaryRange: job.salary ? `₹${job.salary.toLocaleString()}/year` : 'Not specified',
          jobType: job.employmentType || 'Full-time',
          description: job.description || '',
          requirements: job.skills || [],
          url: job.externalUrl || job.url || '',
          source: job.source || 'Unknown',
        }));
      }
    } catch (error) {
      console.error('Error fetching real jobs:', error);
    }

    // If no real jobs found, fallback to enhanced mock jobs
    if (realJobs.length === 0) {
      realJobs = [
        {
          title: `${parsedResume.professionalSummary.currentJobTitle || 'Software Developer'}`,
          company: 'Tech Corp',
          location: location || 'San Francisco, CA',
          matchScore: 95,
          matchReasons: ['Strong technical skills match', 'Relevant experience', 'Good location fit'],
          salaryRange: '$80,000 - $120,000',
          jobType: jobType,
          description: `Looking for a skilled ${parsedResume.professionalSummary.currentJobTitle || 'developer'} to join our team.`,
          requirements: parsedResume.skills.technical.slice(0, 5),
          url: 'https://example.com/job/1',
          source: 'LinkedIn',
        },
        {
          title: `Senior ${parsedResume.professionalSummary.currentJobTitle || 'Software Developer'}`,
          company: 'Innovation Labs',
          location: location || 'New York, NY',
          matchScore: 87,
          matchReasons: ['Advanced skills alignment', 'Leadership potential', 'Experience level'],
          salaryRange: '$100,000 - $150,000',
          jobType: 'full-time',
          description: `Senior position requiring strong technical expertise and team leadership.`,
          requirements: [...parsedResume.skills.technical.slice(0, 3), 'Leadership', 'Mentoring'],
          url: 'https://example.com/job/2',
          source: 'Naukri',
        },
      ];
    }

    const jobMatches = realJobs;

    const firstName = parsedResume.personalInfo?.firstName || '';
    const lastName = parsedResume.personalInfo?.lastName || '';
    const currentPosition = parsedResume.workExperience[0]?.position || parsedResume.professionalSummary?.currentJobTitle || 'Computer Science graduate';
    const currentCompany = parsedResume.workExperience[0]?.company || parsedResume.professionalSummary?.currentCompany || 'recent graduate';
    const topSkills = parsedResume.skills?.technical?.slice(0, 3).join(', ') || allSkills.slice(0, 50);

    const summaryForRecruiters = `${firstName} ${lastName} possesses a strong background in ${allSkills || 'various technical skills'}. Highlights include ${currentPosition} at ${currentCompany} and expertise in ${topSkills}. This candidate's profile and resume data indicates strong alignment with software development roles requiring technical proficiency and practical experience.`;

    const skillGaps = [];
    const technicalSkills = parsedResume.skills?.technical || [];
    if (technicalSkills.length < 5) {
      skillGaps.push({
        skill: 'Additional Technical Skills',
        importance: 'medium' as const,
        learningResources: ['Coursera', 'Udemy', 'LinkedIn Learning'],
      });
    }

    const yearsOfExperience = parsedResume.workExperience?.length || parsedResume.professionalSummary?.yearsOfExperience || 0;
    const topTechSkills = technicalSkills.slice(0, 3).join(', ') || 'your current skills';
    const careerAdvice = `Based on your ${yearsOfExperience} years of experience and strong foundation in ${topTechSkills}, consider advancing to senior roles or exploring leadership opportunities. Focus on building expertise in emerging technologies relevant to your field.`;

    return {
      parsedResume,
      jobMatches,
      summaryForRecruiters,
      skillGaps,
      careerAdvice,
    };
  }
);
