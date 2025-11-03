# Enhanced Job Application Notifications

## Overview

When a candidate applies for a job, the job owner receives a comprehensive notification that includes full candidate profile information. This allows recruiters to quickly review applicants without navigating away from the notifications page.

## Features Implemented

### ✅ **Comprehensive Application Notifications**

When a candidate applies for a job, the job owner receives:

1. **Notification Alert**
   - Title: "🎯 New Application Received!"
   - Includes job title and candidate name
   - Badge notification in header
   - Unread indicator

2. **Candidate Profile Information**
   - Full name
   - Current job title/role
   - Location
   - Email address
   - Phone number (if available)
   - Skills (top 5 with "more" indicator)
   - Resume link

3. **Quick Actions**
   - "View Profile" button - Direct link to candidate's public profile
   - "View Resume" link - Opens resume in new tab
   - Click notification to mark as read

### ✅ **Enhanced Notification Display**

**Candidate Profile Card:**
- Highlighted box with border
- Organized layout with icons
- Skill badges for quick scanning
- Direct action buttons

**Information Included:**
- 👤 **Name** - Full candidate name
- 💼 **Current Role** - Current job title
- 📍 **Location** - Candidate location
- 📧 **Email** - Contact email
- 📞 **Phone** - Contact number (if provided)
- 🎯 **Skills** - Top skills as badges
- 📄 **Resume** - Quick access link

## User Flow

### For Job Seekers (Applicants)

1. **Browse Jobs** - Find job on `/jobs` or `/jobs/{id}`
2. **Click Apply** - Submit application
3. **Confirmation** - Success toast notification
4. **Notification Sent** - Job owner notified automatically

### For Job Owners (Recruiters)

1. **Receive Notification** - Red badge appears in header bell icon
2. **View Notifications** - Navigate to `/dashboard/notifications`
3. **See Candidate Profile** - Full profile displayed in notification
4. **Quick Actions:**
   - Click "View Profile" → Go to candidate's profile page
   - Click "View Resume" → Open resume in new tab
   - Click notification → Navigate to appropriate page
5. **Auto-Read** - Notification marked as read after 2 seconds

## Technical Implementation

### Enhanced Notification Function

**File:** `src/lib/notifications.ts`

```typescript
export async function notifyNewCandidateApplication(
  firestore: Firestore,
  posterId: string,
  applicationData: {
    candidateId: string;
    candidateName: string;
    jobId: string;
    jobTitle: string;
    applicationId: string;
    candidateEmail?: string;
    candidatePhone?: string;
    candidateLocation?: string;
    candidateCurrentRole?: string;
    candidateSkills?: string[];
    candidateResumeUrl?: string;
  }
): Promise<void>
```

**Data Stored in Notification:**
```typescript
{
  candidateId: string,
  candidateName: string,
  candidateEmail: string,
  candidatePhone: string,
  candidateLocation: string,
  candidateCurrentRole: string,
  candidateSkills: string[],
  candidateResumeUrl: string,
  jobId: string,
  jobTitle: string,
  applicationId: string,
  applicationStatus: 'pending',
  viewProfileUrl: '/candidates/{candidateId}'
}
```

### Application Submission

**File:** `src/app/jobs/[id]/page.tsx`

**Profile Data Collection:**
```typescript
// Get applicant profile
const applicantProfileRef = doc(firestore, 'users', user.uid);
const applicantProfileSnap = await getDoc(applicantProfileRef);
const applicantProfile = applicantProfileSnap.data();

// Extract all relevant information
const applicantName = applicantProfile?.firstName + ' ' + applicantProfile?.lastName;
const applicantEmail = applicantProfile?.email || user.email;
const applicantPhone = applicantProfile?.phoneNumber || applicantProfile?.phone;
const applicantLocation = applicantProfile?.location;
const applicantCurrentRole = applicantProfile?.currentJobTitle;
const applicantSkills = applicantProfile?.skills || [];
const applicantResumeUrl = applicantProfile?.resumeUrl;
```

