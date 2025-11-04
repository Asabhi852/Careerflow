# Enhanced Job Posting Feature

## Overview
The job posting feature has been enhanced to require comprehensive organization details from users who post jobs. This provides candidates with complete information about the organization offering the position, whether it's a company, school, college, non-profit, or other type of organization.

## Key Features

### Organization Types Supported
- **Company / Business** - Corporate entities and businesses
- **Startup** - Early-stage companies
- **School** - K-12 educational institutions
- **College / University** - Higher education institutions
- **Non-Profit Organization** - NGOs and charitable organizations
- **Government Agency** - Government departments and agencies
- **Healthcare Facility** - Hospitals, clinics, and healthcare providers
- **Other** - Any other type of organization

### Required Organization Information

#### Essential Details (Required)
1. **Organization Type** - Select from the predefined types
2. **Organization Name** - Full legal or operating name
3. **Organization Description** - Minimum 20 characters describing the organization, its mission, and what makes it unique

#### Optional Details
1. **Industry / Field** - The primary industry or field of operation
2. **Website** - Organization's official website (must be a valid URL)
3. **Contact Email** - Primary contact email for the organization
4. **Phone Number** - Contact phone number
5. **Address** - Physical address of the organization
6. **Organization Size** - Number of employees:
   - 1-10 employees
   - 11-50 employees
   - 51-200 employees
   - 201-500 employees
   - 501-1000 employees
   - 1000+ employees
7. **Founded Year** - Year the organization was established

#### School/College Specific Fields
When the organization type is **School** or **College**, additional fields appear:

1. **Accreditation** - Accreditation details (Regional, National, or specific accrediting body)
2. **Programs Offered** - List of main programs, degrees, or courses offered

## User Interface

### Post Job Page (`/dashboard/post-job`)
The job posting form is divided into two main sections:

#### 1. Organization Information Card
- Displays all organization-related fields
- Conditional rendering of school/college specific fields
- Validation for URLs and email addresses
- Comprehensive input fields with helpful placeholders

#### 2. Job Details Card
- Job title, location, and salary
- Employment type (Full-time, Part-time, Contract, Internship)
- Experience level (Entry, Mid, Senior, Lead/Principal)
- Job category and description
- Required skills (comma-separated)
- Benefits (one per line)

### Create Job Dialog Component
- Compact dialog version with scrollable content
- Same organization details as the full page
- Optimized for quick job posting
- Maximum height of 90vh with vertical scrolling

### Job Card Display
Job cards now show:
- Organization name (falls back to company name for backward compatibility)
- Organization type displayed in parentheses
- All other existing job information

## Data Structure

### Firestore Collection: `jobs`
```javascript
{
  // Job Identification
  id: string,
  posterId: string,
  status: 'active' | 'closed' | 'draft',
  postedAt: string (ISO timestamp),
  
  // Organization Details
  organizationType: 'company' | 'startup' | 'school' | 'college' | 'nonprofit' | 'government' | 'healthcare' | 'other',
  organizationName: string,
  organizationDescription: string,
  organizationWebsite?: string,
  organizationEmail?: string,
  organizationPhone?: string,
  organizationAddress?: string,
  industry?: string,
  organizationSize?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+',
  foundedYear?: number,
  
  // School/College Specific
  accreditation?: string,
  programsOffered?: string,
  
  // Job Details
  title: string,
  description: string,
  location: string,
  salary?: number,
  applicationUrl?: string, // Direct URL to apply on company website
  category?: string,
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship',
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead',
  skills?: string[],
  benefits?: string[],
  
  // Backward Compatibility
  company: string // Maps to organizationName or is kept for legacy data
}
```

## Validation Rules

### Form Validation (Zod Schema)
- **Title**: Minimum 3 characters
- **Organization Type**: Required, must be selected
- **Organization Name**: Minimum 2 characters
- **Organization Description**: Minimum 20 characters
- **Website**: Must be a valid URL (if provided)
- **Email**: Must be a valid email address (if provided)
- **Location**: Minimum 2 characters
- **Job Description**: Minimum 50 characters

### Firestore Security Rules
```javascript
// Jobs collection - Public read, authenticated write
match /jobs/{jobId} {
  allow read: if true; // Anyone can read jobs
  allow create: if request.auth != null; // Authenticated users can create
  allow update, delete: if request.auth != null && request.auth.uid == resource.data.posterId; // Only poster can update/delete
}
```

