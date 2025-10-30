# External Job Integration Guide

## Overview

The Careerflow platform now supports fetching and displaying jobs from external sources including **LinkedIn** and **Naukri.com**. This feature allows users to browse jobs from multiple platforms in one unified interface.

## Features

### ✅ Implemented Features

1. **Multi-Source Job Aggregation**
   - Fetch jobs from LinkedIn
   - Fetch jobs from Naukri.com
   - Combine with internal job postings
   - Filter by source

2. **Enhanced Job Dashboard**
   - Tabbed interface for filtering jobs by source
   - Real-time job counts per source
   - Refresh button for external jobs
   - Visual badges indicating job source

3. **External Job Cards**
   - Display external job information
   - Direct links to original job postings
   - Source badges (LinkedIn/Naukri)
   - External link indicators

## Architecture

### File Structure

```
src/
├── lib/
│   ├── job-scrapers.ts          # Job fetching logic for external sources
│   └── types.ts                  # Updated JobPosting type with source fields
├── hooks/
│   └── use-external-jobs.ts      # React hook for fetching external jobs
├── app/
│   ├── api/
│   │   └── jobs/
│   │       └── external/
│   │           └── route.ts      # API endpoint for external jobs
│   └── dashboard/
│       └── jobs/
│           └── page.tsx          # Updated jobs dashboard with tabs
└── components/
    └── jobs/
        └── job-card.tsx          # Updated to handle external jobs
```

### Data Flow

1. **User Interface** → Dashboard with tabs (All/Internal/LinkedIn/Naukri)
2. **React Hook** → `useExternalJobs()` manages external job state
3. **API Route** → `/api/jobs/external` handles requests
4. **Job Scrapers** → `job-scrapers.ts` fetches from external sources
5. **Display** → Jobs rendered with source badges and external links

## Usage

### For Users

1. **Navigate to Jobs Dashboard**
   - Go to `/dashboard/jobs`

2. **Browse Jobs by Source**
   - Click "All Jobs" to see all available jobs
   - Click "Internal" for platform-specific jobs
   - Click "LinkedIn" for LinkedIn jobs only
   - Click "Naukri.com" for Naukri jobs only

3. **Refresh External Jobs**
   - Click the "Refresh External Jobs" button to fetch latest listings

4. **View Job Details**
   - Internal jobs: Click "View Details" to see full information
   - External jobs: Click "View on LinkedIn/Naukri.com" to visit original posting

### For Developers

#### Fetching External Jobs

```typescript
import { useExternalJobs } from '@/hooks/use-external-jobs';

function MyComponent() {
  const { jobs, isLoading, error, refetch } = useExternalJobs({
    source: 'linkedin', // 'linkedin' | 'naukri' | 'all'
    query: 'software engineer',
    location: 'India',
    limit: 20,
    enabled: true
  });

  return (
    <div>
      {jobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
```

#### Using the API Directly

```typescript
// GET /api/jobs/external
const response = await fetch('/api/jobs/external?source=linkedin&limit=10');
const data = await response.json();
// data.data contains the jobs array
```

#### Adding New Job Sources

1. Create a new fetcher function in `src/lib/job-scrapers.ts`:

```typescript
export async function fetchNewSourceJobs(params: JobSearchParams): Promise<JobPosting[]> {
  // Implement fetching logic
  return jobs;
}
```

2. Update the `fetchJobsBySource` function to include the new source
3. Add the new source to the TypeScript types in `src/lib/types.ts`
4. Update the dashboard tabs to include the new source

## Important Notes

### ⚠️ Current Implementation

The current implementation uses **mock data** for demonstration purposes. In a production environment, you need to:

1. **Use Official APIs**
   - LinkedIn Jobs API (requires partnership/approval)
   - Naukri API (requires partnership)
   - Alternative: Use third-party job aggregation services

2. **Implement Proper Authentication**
   - API keys for external services
   - Rate limiting
   - Error handling

3. **Respect Terms of Service**
   - Do not scrape websites directly without permission
   - Follow robots.txt guidelines
   - Implement proper caching to reduce API calls

### 🔧 Production Setup

To integrate real APIs:

1. **Sign up for API access:**
   - LinkedIn: https://developer.linkedin.com/
   - Naukri: Contact Naukri for API partnership
   - Alternative services:
     - Adzuna API: https://developer.adzuna.com/
     - The Muse API: https://www.themuse.com/developers/api/v2
     - RapidAPI Job Search APIs

2. **Add environment variables:**

```env
# .env.local
LINKEDIN_API_KEY=your_api_key
NAUKRI_API_KEY=your_api_key
JOB_API_BASE_URL=https://api.example.com
```

3. **Update `src/lib/job-scrapers.ts`:**

```typescript
export async function fetchLinkedInJobs(params: JobSearchParams): Promise<JobPosting[]> {
  const apiKey = process.env.LINKEDIN_API_KEY;
  const response = await fetch(`https://api.linkedin.com/v2/jobs?keywords=${params.query}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });
  
  const data = await response.json();
  return transformLinkedInJobs(data); // Transform to JobPosting format
}
```

4. **Implement caching:**
   - Use Redis or similar for caching API responses
   - Set appropriate TTL (Time To Live) for cached data
   - Implement background job refresh

## API Reference

### GET /api/jobs/external

Fetches jobs from external sources.

**Query Parameters:**
- `source` (string): 'linkedin' | 'naukri' | 'all' (default: 'all')
- `query` (string): Search query (default: '')
- `location` (string): Job location (default: '')
- `limit` (number): Maximum number of results (default: 20)
- `category` (string): Job category filter (default: '')

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "linkedin-123",
      "title": "Software Engineer",
      "company": "Tech Corp",
      "location": "Bangalore, India",
      "description": "...",
      "salary": 2500000,
      "skills": ["React", "Node.js"],
      "source": "linkedin",
      "externalUrl": "https://linkedin.com/jobs/...",
      "postedDate": "2024-01-15T10:00:00Z",
      "employmentType": "Full-time"
    }
  ],
  "count": 1,
  "source": "linkedin"
}
```

## Troubleshooting

### Jobs Not Loading

1. Check browser console for errors
2. Verify API endpoint is accessible: `/api/jobs/external`
3. Check network tab for failed requests
4. Ensure mock data is being returned (in current implementation)

### External Links Not Working

1. Verify `externalUrl` field is populated
2. Check if job source is correctly set
3. Ensure external links open in new tab

### Performance Issues

1. Implement pagination for large result sets
2. Add caching layer for API responses
3. Use debouncing for search queries
4. Consider server-side rendering for initial load

## Future Enhancements

- [ ] Add more job sources (Indeed, Glassdoor, etc.)
- [ ] Implement advanced search filters
- [ ] Add job alerts/notifications
- [ ] Implement job application tracking for external jobs
- [ ] Add salary comparison across sources
- [ ] Implement job recommendation engine
- [ ] Add analytics for job source performance

## Support

For questions or issues related to external job integration, please:
1. Check this documentation
2. Review the code comments in relevant files
3. Open an issue on the project repository
4. Contact the development team

---

**Last Updated:** October 2024
**Version:** 1.0.0
