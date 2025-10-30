import { NextRequest, NextResponse } from 'next/server';
import { jobOpportunitiesFlow } from '@/ai/flows/job-match-suggestions';

/**
 * API Route: POST /api/ai/job-opportunities
 * Finds AI-powered job opportunities based on user resume and preferences
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

    // Call the job opportunities flow
    const result = await jobOpportunitiesFlow({
      resumeText,
      userPreferences,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in job opportunities API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to find job opportunities',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
