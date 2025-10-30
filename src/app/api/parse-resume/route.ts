import { NextRequest, NextResponse } from 'next/server';
import { resumeParserFlow } from '@/ai/flows/resume-parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeText } = body;

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

    // Parse the resume using AI
    const parsedData = await resumeParserFlow({ resumeText });

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Resume parsing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse resume' },
      { status: 500 }
    );
  }
}