## Technical Implementation

### Files Modified
1. **`src/app/dashboard/post-job/page.tsx`**
   - Enhanced form schema with organization fields
   - Added organization type watcher for conditional rendering
   - Implemented two-card layout (Organization Info + Job Details)

2. **`src/components/jobs/create-job-dialog.tsx`**
   - Updated dialog with comprehensive organization details
   - Added scrollable content area
   - Implemented compact two-section layout

3. **`src/components/jobs/job-card.tsx`**
   - Updated to display organization name and type
   - Backward compatible with existing job posts

4. **`src/lib/types.ts`**
   - Extended `JobPosting` type with organization fields
   - Maintained backward compatibility with `company` field

5. **`firestore.rules`**
   - Added security rules for `jobs` collection

## Usage

### Posting a Job
1. Navigate to `/dashboard/post-job`
2. Fill in **Organization Information**:
   - Select organization type
   - Provide organization name and description
   - Add optional details (website, contact info, size, etc.)
   - For schools/colleges, add accreditation and programs
3. Fill in **Job Details**:
   - Job title, location, salary
   - Application URL (optional) - External link for applications
   - Employment type and experience level
   - Job description and required skills
   - Benefits (optional)
4. Click "Post Job" to publish

## External Application Links

### Application URL Feature
The platform now supports **external application URLs**, allowing organizations to direct candidates to their own application systems.

#### How It Works
1. **When posting a job**, you can optionally provide an **Application URL**
2. **If provided**, the job detail page displays an **"Apply on Website"** button
3. **Clicking the button** opens the URL in a new tab (with proper security attributes)
4. **If not provided**, the standard internal "Apply Now" button is shown

#### Benefits
- **For Organizations**: Direct candidates to your ATS (Applicant Tracking System)
- **For Companies**: Use your existing career portal
- **For Schools/Colleges**: Link to institutional hiring pages
- **Flexibility**: Support both internal and external application flows

#### Job Card Behavior
- Jobs with **applicationUrl** show split buttons:
  - "View Details" (outline) - See full job description
  - "Apply" (primary) - Direct link to application page with external link icon
- Jobs **without applicationUrl** show single "View Details" button

#### Example URLs
- Company career pages: `https://yourcompany.com/careers/apply/job-id`
- ATS systems: `https://apply.workable.com/company/j/ABC123/`
- School portals: `https://school.edu/employment/apply`
- Job boards: `https://jobs.university.edu/position-123`

### Viewing Job Postings
- Job cards display organization name and type
- Detailed job pages show full organization information
- Candidates can learn about the organization before applying

## Backward Compatibility
- Existing job posts without organization details will display the `company` field
- The `company` field is maintained for backward compatibility
- New posts populate both `organizationName` and `company` fields

## Future Enhancements
1. Organization profile pages with job listings
2. Organization verification badges
3. Rich media support (logos, photos, videos)
4. Organization ratings and reviews
5. Advanced filtering by organization type and size
6. Organization follow/bookmark functionality
7. Email notifications for organization-specific job alerts

## Benefits

### For Job Seekers
- Complete transparency about the hiring organization
- Better informed decision-making
- Understanding of organization type and size
- Direct contact information available
- Industry and field information for better matches

### For Job Posters
- Professional presentation of their organization
- Attract quality candidates with comprehensive information
- Build trust with detailed organization profiles
- Stand out from other job postings
- Support for various organization types beyond just companies

## Testing
To test the enhanced job posting feature:

1. **Create a Company Job Post**:
   - Select "Company / Business" as type
   - Fill all required fields
   - Verify the job displays correctly on job listings

2. **Create a School/College Job Post**:
   - Select "School" or "College" as type
   - Verify that accreditation and programs fields appear
   - Fill additional fields and post
   - Check that special fields are saved and displayed

3. **Test Validation**:
   - Try submitting without organization type (should fail)
   - Try submitting with invalid URL/email (should fail)
   - Verify all minimum length requirements

4. **Test Backward Compatibility**:
   - View existing job posts without organization details
   - Verify they still display correctly using company field

## Deployment Notes
- Run Firestore rules deployment: `npm run deploy:firestore-rules` (if available) or deploy via Firebase Console
- No database migration needed (optional fields)
- Existing data remains functional
- TypeScript compilation required for type updates
