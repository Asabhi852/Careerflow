# Resume-Based Job Matching Feature

## Overview

The Resume Job Matching feature allows users to upload their resume and get AI-powered job recommendations **exclusively from your internal job database**. The system analyzes the resume, extracts relevant information, and matches candidates with jobs stored in your Firestore `jobs` collection.

## Key Features

### ✅ **Internal Database Only**
- Jobs are sourced **ONLY** from your Firestore `jobs` collection
- No external job boards are queried for this feature
- Ensures you're matching candidates with your actual available positions

### ✅ **AI-Powered Resume Parsing**
- Extracts personal information (name, email, location, age)
- Identifies technical and soft skills
- Parses work experience with dates and descriptions
- Analyzes education background
- Determines availability and salary expectations

### ✅ **Intelligent Matching Algorithm**
- **Skills Matching (25 points)**: Exact, partial, and semantic skill matching
- **Experience Matching (20 points)**: Years of experience vs job requirements
- **Location Matching (15 points)**: Geographic proximity scoring
- **Salary Matching (10 points)**: Expected vs offered salary alignment
- **Education Matching (10 points)**: Degree relevance
- **Availability (5 points)**: Current job-seeking status
- **Personality Fit (10 points)**: Interest alignment
- **Career Progression (5 points)**: Growth potential
- **Cultural Fit (5 points)**: Value alignment

### ✅ **Comprehensive Results**
- Match score (0-100%) for each job
- Match quality rating (excellent, good, fair, poor)
- Specific reasons why jobs match
- Skill gaps identification
- Personalized career advice
- Learning resources for missing skills

## Architecture

### API Endpoint
```
POST /api/ai/resume-job-match
```

**Request Body:**
```json
{
  "resumeText": "string (extracted text from resume)",
  "userPreferences": {
    "location": "string (optional)",
    "maxDistance": "number (optional, default: 100km)",
    "sortByDistance": "boolean (optional, default: false)",
    "limit": "number (optional, default: 20)",
    "minScore": "number (optional, default: 30)"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "parsedResume": { /* Structured resume data */ },
    "userProfile": {
      "name": "John Doe",
      "currentRole": "Software Engineer",
      "location": "San Francisco, CA",
      "skills": ["JavaScript", "React", "Node.js"],
      "experience": 3
    },
    "jobMatches": [
      {
        "jobId": "job123",
        "score": 87,
        "matchQuality": "excellent",
        "matchedSkills": ["JavaScript", "React"],
        "reasons": ["Strong skills match", "Relevant experience"],
        "job": { /* Full job details */ },
        "compatibilityFactors": {
          "skills": 22,
          "experience": 18,
          "location": 15,
          /* ... other factors */
        },
        "skillGaps": [ /* Missing skills */ ],
        "careerAdvice": "Personalized advice"
      }
    ],
    "totalJobs": 45,
    "totalMatches": 12,
    "summaryForRecruiters": "Candidate summary...",
    "skillGaps": [ /* Overall skill gaps */ ],
    "careerAdvice": "Career guidance...",
    "matchingStats": {
      "excellent": 3,
      "good": 5,
      "fair": 4,
      "averageScore": 72
    }
  }
}
```

## Usage

### 1. Using the React Hook

```typescript
import { useResumeJobMatching } from '@/hooks/use-resume-job-matching';

function MyComponent() {
  const { matchResume, isLoading, data, error } = useResumeJobMatching({
    onSuccess: (result) => {
      console.log(`Found ${result.totalMatches} jobs!`);
    },
    onError: (err) => {
      console.error('Matching failed:', err);
    }
  });

  const handleUpload = async (file: File) => {
    await matchResume(file, {
      limit: 50,
      minScore: 40,
      maxDistance: 50
    });
  };

  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

### 2. Using the Pre-Built Component

```typescript
import { ResumeJobMatcher } from '@/components/ai-matches/resume-job-matcher';

