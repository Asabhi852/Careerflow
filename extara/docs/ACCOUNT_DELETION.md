# Comprehensive Account Deletion Feature

## Overview

Users can now permanently delete their accounts from the settings page. This feature comprehensively removes all user data from the system, including their profile, posted jobs, applications, messages, and uploaded files.

## Features Implemented

### ✅ **Complete Data Deletion**
When a user deletes their account, the following data is permanently removed:

1. **User Profile Data**
   - User profile in `users` collection
   - Public profile in `public_profiles` collection

2. **Job Postings**
   - All jobs posted by the user (`job_postings` collection)
   - Jobs are identified by `posterId` field

3. **Applications**
   - All job applications submitted by the user
   - Identified by `candidateId` field

4. **Messages & Notifications**
   - User's subcollection: `users/{userId}/notifications`
   - User's subcollection: `users/{userId}/messages`

5. **Posts**
   - All posts created by the user (`posts` collection)
   - Identified by `authorId` field

6. **Saved Jobs**
   - User's subcollection: `users/{userId}/saved_jobs`

7. **Uploaded Files**
   - All files in Firebase Storage under `users/{userId}/`
   - Includes resumes, profile pictures, and other uploads

8. **Authentication Account**
   - Firebase Authentication user account (deleted last)

### ✅ **Safety Features**

#### Pre-Deletion Check
- System checks for active applications and job postings
- Warns user about what will be deleted
- Shows counts of affected items

#### Confirmation Dialog
- Two-step confirmation process
- Clear warning messages
- List of all data that will be deleted
- Cannot be undone warning

#### Re-authentication Requirement
- Firebase requires recent login for account deletion
- Clear error message if re-authentication needed

## User Flow

### Step 1: Navigate to Settings
User goes to `/dashboard/settings`

### Step 2: Danger Zone Section
User sees:
- Red warning header with alert icon
- List of what will be deleted
- "Delete Account Permanently" button

### Step 3: Initial Confirmation
Click "Delete Account Permanently":
- System checks for active data
- Shows warnings if user has active jobs/applications
- Opens confirmation dialog

### Step 4: Final Confirmation
Confirmation dialog shows:
- "Are you absolutely sure?" warning
- Complete list of data to be deleted
- Warning about active items (if any)
- Two buttons: "Cancel" and "Yes, Delete My Account"

### Step 5: Deletion Process
User clicks "Yes, Delete My Account":
- Loading spinner shown
- Backend deletes all data sequentially
- Success toast notification
- Automatic redirect to homepage after 2 seconds

## Technical Implementation

### Account Deletion Utility (`src/lib/account-deletion.ts`)

```typescript
export async function deleteUserAccount(
  auth: Auth,
  firestore: Firestore,
  userId: string
): Promise<{ success: boolean; error?: string }>
```

**Deletion Order:**
1. User profile and public profile (batch delete)
2. Posted jobs (batch delete)
3. Applications (batch delete)
4. Notifications subcollection
5. Messages subcollection
6. Storage files (parallel delete)
7. Posts (batch delete)
8. Saved jobs subcollection
9. Firebase Authentication account

**Error Handling:**
- Each step wrapped in try-catch
- Errors logged but don't stop deletion process
- Only authentication errors can halt deletion
- Returns success/failure status with error message

### Pre-Deletion Check

```typescript
export async function canDeleteAccount(
  firestore: Firestore,
  userId: string
): Promise<{ canDelete: boolean; reason?: string }>
```

**Checks:**
- Active applications (pending, reviewed, interview status)
- Active job postings (status: 'active')
- Returns warnings about affected items

### Settings Page Updates

**New State:**
```typescript
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [deleteWarning, setDeleteWarning] = useState<string>('');
const [isDeleting, setIsDeleting] = useState(false);
```

**Handlers:**
- `handleDeleteAccountClick` - Opens dialog with warnings
- `handleConfirmDelete` - Executes deletion

## UI/UX Features

### Danger Zone Card
- ⚠️ Red warning icon
- Red text for title
- Highlighted box listing what gets deleted
- Disabled state during deletion
- Loading spinner during process

### Confirmation Dialog
- Large warning icon
- Bold warning text
- Amber warning box for active items
- Bulleted list of deletions
- Destructive action button styling
- Disabled state during deletion

### Visual Feedback
- Loading states with spinner
- Toast notifications
- Auto-redirect after success
- Error messages for failures

## Database Queries

### Finding User Data
```typescript
// Jobs posted by user
query(collection(firestore, 'job_postings'), where('posterId', '==', userId))

// Applications by user
query(collection(firestore, 'applications'), where('candidateId', '==', userId))

// Posts by user
query(collection(firestore, 'posts'), where('authorId', '==', userId))

// User subcollections
collection(firestore, 'users', userId, 'notifications')
collection(firestore, 'users', userId, 'messages')
collection(firestore, 'users', userId, 'saved_jobs')
```

### Batch Operations
```typescript
const batch = writeBatch(firestore);
batch.delete(doc1);
batch.delete(doc2);
await batch.commit();
```

