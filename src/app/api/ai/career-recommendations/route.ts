import { NextRequest, NextResponse } from 'next/server';
import { careerRecommendationsFlow } from '@/ai/flows/resume-parser';

export async function POST(request: NextRequest) {
  try {
    const { userProfile } = await request.json();

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile is required' },
        { status: 400 }
      );
    }

    // Call the career recommendations flow
    const recommendations = await careerRecommendationsFlow({ userProfile });

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