**Notification Trigger:**
```typescript
// Notify job owner with full profile
await notifyNewCandidateApplication(firestore, job.posterId, {
  candidateId: user.uid,
  candidateName: applicantName,
  candidateEmail: applicantEmail,
  candidatePhone: applicantPhone,
  candidateLocation: applicantLocation,
  candidateCurrentRole: applicantCurrentRole,
  candidateSkills: applicantSkills,
  candidateResumeUrl: applicantResumeUrl,
  jobId: job.id,
  jobTitle: job.title,
  applicationId: applicationDoc.id,
});
```

### Notification Display Enhancement

**File:** `src/app/dashboard/notifications/page.tsx`

**Enhanced Rendering:**
```typescript
const renderNotificationDetails = (notification: Notification) => {
  if (notification.type === 'application') {
    return (
      <div className="candidate-profile-card">
        {/* Profile Header with View Button */}
        <div className="header">
          <h4>Candidate Profile</h4>
          <Button onClick={() => router.push(data.viewProfileUrl)}>
            View Profile
          </Button>
        </div>
        
        {/* Candidate Information */}
        <div>{data.candidateName}</div>
        <div>{data.candidateCurrentRole}</div>
        <div>{data.candidateLocation}</div>
        <div>{data.candidateEmail}</div>
        
        {/* Skills as Badges */}
        <div className="skills">
          {data.candidateSkills.map(skill => (
            <Badge>{skill}</Badge>
          ))}
        </div>
        
        {/* Resume Link */}
        <Button onClick={() => window.open(data.candidateResumeUrl)}>
          View Resume
        </Button>
      </div>
    );
  }
};
```

## UI/UX Features

### Notification Card Styling

**Candidate Profile Section:**
```css
padding: 0.75rem
background: muted/50
border: border/50
border-radius: 0.5rem
spacing: 0.5rem between items
```

**View Profile Button:**
```css
size: small (h-7)
variant: outline
text: extra small
icon: UserCheck
```

**Skill Badges:**
```css
variant: secondary
size: extra small
max display: 5 skills
overflow: "+N more" badge
```

**Resume Link:**
```css
variant: link
size: small
color: primary
icon: FileText
opens in new tab
```

### Visual Hierarchy

1. **Title** - Bold, prominent "🎯 New Application Received!"
2. **Message** - Candidate name + job title + role/location
3. **Profile Card** - Highlighted box with all details
4. **Actions** - Primary action buttons
5. **Status Badge** - Application status indicator

## Data Flow

### Application Submission Flow

```
1. User clicks "Apply"
   ↓
2. Create application document
   ↓
3. Fetch user profile from Firestore
   ↓
4. Extract all profile information
   ↓
5. Send notification to applicant (success)
   ↓
6. Send notification to job owner (with profile)
   ↓
7. Job owner sees notification with badge
   ↓
8. Job owner views full profile in notification
   ↓
9. Job owner clicks "View Profile" or "View Resume"
```

### Notification Data Structure

```typescript
{
  id: string,
  userId: string, // Job owner ID
  title: string,
  message: string,
  type: 'application',
  read: boolean,
  timestamp: Timestamp,
  data: {
    // Application Info
    applicationId: string,
    applicationStatus: string,
    jobId: string,
    jobTitle: string,
    
    // Candidate Profile
    candidateId: string,
    candidateName: string,
    candidateEmail: string,
    candidatePhone: string,
    candidateLocation: string,
    candidateCurrentRole: string,
    candidateSkills: string[],
    candidateResumeUrl: string,
    viewProfileUrl: string
  }
}
```

## Benefits

### For Recruiters/Job Owners

- ✅ **Instant Access** - See candidate info immediately
- ✅ **No Navigation** - Review profile without leaving notifications
- ✅ **Quick Decisions** - All info in one place
- ✅ **Direct Contact** - Email and phone readily available
- ✅ **Skill Matching** - See relevant skills at a glance
- ✅ **Resume Access** - One click to view full resume
- ✅ **Profile Link** - Easy navigation to full profile

### For Candidates

- ✅ **Better Visibility** - Profile showcased to recruiters
- ✅ **Quick Response** - Recruiters can act faster
- ✅ **Professional** - Complete profile presentation
- ✅ **Confirmation** - Success notification upon application

### For Platform

- ✅ **Engagement** - Encourages recruiter interaction
- ✅ **Efficiency** - Streamlined hiring process
- ✅ **Professional** - Modern recruitment experience
- ✅ **Value Add** - Differentiates from competitors

