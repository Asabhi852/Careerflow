import { NextRequest, NextResponse } from 'next/server';
import { multilingualQueryResolution } from '@/ai/flows/multilingual-query-resolution';
import type { MultilingualQueryResolutionInput } from '@/ai/flows/multilingual-query-resolution';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { query, language, userData } = body as Partial<MultilingualQueryResolutionInput> & {
      query?: string;
    };

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 },
      );
    }

    const input: MultilingualQueryResolutionInput = {
      query,
      language,
      userData,
    };

    const result = await multilingualQueryResolution(input);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error in AI chat route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process AI chat request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
