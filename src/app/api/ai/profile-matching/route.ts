import { NextRequest, NextResponse } from 'next/server';
import { profileMatchingFlow } from '@/ai/flows/resume-parser';

export async function POST(request: NextRequest) {
  try {
    const { candidateProfile, jobPosting } = await request.json();

    if (!candidateProfile || !jobPosting) {
      return NextResponse.json(
        { error: 'Candidate profile and job posting are required' },
        { status: 400 }
      );
    }

    // Call the profile matching flow
    const matchResult = await profileMatchingFlow({
      candidateProfile,
      jobPosting,
    });

    return NextResponse.json(matchResult);
  } catch (error) {
    console.error('Error matching profile:', error);
    return NextResponse.json(
      { error: 'Failed to match profile' },
      { status: 500 }
    );
  }
}
