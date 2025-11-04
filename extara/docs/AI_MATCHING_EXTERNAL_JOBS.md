# AI Matching with External Jobs

## Overview

The AI matching feature now includes jobs from both internal postings and external sources (LinkedIn and Naukri.com).

## How It Works

### 1. Job Sources

The AI matching system pulls jobs from three sources:

- **Internal Jobs**: Jobs posted on the Careerflow platform (stored in Firestore `jobs` collection)
- **LinkedIn Jobs**: External jobs from LinkedIn (via `fetchLinkedInJobs`)
- **Naukri Jobs**: External jobs from Naukri.com (via `fetchNaukriJobs`)

### 2. Implementation Details

#### API Route (`/api/ai/job-matching`)
Located at `src/app/api/ai/job-matching/route.ts`

This API endpoint:
1. Fetches the user's profile from Firestore
2. Gets available jobs from multiple sources:
   - Internal jobs from Firestore `jobs` collection
   - External jobs from LinkedIn and Naukri via `fetchJobsBySource('all', { limit: 100 })`
3. Combines all jobs into a single array
4. Runs the AI matching algorithm to calculate match scores
5. Returns matched jobs with:
   - Match score (0-100%)
   - Skill gaps analysis
   - Career advice
   - Location distance (if enabled)
   - Match quality rating (excellent/good/fair/poor)

#### Frontend AI Matches Page
Located at `src/app/dashboard/ai-matches/page.tsx`

This page:
1. Fetches internal jobs from Firestore
2. Fetches external jobs from LinkedIn/Naukri using the `useExternalJobs` hook
3. Combines both sources
4. Displays matched jobs with detailed analysis

### 3. Key Files

- **API Route**: `src/app/api/ai/job-matching/route.ts`
  - `getAvailableJobs()` function combines internal and external jobs
  - Uses `fetchJobsBySource` from `src/lib/job-scrapers.ts`

- **Frontend**: `src/app/dashboard/ai-matches/page.tsx`
  - Fetches external jobs using `useExternalJobs` hook
  - Combines internal and external jobs for matching

- **Job Scrapers**: `src/lib/job-scrapers.ts`
  - Implements `fetchLinkedInJobs()`, `fetchNaukriJobs()`, and `fetchJobsBySource()`
  - Currently uses mock data (see production notes below)

- **API Endpoint**: `src/app/api/jobs/external/route.ts`
  - `/api/jobs/external?source=all` - Fetches jobs from all external sources

### 4. Matching Algorithm

The AI matching algorithm considers:

1. **Skills Match** - Compares user skills with job requirements
2. **Experience Match** - Evaluates work experience relevance
3. **Location** - Calculates distance if user location is enabled
4. **Education** - Matches education requirements
5. **Salary Expectations** - Compares expected vs offered salary
6. **Availability** - Checks job availability vs user availability
7. **Career Progression** - Analyzes career growth potential
8. **Cultural Fit** - Evaluates company culture compatibility

### 5. Features

- ✅ Matches against internal platform jobs
- ✅ Matches against LinkedIn jobs
- ✅ Matches against Naukri.com jobs
- ✅ Shows match score (0-100%)
- ✅ Identifies skill gaps with learning resources
- ✅ Provides personalized career advice
- ✅ Location-based filtering (if enabled)
- ✅ Distance calculation for nearby jobs

### 6. Current Status

**Internal Jobs**: ✅ Fully functional

**External Jobs**: 
- ⚠️ Currently using mock data (for demo purposes)
- 📋 See production integration guide below

### 7. Production Integration

To use real external job data in production, you need to:

#### Option 1: Official APIs
```typescript
// LinkedIn Jobs API (requires partnership)
const response = await fetch('https://api.linkedin.com/v2/jobs', {
  headers: {
    'Authorization': `Bearer ${LINKEDIN_API_KEY}`
  }
});

// Naukri API (requires API access)
const response = await fetch('https://api.naukri.com/jobs', {
  headers: {
    'Authorization': `Bearer ${NAUKRI_API_KEY}`
  }
});
```

#### Option 2: Third-Party Aggregators
```typescript
// Adzuna API (free tier available)
const response = await fetch(
  `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${APP_ID}&app_key=${API_KEY}`
);

// The Muse API
const response = await fetch('https://api.themuse.com/v2/positions', {
  headers: {
    'Authorization': `Bearer ${THEMUSE_API_KEY}`
  }
});
```

#### Option 3: Update `src/lib/job-scrapers.ts`

Replace the mock data functions with real API calls:

```typescript
export async function fetchLinkedInJobs(params: JobSearchParams): Promise<JobPosting[]> {
  // Replace mock data with actual LinkedIn API call
  const response = await fetch(`https://api.linkedin.com/v2/jobs`, {
    headers: {
      'Authorization': `Bearer ${process.env.LINKEDIN_API_KEY}`,
    },
    // ... other params
  });
  
  const data = await response.json();
  return data.jobs;
}
```

### 8. Benefits of Including External Jobs

1. **More Opportunities**: Users get matched with jobs from LinkedIn and Naukri, not just internal postings
2. **Better Coverage**: Thousands of additional jobs from major job boards
3. **Comprehensive Search**: Single platform for all job opportunities
4. **Smart Recommendations**: AI analyzes all available jobs regardless of source
5. **Unified Experience**: View internal and external jobs in one place

### 9. Testing

To test the AI matching with external jobs:

1. Navigate to `/dashboard/ai-matches`
2. The system will automatically fetch both internal and external jobs
3. Check the console logs for:
   ```
   AI Matching: Found X internal jobs and Y external jobs
   ```
4. Verify that matched jobs include both internal and external sources

### 10. Troubleshooting

**No external jobs showing?**
- Check that `src/lib/job-scrapers.ts` is returning mock data
- Verify the `useExternalJobs` hook is working
- Check browser console for errors

**API errors?**
- Ensure `NEXT_PUBLIC_APP_URL` environment variable is set correctly
- Check that the external jobs API endpoint (`/api/jobs/external`) is accessible
- Review server logs for detailed error messages

## Summary

The AI matching system now provides comprehensive job recommendations by combining:
- ✅ Internal platform jobs
- ✅ LinkedIn jobs  
- ✅ Naukri.com jobs

All jobs are analyzed by the AI to find the best matches based on skills, experience, location, and career fit.

