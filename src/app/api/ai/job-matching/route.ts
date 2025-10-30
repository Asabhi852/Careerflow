import { NextRequest, NextResponse } from 'next/server';
import { getTopEnhancedMatches, getTopEnhancedMatchesWithLocationFilter } from '@/lib/ai-matching-algorithm';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import type { UserProfile, JobPosting } from '@/lib/types';
import { fetchJobsBySource } from '@/lib/job-scrapers';

interface JobMatchingRequest {
  userId?: string;
  limit?: number;
  minScore?: number;
  maxDistance?: number;
  sortByDistance?: boolean;
  includeSkillGaps?: boolean;
  includeCareerAdvice?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: JobMatchingRequest = await request.json();
    const {
      userId,
      limit = 10,
      minScore = 40,
      maxDistance = 100,
      sortByDistance = false,
      includeSkillGaps = true,
      includeCareerAdvice = true,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user profile
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get available jobs
    const jobs = await getAvailableJobs();

    // Calculate enhanced matches
    const matches = getTopEnhancedMatchesWithLocationFilter(
      userProfile,
      jobs,
      {
        maxDistance,
        sortByDistance,
        limit,
        minScore,
      }
    );

    // Prepare response
    const response = {
      matches: matches.map(match => ({
        jobId: match.jobId,
        score: match.score,
        matchQuality: match.matchQuality,
        matchedSkills: match.matchedSkills,
        reasons: match.reasons,
        distance: match.distance,
        compatibilityFactors: match.compatibilityFactors,
        ...(includeSkillGaps && { skillGaps: match.skillGaps }),
        ...(includeCareerAdvice && { careerAdvice: match.careerAdvice }),
      })),
      totalMatches: matches.length,
      userProfile: {
        id: userProfile.id,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        skills: userProfile.skills,
        location: userProfile.location,
        availability: userProfile.availability,
      },
      summary: generateMatchingSummary(matches, userProfile),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in job matching API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const minScore = parseInt(searchParams.get('minScore') || '40');
    const maxDistance = parseInt(searchParams.get('maxDistance') || '100');
    const sortByDistance = searchParams.get('sortByDistance') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user profile
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get available jobs
    const jobs = await getAvailableJobs();

    // Calculate enhanced matches
    const matches = getTopEnhancedMatchesWithLocationFilter(
      userProfile,
      jobs,
      {
        maxDistance,
        sortByDistance,
        limit,
        minScore,
      }
    );

    // Prepare response
    const response = {
      matches: matches.map(match => ({
        jobId: match.jobId,
        score: match.score,
        matchQuality: match.matchQuality,
        matchedSkills: match.matchedSkills,
        reasons: match.reasons,
        distance: match.distance,
        compatibilityFactors: match.compatibilityFactors,
        skillGaps: match.skillGaps,
        careerAdvice: match.careerAdvice,
      })),
      totalMatches: matches.length,
      userProfile: {
        id: userProfile.id,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        skills: userProfile.skills,
        location: userProfile.location,
        availability: userProfile.availability,
      },
      summary: generateMatchingSummary(matches, userProfile),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in job matching API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get user profile from Firestore
 */
async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { firestore } = initializeFirebase();
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Get available jobs from various sources
 */
async function getAvailableJobs(): Promise<JobPosting[]> {
  try {
    // First try to get jobs from Firestore
    const { firestore } = initializeFirebase();
    const jobsCollection = collection(firestore, 'jobs');
    const jobsSnapshot = await getDocs(jobsCollection);
    
    const firestoreJobs: JobPosting[] = [];
    jobsSnapshot.forEach((doc) => {
      firestoreJobs.push({ id: doc.id, ...doc.data() } as JobPosting);
    });

    // Also fetch from external job sources (LinkedIn, Naukri)
    try {
      const externalJobs = await fetchJobsBySource('all', { limit: 100 });
      
      // Combine internal and external jobs
      const allJobs = [...firestoreJobs, ...externalJobs];
      console.log(`AI Matching: Found ${firestoreJobs.length} internal jobs and ${externalJobs.length} external jobs`);
      
      return allJobs;
    } catch (externalError) {
      console.error('Error fetching external jobs for AI matching:', externalError);
      // Return internal jobs even if external fetch fails
    }

    return firestoreJobs;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
}

/**
 * Generate matching summary
 */
function generateMatchingSummary(matches: any[], userProfile: UserProfile): string {
  const totalMatches = matches.length;
  const excellentMatches = matches.filter(m => m.matchQuality === 'excellent').length;
  const goodMatches = matches.filter(m => m.matchQuality === 'good').length;
  const averageScore = matches.length > 0 ? Math.round(matches.reduce((sum, m) => sum + m.score, 0) / matches.length) : 0;

  return `Found ${totalMatches} job matches for ${userProfile.firstName} ${userProfile.lastName}. ${excellentMatches} excellent matches, ${goodMatches} good matches. Average match score: ${averageScore}%.`;
}
