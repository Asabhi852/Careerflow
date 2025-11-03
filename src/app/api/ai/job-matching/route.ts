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

    // REQUIRE location for location-based AI matching
    if (!userProfile.coordinates && !userProfile.location) {
      return NextResponse.json(
        { 
          error: 'Location required for AI job matching',
          message: 'Please add your location in your profile or enable location services to use AI-powered job recommendations.',
          matches: [],
          totalMatches: 0
        },
        { status: 400 }
      );
    }

    // Get available jobs
    const jobs = await getAvailableJobs();

    if (!jobs || jobs.length === 0) {
      console.warn('No jobs available for matching');
      return NextResponse.json({
        matches: [],
        totalMatches: 0,
        userProfile: {
          id: userProfile.id,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          skills: userProfile.skills,
          location: userProfile.location,
          availability: userProfile.availability,
        },
        summary: 'No jobs available at the moment. Please check back later.',
      });
    }

    // Calculate enhanced matches with error handling
    let matches = [];
    try {
      matches = getTopEnhancedMatchesWithLocationFilter(
        userProfile,
        jobs,
        {
          maxDistance,
          sortByDistance,
          limit,
          minScore,
        }
      );
    } catch (matchError) {
      console.error('Error calculating matches:', matchError);
      // Fallback to empty matches
      matches = [];
    }

    // Prepare response
    const response = {
      matches: matches.map(match => ({
        jobId: match.jobId,
        score: match.score,
        matchQuality: match.matchQuality,
        matchedSkills: match.matchedSkills || [],
        reasons: match.reasons || [],
        distance: match.distance,
        compatibilityFactors: match.compatibilityFactors || {},
        ...(includeSkillGaps && { skillGaps: match.skillGaps || [] }),
        ...(includeCareerAdvice && { careerAdvice: match.careerAdvice || '' }),
      })),
      totalMatches: matches.length,
      userProfile: {
        id: userProfile.id,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        skills: userProfile.skills || [],
        location: userProfile.location,
        availability: userProfile.availability,
      },
      summary: generateMatchingSummary(matches, userProfile),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in job matching API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Full error details:', errorMessage);
    return NextResponse.json(
      { 
        error: 'Failed to generate job matches',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        matches: [],
        totalMatches: 0
      },
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

    // REQUIRE location for location-based AI matching
    if (!userProfile.coordinates && !userProfile.location) {
      return NextResponse.json(
        { 
          error: 'Location required for AI job matching',
          message: 'Please add your location in your profile or enable location services to use AI-powered job recommendations.',
          matches: [],
          totalMatches: 0
        },
        { status: 400 }
      );
    }

    // Get available jobs
    const jobs = await getAvailableJobs();

    if (!jobs || jobs.length === 0) {
      console.warn('No jobs available for matching');
      return NextResponse.json({
        matches: [],
        totalMatches: 0,
        userProfile: {
          id: userProfile.id,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          skills: userProfile.skills,
          location: userProfile.location,
          availability: userProfile.availability,
        },
        summary: 'No jobs available at the moment. Please check back later.',
      });
    }

    // Calculate enhanced matches with error handling
    let matches = [];
    try {
      matches = getTopEnhancedMatchesWithLocationFilter(
        userProfile,
        jobs,
        {
          maxDistance,
          sortByDistance,
          limit,
          minScore,
        }
      );
    } catch (matchError) {
      console.error('Error calculating matches:', matchError);
      matches = [];
    }

    // Prepare response
    const response = {
      matches: matches.map(match => ({
        jobId: match.jobId,
        score: match.score,
        matchQuality: match.matchQuality,
        matchedSkills: match.matchedSkills || [],
        reasons: match.reasons || [],
        distance: match.distance,
        compatibilityFactors: match.compatibilityFactors || {},
        skillGaps: match.skillGaps || [],
        careerAdvice: match.careerAdvice || '',
      })),
      totalMatches: matches.length,
      userProfile: {
        id: userProfile.id,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        skills: userProfile.skills || [],
        location: userProfile.location,
        availability: userProfile.availability,
      },
      summary: generateMatchingSummary(matches, userProfile),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in job matching API (GET):', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Full error details:', errorMessage);
    return NextResponse.json(
      { 
        error: 'Failed to generate job matches',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        matches: [],
        totalMatches: 0
      },
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
  const allJobs: JobPosting[] = [];
  
  try {
    // First try to get jobs from Firestore
    const { firestore } = initializeFirebase();
    const jobsCollection = collection(firestore, 'jobs');
    const jobsSnapshot = await getDocs(jobsCollection);
    
    jobsSnapshot.forEach((doc) => {
      try {
        const jobData = doc.data();
        if (jobData) {
          allJobs.push({ id: doc.id, ...jobData } as JobPosting);
        }
      } catch (docError) {
        console.error(`Error processing job document ${doc.id}:`, docError);
      }
    });

    console.log(`AI Matching: Found ${allJobs.length} internal jobs from Firestore`);
  } catch (firestoreError) {
    console.error('Error fetching internal jobs from Firestore:', firestoreError);
  }

  // Also fetch from external job sources (LinkedIn, Naukri)
  try {
    const externalJobs = await fetchJobsBySource('all', { limit: 100 });
    
    if (externalJobs && Array.isArray(externalJobs)) {
      allJobs.push(...externalJobs);
      console.log(`AI Matching: Found ${externalJobs.length} external jobs`);
    }
  } catch (externalError) {
    console.error('Error fetching external jobs for AI matching:', externalError);
    // Continue with internal jobs only
  }

  console.log(`AI Matching: Total jobs available: ${allJobs.length}`);
  return allJobs;
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
