import { NextRequest, NextResponse } from 'next/server';
import { jobOpportunitiesFlow } from '@/ai/flows/job-match-suggestions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeText, userPreferences } = body;

    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      );
    }

    if (resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Resume text is too short' },
        { status: 400 }
      );
    }

    // Use AI to match jobs based on resume
    const result = await jobOpportunitiesFlow({
      resumeText,
      userPreferences: userPreferences || {},
    });

    return NextResponse.json({ 
      success: true, 
      data: result 
    });
  } catch (error: any) {
    console.error('AI job matching error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to match jobs' },
      { status: 500 }
    );
  }
}
