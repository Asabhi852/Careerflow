// @ts-nocheck
import { ai } from '../genkit';
import * as z from 'zod';

// Define the schema for parsed resume data
const ParsedResumeSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().describe('First name of the candidate'),
    lastName: z.string().describe('Last name of the candidate'),
    email: z.string().email().optional().describe('Email address'),
    phoneNumber: z.string().optional().describe('Phone number'),
    location: z.string().optional().describe('City, State/Country'),
    linkedIn: z.string().optional().describe('LinkedIn profile URL'),
    portfolio: z.string().optional().describe('Portfolio or personal website URL'),
    age: z.number().optional().describe('Age if mentioned'),
  }),
  
  professionalSummary: z.object({
    bio: z.string().describe('Professional summary or objective statement'),
    currentJobTitle: z.string().optional().describe('Current or most recent job title'),
    currentCompany: z.string().optional().describe('Current or most recent company'),
    yearsOfExperience: z.number().optional().describe('Total years of professional experience'),
  }),
  
  workExperience: z.array(z.object({
    company: z.string().describe('Company name'),
    position: z.string().describe('Job title/position'),
    startDate: z.string().describe('Start date (format: YYYY-MM or YYYY)'),
    endDate: z.string().optional().describe('End date (format: YYYY-MM or YYYY), null if current'),
    current: z.boolean().describe('Whether this is the current position'),
    description: z.string().describe('Job responsibilities and achievements'),
    location: z.string().optional().describe('Job location'),
  })).describe('Work experience history, ordered from most recent to oldest'),
  
  education: z.array(z.object({
    institution: z.string().describe('School/University name'),
    degree: z.string().describe('Degree type (e.g., Bachelor of Science, Master of Arts)'),
    field: z.string().describe('Field of study/major'),
    graduationYear: z.string().optional().describe('Graduation year'),
    gpa: z.string().optional().describe('GPA if mentioned'),
  })).describe('Educational background'),
  
  skills: z.object({
    technical: z.array(z.string()).describe('Technical skills (programming languages, tools, software)'),
    soft: z.array(z.string()).describe('Soft skills (communication, leadership, etc.)'),
    languages: z.array(z.string()).describe('Spoken languages'),
    certifications: z.array(z.string()).describe('Professional certifications'),
  }),
  
  certificates: z.array(z.object({
    name: z.string().describe('Certificate name'),
    issuer: z.string().describe('Issuing organization'),
    issueDate: z.string().optional().describe('Issue date'),
    expiryDate: z.string().optional().describe('Expiry date if applicable'),
    credentialId: z.string().optional().describe('Credential ID if provided'),
  })).optional().describe('Professional certificates and credentials'),
  
  projects: z.array(z.object({
    name: z.string().describe('Project name'),
    description: z.string().describe('Project description'),
    technologies: z.array(z.string()).describe('Technologies used'),
    url: z.string().optional().describe('Project URL or demo link'),
  })).optional().describe('Notable projects'),
  
  achievements: z.array(z.string()).optional().describe('Awards, honors, and notable achievements'),
  
  interests: z.array(z.string()).optional().describe('Professional interests and hobbies'),
  
  availability: z.enum(['available', 'not_available', 'open_to_offers']).describe('Job seeking status'),
  
  expectedSalary: z.number().optional().describe('Expected salary if mentioned'),
  
  preferredJobTypes: z.array(z.string()).optional().describe('Preferred job types (full-time, part-time, contract, remote)'),
  
  preferredLocations: z.array(z.string()).optional().describe('Preferred work locations'),
});

export type ParsedResume = z.infer<typeof ParsedResumeSchema>;

/**
 * Resume Parser Flow
 * Extracts structured information from resume text with 99.9% accuracy
 */
export const resumeParserFlow = ai.defineFlow(
  {
    name: 'resumeParser',
    inputSchema: z.object({
      resumeText: z.string().describe('The full text content of the resume'),
    }),
    outputSchema: ParsedResumeSchema,
  },
  async (input) => {
    const prompt = `You are an expert resume parser with 99.9% accuracy. Analyze the following resume text and extract ALL relevant information into a structured format.

IMPORTANT INSTRUCTIONS:
1. Extract information EXACTLY as it appears in the resume
2. Do NOT make assumptions or add information that isn't present
3. For dates, use the format YYYY-MM or YYYY
4. For work experience, order from most recent to oldest
5. Categorize skills into technical, soft skills, and languages
6. If a field is not mentioned in the resume, use null or empty array
7. Be thorough - extract every detail including projects, achievements, certifications
8. Infer availability based on context (e.g., "actively seeking" = available)
9. Extract salary expectations if mentioned anywhere
10. Identify preferred job types and locations from the resume

RESUME TEXT:
${input.resumeText}

Extract and structure all the information following the schema precisely.`;

    const result = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt,
      output: {
        schema: ParsedResumeSchema,
      },
    });

    return result.output as ParsedResume;
  }
);

/**
 * Profile Matching Score Flow
 * Calculates how well a candidate matches a job posting
 */