## Examples

### Example Notification

**Title:** 🎯 New Application Received!

**Message:** John Doe applied for Senior Software Engineer • Current Role: Full Stack Developer • Location: San Francisco, CA

**Candidate Profile Card:**
```
┌─────────────────────────────────────┐
│ Candidate Profile    [View Profile] │
├─────────────────────────────────────┤
│ 👤 John Doe                         │
│ 💼 Full Stack Developer             │
│ 📍 San Francisco, CA                │
│ 📧 john.doe@email.com               │
│                                     │
│ [JavaScript] [React] [Node.js]      │
│ [Python] [AWS] +3 more              │
│                                     │
│ [View Resume]                       │
└─────────────────────────────────────┘
```

## Testing

### Test Scenarios

**1. Apply to Job with Complete Profile**
- Create profile with all fields filled
- Apply to a job
- Check job owner notifications
- Verify all profile info displayed

**2. Apply with Minimal Profile**
- Create profile with only required fields
- Apply to a job
- Check notification shows available info
- Verify no errors for missing fields

**3. View Profile from Notification**
- Apply to job
- Job owner clicks "View Profile"
- Verify navigates to candidate profile page
- Verify profile displays correctly

**4. View Resume from Notification**
- Upload resume to profile
- Apply to job
- Job owner clicks "View Resume"
- Verify resume opens in new tab

**5. Multiple Applications**
- Apply to 3 different jobs
- Check each job owner receives notification
- Verify each has correct candidate info

## Security & Privacy

### Data Access
- Only job owner receives notification
- Candidate profile data from Firestore rules
- Resume URLs protected by Firebase Storage rules

### Profile Visibility
- Public profile used for candidate information
- Private fields not included in notification
- Candidate controls what's public

### Notification Privacy
- Notifications only visible to recipient
- Marked as read after viewing
- Can be deleted by recipient

## Future Enhancements

### Planned Features
- [ ] Video introduction preview in notification
- [ ] AI-generated candidate summary
- [ ] Match score indicator
- [ ] Quick reply to candidate from notification
- [ ] Save candidate for future positions
- [ ] Schedule interview directly from notification

### Advanced Features
- [ ] Candidate comparison in notification
- [ ] Automatic skill matching highlights
- [ ] Social profile integration (LinkedIn)
- [ ] Reference check initiation
- [ ] Team member tagging for review
- [ ] Application notes/comments

## Troubleshooting

### Issue: Profile Information Missing
**Cause:** Candidate hasn't completed profile
**Solution:** System shows available information, prompts candidate to complete profile

### Issue: Resume Link Not Working
**Cause:** Resume not uploaded or URL expired
**Solution:** Check Storage rules, re-upload resume

### Issue: Notification Not Received
**Cause:** Job poster ID missing or incorrect
**Solution:** Verify job has valid posterId field

### Issue: View Profile Button Not Working
**Cause:** Candidate profile doesn't exist
**Solution:** Ensure public profile created during signup

## Related Files

- `src/lib/notifications.ts` - Notification creation functions
- `src/app/jobs/[id]/page.tsx` - Application submission
- `src/app/dashboard/notifications/page.tsx` - Notification display
- `src/components/auth/signup-form.tsx` - Profile creation
- `src/lib/types.ts` - Type definitions

## API Reference

### Create Application Notification

```typescript
await notifyNewCandidateApplication(
  firestore,
  posterId,
  {
    candidateId,
    candidateName,
    candidateEmail,
    candidatePhone,
    candidateLocation,
    candidateCurrentRole,
    candidateSkills,
    candidateResumeUrl,
    jobId,
    jobTitle,
    applicationId
  }
);
```

### Mark Notification as Read

```typescript
await markNotificationAsRead(firestore, userId, notificationId);
```

### Navigate to Candidate Profile

```typescript
router.push(`/candidates/${candidateId}`);
```

## Summary

The enhanced job application notification system provides recruiters with comprehensive candidate information immediately upon application submission. By including full profile details, skills, contact information, and direct action buttons in the notification itself, recruiters can quickly evaluate candidates and take action without unnecessary navigation. This streamlined workflow improves hiring efficiency and provides a professional experience for both candidates and recruiters.
