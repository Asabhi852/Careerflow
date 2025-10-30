import { NextRequest, NextResponse } from 'next/server';
import { fetchJobsBySource } from '@/lib/job-scrapers';

/**
 * API Route: GET /api/jobs/external
 * Fetches jobs from external sources (LinkedIn, Naukri)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const source = (searchParams.get('source') || 'all') as 'linkedin' | 'naukri' | 'all';
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || '';

    const jobs = await fetchJobsBySource(source, {
      query,
      location,
      limit,
      category
    });

    return NextResponse.json({
      success: true,
      data: jobs,
      count: jobs.length,
      source
    });
  } catch (error) {
    console.error('Error in external jobs API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch external jobs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