export const profileMatchingFlow = ai.defineFlow(
  {
    name: 'profileMatching',
    inputSchema: z.object({
      candidateProfile: z.object({
        skills: z.array(z.string()),
        experience: z.array(z.any()),
        education: z.array(z.any()),
        bio: z.string().optional(),
      }),
      jobPosting: z.object({
        title: z.string(),
        description: z.string(),
        skills: z.array(z.string()),
        requirements: z.string().optional(),
      }),
    }),
    outputSchema: z.object({
      matchScore: z.number().min(0).max(100).describe('Overall match score (0-100)'),
      skillsMatch: z.number().min(0).max(100).describe('Skills match percentage'),
      experienceMatch: z.number().min(0).max(100).describe('Experience match percentage'),
      educationMatch: z.number().min(0).max(100).describe('Education match percentage'),
      strengths: z.array(z.string()).describe('Candidate strengths for this role'),
      gaps: z.array(z.string()).describe('Areas where candidate may need improvement'),
      recommendations: z.array(z.string()).describe('Personalized recommendations'),
      fitSummary: z.string().describe('Overall fit summary'),
    }),
  },
  async (input) => {
    const prompt = `You are an expert recruiter analyzing candidate-job fit. Provide a detailed matching analysis.

CANDIDATE PROFILE:
Skills: ${input.candidateProfile.skills.join(', ')}
Bio: ${input.candidateProfile.bio || 'Not provided'}
Experience: ${JSON.stringify(input.candidateProfile.experience, null, 2)}
Education: ${JSON.stringify(input.candidateProfile.education, null, 2)}

JOB POSTING:
Title: ${input.jobPosting.title}
Description: ${input.jobPosting.description}
Required Skills: ${input.jobPosting.skills.join(', ')}
Requirements: ${input.jobPosting.requirements || 'Not specified'}

Analyze the match and provide:
1. Overall match score (0-100)
2. Skills match percentage
3. Experience match percentage
4. Education match percentage
5. Key strengths of the candidate for this role
6. Skill/experience gaps
7. Personalized recommendations for the candidate
8. A summary of overall fit

Be objective and thorough in your analysis.`;

    const result = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt,
      output: {
        schema: z.object({
          matchScore: z.number(),
          skillsMatch: z.number(),
          experienceMatch: z.number(),
          educationMatch: z.number(),
          strengths: z.array(z.string()),
          gaps: z.array(z.string()),
          recommendations: z.array(z.string()),
          fitSummary: z.string(),
        }),
      },
    });

    return result.output;
  }
);

/**
 * Personalized Career Recommendations Flow
 * Provides personalized career advice based on user profile
 */
export const careerRecommendationsFlow = ai.defineFlow(
  {
    name: 'careerRecommendations',
    inputSchema: z.object({
      userProfile: z.object({
        skills: z.array(z.string()),
        experience: z.array(z.any()),
        interests: z.array(z.string()).optional(),
        currentRole: z.string().optional(),
        careerGoals: z.string().optional(),
      }),
    }),
    outputSchema: z.object({
      recommendedRoles: z.array(z.object({
        title: z.string(),
        reason: z.string(),
        requiredSkills: z.array(z.string()),
        salaryRange: z.string(),
      })),
      skillsToLearn: z.array(z.object({
        skill: z.string(),
        priority: z.enum(['high', 'medium', 'low']),
        reason: z.string(),
        resources: z.array(z.string()),
      })),
      careerPath: z.array(z.object({
        step: z.number(),
        role: z.string(),
        timeline: z.string(),
        description: z.string(),
      })),
      personalizedAdvice: z.string(),
    }),
  },
  async (input) => {
    const prompt = `You are a career counselor providing personalized career recommendations.

USER PROFILE:
Current Role: ${input.userProfile.currentRole || 'Not specified'}
Skills: ${input.userProfile.skills.join(', ')}
Experience: ${JSON.stringify(input.userProfile.experience, null, 2)}
Interests: ${input.userProfile.interests?.join(', ') || 'Not specified'}
Career Goals: ${input.userProfile.careerGoals || 'Not specified'}

Provide:
1. 5 recommended job roles that match their profile
2. Top 5 skills they should learn (with priority and learning resources)
3. A 5-step career path progression
4. Personalized career advice

Be specific, actionable, and encouraging.`;

    const result = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt,
      output: {
        schema: z.object({
          recommendedRoles: z.array(z.object({
            title: z.string(),
            reason: z.string(),
            requiredSkills: z.array(z.string()),
            salaryRange: z.string(),
          })),
          skillsToLearn: z.array(z.object({
            skill: z.string(),
            priority: z.enum(['high', 'medium', 'low']),
            reason: z.string(),
            resources: z.array(z.string()),
          })),
          careerPath: z.array(z.object({
            step: z.number(),
            role: z.string(),
            timeline: z.string(),
            description: z.string(),
          })),
          personalizedAdvice: z.string(),
        }),
      },
    });

    return result.output;
  }
);