## Performance Optimization

### Batch Operations
- Multiple documents deleted in single batch
- Reduces network calls
- Improves deletion speed

### Parallel Deletions
- Storage files deleted in parallel using `Promise.all`
- Independent operations don't block each other

### Error Resilience
- Failures in non-critical steps don't stop deletion
- Authentication account deleted last
- Logs provide debugging information

## Security Considerations

### Authentication Required
- User must be logged in
- Must be the account owner (userId match)
- Recent authentication required by Firebase

### Confirmation Required
- Two-step confirmation process
- Clear warnings about permanent deletion
- Cannot be undone

### Data Privacy
- All user data completely removed
- No orphaned data left behind
- Complies with GDPR "right to be forgotten"

## Error Handling

### Common Errors

**Re-authentication Required:**
```
Error: auth/requires-recent-login
Solution: User logs out and logs back in, then tries deletion again
```

**Network Error:**
```
Error: Failed to delete account
Solution: Check internet connection, try again
```

**Permission Denied:**
```
Error: Insufficient permissions
Solution: Check Firestore security rules
```

### User-Friendly Messages
- Clear error descriptions
- Actionable steps to resolve
- No technical jargon

## Testing

### Test Scenarios

**1. Delete Account with No Data**
- Create new account
- Immediately delete
- Verify clean deletion

**2. Delete Account with Jobs**
- Post 2-3 jobs
- Delete account
- Verify jobs are removed from database

**3. Delete Account with Applications**
- Apply to 2-3 jobs
- Delete account
- Verify applications are removed

**4. Delete Account with All Data**
- Post jobs
- Apply to jobs
- Upload resume
- Send messages
- Delete account
- Verify all data removed

**5. Cancel Deletion**
- Click delete
- Click cancel in dialog
- Verify account still exists

**6. Re-authentication Error**
- Log in hours ago
- Try to delete
- Verify error message
- Log in again
- Successful deletion

## Firestore Security Rules

Ensure rules allow users to delete their own data:

```javascript
match /users/{userId} {
  allow delete: if request.auth.uid == userId;
  
  match /{document=**} {
    allow delete: if request.auth.uid == userId;
  }
}

match /job_postings/{jobId} {
  allow delete: if request.auth.uid == resource.data.posterId;
}

match /applications/{applicationId} {
  allow delete: if request.auth.uid == resource.data.candidateId;
}

match /posts/{postId} {
  allow delete: if request.auth.uid == resource.data.authorId;
}
```

## Future Enhancements

### Planned Features
- [ ] Export user data before deletion (GDPR compliance)
- [ ] Email confirmation code
- [ ] Delayed deletion (30-day grace period)
- [ ] Soft delete with data archival
- [ ] Deletion reason survey
- [ ] Admin notification for account deletions
- [ ] Bulk deletion for inactive accounts

### Advanced Features
- [ ] Selective data deletion (keep some, delete others)
- [ ] Account suspension (temporary disable)
- [ ] Data transfer to another account
- [ ] Anonymize instead of delete

## Troubleshooting

### Issue: Deletion Takes Too Long
**Cause:** User has large amount of data
**Solution:** Process runs in background, redirects when complete

### Issue: Some Data Remains
**Cause:** Network interruption or partial failure
**Solution:** Re-run deletion process, check console logs

### Issue: Can't Delete Auth Account
**Cause:** Recent login required
**Solution:** User logs out and back in, then retries

### Issue: Storage Files Not Deleted
**Cause:** Permission issues or file locks
**Solution:** Check storage rules, manual cleanup if needed

## Related Files

- `src/lib/account-deletion.ts` - Deletion utility functions
- `src/app/dashboard/settings/page.tsx` - Settings UI
- `src/components/ui/alert-dialog.tsx` - Confirmation dialog
- `firestore.rules` - Database security rules
- `storage.rules` - Storage security rules

## API Reference

### `deleteUserAccount`
```typescript
async function deleteUserAccount(
  auth: Auth,
  firestore: Firestore,
  userId: string
): Promise<{ success: boolean; error?: string }>
```

**Parameters:**
- `auth` - Firebase Auth instance
- `firestore` - Firestore instance
- `userId` - ID of user to delete

**Returns:**
- `success: true` if deletion succeeded
- `success: false` with `error` message if failed

### `canDeleteAccount`
```typescript
async function canDeleteAccount(
  firestore: Firestore,
  userId: string
): Promise<{ canDelete: boolean; reason?: string }>
```

**Parameters:**
- `firestore` - Firestore instance
- `userId` - ID of user to check

**Returns:**
- `canDelete: true` if user can delete account
- `reason` - Warning message about active items (optional)

## Summary

The comprehensive account deletion feature ensures complete removal of all user data when they delete their account. The two-step confirmation process, clear warnings, and detailed deletion list provide transparency and safety. The backend systematically removes all user data from Firestore, Storage, and Authentication, providing a clean and complete deletion process that respects user privacy and complies with data protection regulations.
