import { NextRequest, NextResponse } from 'next/server';
import { getTopEnhancedMatchesWithLocationFilter } from '@/lib/ai-matching-algorithm';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { UserProfile, JobPosting } from '@/lib/types';

/**
 * API Route: POST /api/ai/resume-job-match
 * Matches an uploaded resume against existing jobs in the database
 */
export async function POST(request: NextRequest) {
  try {
    const { resumeText, userPreferences } = await request.json();

    if (!resumeText) {
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      );
    }

    // Parse the resume using AI
    const { resumeParserFlow } = await import('@/ai/flows/resume-parser');
    const parsedResume = await resumeParserFlow({ resumeText });

    console.log('Resume parsed successfully:', {
      name: `${parsedResume.personalInfo.firstName} ${parsedResume.personalInfo.lastName}`,
      skills: parsedResume.skills.technical.length,
      experience: parsedResume.workExperience.length,
    });

    // Convert parsed resume to UserProfile format
    const userProfile: UserProfile = {
      id: 'temp-' + Date.now(), // Temporary ID for matching
      firstName: parsedResume.personalInfo.firstName || '',
      lastName: parsedResume.personalInfo.lastName || '',
      email: parsedResume.personalInfo.email || '',
      location: parsedResume.personalInfo.location || userPreferences?.location || '',
      age: parsedResume.personalInfo.age,
      skills: [
        ...parsedResume.skills.technical,
        ...parsedResume.skills.soft,
      ],
      interests: parsedResume.interests || [],
      currentJobTitle: parsedResume.professionalSummary.currentJobTitle || parsedResume.workExperience[0]?.position || '',
      currentCompany: parsedResume.professionalSummary.currentCompany || parsedResume.workExperience[0]?.company || '',
      workExperience: parsedResume.workExperience.map(exp => ({
        company: exp.company,
        position: exp.position,
        startDate: exp.startDate,
        endDate: exp.endDate || '',
        description: exp.description,
        current: exp.current,
      })),
      education: parsedResume.education.map(edu => `${edu.degree} in ${edu.field} from ${edu.institution}`),
      availability: parsedResume.availability || 'open_to_offers',
      expectedSalary: parsedResume.expectedSalary,
      userType: 'job_seeker',
      createdAt: new Date().toISOString(),
    };

    // Get available jobs from internal database AND external sources
    const internalJobs = await getInternalJobs();
    const externalJobs = await getExternalJobs();
    const jobs = [...internalJobs, ...externalJobs];

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          parsedResume,
          jobMatches: [],
          totalJobs: 0,
          message: 'No jobs available in the database. Please check back later or contact the administrator.',
        },
      });
    }

    console.log(`Found ${jobs.length} jobs in database for matching`);

    // Calculate enhanced matches using AI algorithm
    const matches = getTopEnhancedMatchesWithLocationFilter(
      userProfile,
      jobs,
      {
        maxDistance: userPreferences?.maxDistance || 100,
        sortByDistance: userPreferences?.sortByDistance || false,
        limit: userPreferences?.limit || 20,
        minScore: userPreferences?.minScore || 30, // Lower threshold to show more results
      }
    );

    // Enrich matches with full job details
    const enrichedMatches = matches.map(match => {
      const job = jobs.find(j => j.id === match.jobId);
      return {
        ...match,
        job: job || null,
        applied: false, // Can be updated based on user application history
      };
    });

    // Generate summary for recruiters
    const allSkills = [
      ...parsedResume.skills.technical,
      ...parsedResume.skills.soft,
    ].join(', ');

    const summaryForRecruiters = `${parsedResume.personalInfo.firstName} ${parsedResume.personalInfo.lastName} brings ${parsedResume.professionalSummary.yearsOfExperience || 'substantial'} years of experience as ${parsedResume.professionalSummary.currentJobTitle || 'a professional'}. Key skills include ${allSkills.substring(0, 200)}. Strong track record with ${parsedResume.workExperience.length} professional positions and ${parsedResume.education.length} educational qualifications.`;

    // Identify skill gaps based on top matches
    const allRequiredSkills = new Set<string>();
    enrichedMatches.slice(0, 5).forEach(match => {
      if (match.job && match.job.skills) {
        match.job.skills.forEach((skill: string) => allRequiredSkills.add(skill.toLowerCase()));
      }
    });

    const userSkillsLower = userProfile.skills.map(s => s.toLowerCase());
    const skillGaps = Array.from(allRequiredSkills)
      .filter(skill => !userSkillsLower.includes(skill))
      .slice(0, 10)
      .map(skill => ({
        skill,
        importance: 'medium' as const,
        learningResources: getLearningResources(skill),
      }));

    // Generate career advice
    const yearsOfExp = parsedResume.professionalSummary.yearsOfExperience || 0;
    const topSkills = parsedResume.skills.technical.slice(0, 3).join(', ') || 'your current skills';
    const careerAdvice = generateCareerAdvice(yearsOfExp, topSkills, enrichedMatches.length, skillGaps.length);

    return NextResponse.json({
      success: true,
      data: {
        parsedResume,
        userProfile: {
          name: `${userProfile.firstName} ${userProfile.lastName}`,
          currentRole: userProfile.currentJobTitle,
          location: userProfile.location,
          skills: userProfile.skills,
          experience: userProfile.workExperience.length,
        },
        jobMatches: enrichedMatches,
        totalJobs: jobs.length,
        totalMatches: enrichedMatches.length,
        summaryForRecruiters,
        skillGaps,
        careerAdvice,
        matchingStats: {
          excellent: enrichedMatches.filter(m => m.matchQuality === 'excellent').length,
          good: enrichedMatches.filter(m => m.matchQuality === 'good').length,
          fair: enrichedMatches.filter(m => m.matchQuality === 'fair').length,
          averageScore: enrichedMatches.length > 0 
            ? Math.round(enrichedMatches.reduce((sum, m) => sum + m.score, 0) / enrichedMatches.length)
            : 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Error in resume job matching:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to match resume with jobs',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Get jobs from internal Firestore database ONLY
 */
async function getInternalJobs(): Promise<JobPosting[]> {
  try {
    const { firestore } = initializeFirebase();
    const jobsCollection = collection(firestore, 'jobs');
    const jobsSnapshot = await getDocs(jobsCollection);
    
    const jobs: JobPosting[] = [];
    jobsSnapshot.forEach((doc) => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        title: data.title || '',
        company: data.company || '',
        location: data.location || '',
        description: data.description || '',
        skills: data.skills || [],
        salary: data.salary || 0,
        employmentType: data.employmentType || 'Full-time',
        experienceLevel: data.experienceLevel || '',
        postedDate: data.postedDate || new Date().toISOString(),
      } as JobPosting);
    });

    console.log(`Retrieved ${jobs.length} jobs from internal database`);
    return jobs;
  } catch (error) {
    console.error('Error fetching internal jobs:', error);
    return [];
  }
}

/**
 * Get external jobs from LinkedIn and Naukri
 */
async function getExternalJobs(): Promise<JobPosting[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/jobs/external?source=all&limit=50`);
    
    if (!response.ok) {
      console.warn('Failed to fetch external jobs');
      return [];
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data.map((job: any) => ({
        ...job,
        source: job.source || 'external',
        posterId: job.posterId || 'external-system',
        status: job.status || 'active',
      })) as JobPosting[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching external jobs:', error);
    return [];
  }
}

/**
 * Get learning resources for a skill
 */
function getLearningResources(skill: string): string[] {
  const resources: Record<string, string[]> = {
    'javascript': ['freeCodeCamp (YouTube)', 'Traversy Media', 'Web Dev Simplified'],
    'python': ['freeCodeCamp (YouTube)', 'Corey Schafer', 'Tech With Tim'],
    'react': ['Web Dev Simplified', 'Traversy Media', 'freeCodeCamp (YouTube)'],
    'node': ['Traversy Media', 'The Net Ninja', 'freeCodeCamp (YouTube)'],
    'sql': ['freeCodeCamp (YouTube)', 'Alex The Analyst', 'Kudvenkat'],
    'aws': ['freeCodeCamp (YouTube)', 'Stephane Maarek', 'AWS Tutorials by Be A Better Dev'],
    'docker': ['TechWorld with Nana', 'freeCodeCamp (YouTube)', 'KodeKloud'],
    'kubernetes': ['TechWorld with Nana', 'KodeKloud', 'freeCodeCamp (YouTube)'],
  };

  for (const [key, resourceList] of Object.entries(resources)) {
    if (skill.toLowerCase().includes(key)) {
      return resourceList;
    }
  }

  return ['freeCodeCamp (YouTube)', 'Traversy Media', 'The Net Ninja', 'Fireship'];
}

/**
 * Generate personalized career advice
 */
function generateCareerAdvice(
  yearsOfExperience: number,
  topSkills: string,
  matchCount: number,
  skillGapCount: number
): string {
  const advice: string[] = [];

  if (matchCount === 0) {
    advice.push('No matching jobs found in our current database. Consider broadening your search criteria or updating your skills.');
  } else if (matchCount < 5) {
    advice.push(`Found ${matchCount} potential matches. Consider expanding your skill set to increase opportunities.`);
  } else {
    advice.push(`Great news! Found ${matchCount} jobs matching your profile.`);
  }

  if (yearsOfExperience < 2) {
    advice.push('Focus on building hands-on experience through projects, internships, or entry-level positions.');
  } else if (yearsOfExperience < 5) {
    advice.push(`With ${yearsOfExperience} years of experience, you're well-positioned for mid-level roles. Consider leadership opportunities.`);
  } else {
    advice.push(`Your ${yearsOfExperience}+ years of experience make you an ideal candidate for senior and leadership positions.`);
  }

  if (skillGapCount > 0) {
    advice.push(`Identified ${skillGapCount} skills that are in high demand. Consider upskilling to improve your job prospects.`);
  }

  advice.push(`Continue leveraging your expertise in ${topSkills} while staying current with industry trends.`);

  return advice.join(' ');
}