export default function Page() {
  return <ResumeJobMatcher />;
}
```

### 3. Direct Page Access

Navigate to: `/dashboard/resume-matcher`

## File Support

- **PDF** (.pdf)
- **Word Document** (.docx)
- **Plain Text** (.txt)
- **Maximum Size**: 5MB

## Match Quality Levels

| Score | Quality | Description |
|-------|---------|-------------|
| 80-100 | Excellent | Perfect fit, highly recommended |
| 60-79 | Good | Strong match with minor gaps |
| 40-59 | Fair | Moderate fit, some development needed |
| 0-39 | Poor | Significant gaps, not recommended |

## How It Works

1. **Upload Resume**
   - User uploads PDF/DOCX/TXT file
   - System extracts text from the document

2. **AI Parsing**
   - Resume text sent to AI parser
   - Extracts structured data (skills, experience, education)
   - Creates temporary user profile

3. **Job Retrieval**
   - Fetches ALL jobs from Firestore `jobs` collection
   - No external APIs called
   - Uses internal database exclusively

4. **AI Matching**
   - Runs enhanced matching algorithm
   - Calculates 9 compatibility factors
   - Generates match score for each job

5. **Results Display**
   - Shows matched jobs sorted by score
   - Displays match reasons and skill alignment
   - Provides career advice and skill gaps

## Database Requirements

### Firestore Collection: `jobs`

Ensure your `jobs` collection has documents with this structure:

```typescript
{
  id: string;
  title: string;              // Required
  company: string;            // Required
  location: string;           // Required
  description: string;        // Required
  skills: string[];           // Required for matching
  salary: number;             // Optional
  employmentType: string;     // Full-time, Part-time, etc.
  experienceLevel: string;    // Entry, Mid, Senior
  coordinates: {              // Optional, for location matching
    latitude: number;
    longitude: number;
  };
  postedDate: string;
  status: 'active' | 'closed';
}
```

## Benefits

### For Job Seekers
- ✅ Quick job matching without manual searching
- ✅ AI-powered skill gap analysis
- ✅ Personalized career advice
- ✅ Learning resources for skill development
- ✅ Match quality transparency

### For Recruiters
- ✅ Candidate summaries optimized for hiring
- ✅ Skill overlap visibility
- ✅ Experience level matching
- ✅ Location-based filtering
- ✅ Cultural fit indicators

### For Platform Owners
- ✅ Engages users with your internal job database
- ✅ No dependency on external job boards
- ✅ Full control over job quality
- ✅ Data privacy (resume data stays in your system)
- ✅ Customizable matching algorithm

## Configuration

### Environment Variables

No additional environment variables needed! The feature uses your existing Firestore configuration.

### Customization

To adjust matching weights, edit:
```
src/lib/ai-matching-algorithm.ts
```

To modify the UI:
```
src/components/ai-matches/resume-job-matcher.tsx
```

## Testing

1. **Add test jobs to Firestore**
```bash
# Use Firebase Console or add via your app
```

2. **Upload a test resume**
```
- Go to /dashboard/resume-matcher
- Upload a sample resume
- Verify matches appear
```

3. **Check match scores**
```
- Verify scores align with expectations
- Test with various skill combinations
- Validate location matching
```

## Troubleshooting

### No Jobs Found
- **Issue**: `totalJobs: 0` in response
- **Solution**: Add jobs to Firestore `jobs` collection

### No Matches Found
- **Issue**: `totalMatches: 0` but jobs exist
- **Solution**: Lower `minScore` threshold or improve resume content

### Resume Parsing Fails
- **Issue**: "Could not extract text" error
- **Solution**: Ensure file is readable PDF/DOCX with selectable text

### Low Match Scores
- **Issue**: All scores below 40%
- **Solution**: Check if job `skills` field is populated correctly

## Future Enhancements

- [ ] Save resume analysis to user profile
- [ ] Compare multiple resumes
- [ ] Bulk job matching for recruiters
- [ ] Resume improvement suggestions
- [ ] Application tracking integration
- [ ] Email notifications for new matches
- [ ] Match history and analytics

## Related Files

- `src/app/api/ai/resume-job-match/route.ts` - API endpoint
- `src/hooks/use-resume-job-matching.ts` - React hook
- `src/components/ai-matches/resume-job-matcher.tsx` - UI component
- `src/app/dashboard/resume-matcher/page.tsx` - Page implementation
- `src/lib/ai-matching-algorithm.ts` - Matching algorithm
- `src/ai/flows/resume-parser.ts` - AI resume parser

## Support

For issues or questions:
1. Check console logs for errors
2. Verify Firestore jobs collection exists
3. Ensure AI services are configured
4. Review this documentation
