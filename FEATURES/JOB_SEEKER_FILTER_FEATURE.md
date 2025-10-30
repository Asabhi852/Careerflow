# Job-Seeker Filter Feature

## Overview

Updated the find-candidates page (`/candidates`) to display only users who are registered as **job-seekers**, filtering out recruiters and other user types.

## ✅ Implementation Complete

### What Was Done

**1. Updated Candidates Page** (`src/app/candidates/page.tsx`)
- Added Firebase `where` clause to filter by `userType === 'job_seeker'`
- Updated query to fetch only job-seeker profiles from `public_profiles` collection
- Updated page description to clarify it shows job-seeker profiles
- Updated empty state message for better clarity

**2. Key Changes**
- **Query Filter**: Added `where('userType', '==', 'job_seeker')` to Firestore query
- **Description**: Changed from "Browse profiles" to "Browse job-seeker profiles"
- **Empty State**: Changed from "No candidates found" to "No job-seekers found"

## 🎯 Features

### Database Query
```typescript
const profilesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Query only users who are registered as job-seekers
    return query(
        collection(firestore, 'public_profiles'),
        where('userType', '==', 'job_seeker'),
        limit(100)
    );
}, [firestore]);
```

### User Type Field
From `src/lib/types.ts`:
```typescript
export type UserProfile = {
    // ... other fields
    userType?: 'job_seeker' | 'recruiter';
    // ... other fields
}
```

### Filter Behavior
- ✅ Shows only users with `userType === 'job_seeker'`
- ✅ Excludes recruiters (`userType === 'recruiter'`)
- ✅ Excludes users without a `userType` field
- ✅ Maintains all existing search/filter functionality
- ✅ Limit of 100 job-seeker profiles

## 📂 Files Modified

### `src/app/candidates/page.tsx`

**Changes:**
1. Added `where` import from `firebase/firestore`
2. Updated Firestore query with `where('userType', '==', 'job_seeker')`
3. Updated hero section description
4. Updated empty state message

**Before:**
```typescript
return query(collection(firestore, 'public_profiles'), limit(100));
```

**After:**
```typescript
return query(
    collection(firestore, 'public_profiles'),
    where('userType', '==', 'job_seeker'),
    limit(100)
);
```

## 🔧 How It Works

### Data Flow

1. **User visits `/candidates` page**
2. **Firestore query executes:**
   - Fetches from `public_profiles` collection
   - Filters where `userType === 'job_seeker'`
   - Limits to 100 results
3. **Client-side filtering applies:**
   - Search term (name, skills, bio)
   - Location
   - Skills
   - Age range
   - Availability
   - Interests
4. **Results displayed in grid layout**

### User Type Assignment

Users set their `userType` during signup:
- **Job Seeker**: Looking for employment opportunities
- **Recruiter**: Looking to hire candidates

The signup form should include this field selection.

## 🚀 Testing

### Test Scenarios

1. **View Job-Seekers**
   - Visit `/candidates` page
   - Verify only job-seeker profiles appear
   - Check that recruiters are not shown

2. **Search Functionality**
   - Use search filters
   - Verify filtering works correctly
   - Confirm only job-seekers in results

3. **Empty State**
   - If no job-seekers exist, verify empty state message
   - Message should say "No job-seekers found"

### Manual Testing Steps

```bash
# Start dev server
npm run dev

# Visit http://localhost:9002/candidates
# 1. Verify page shows "Browse job-seeker profiles"
# 2. Check that only job-seeker profiles appear
# 3. Test search and filter functionality
# 4. Verify candidate count is accurate
```

## 📊 Database Requirements

### Firestore Index

For optimal performance, create a composite index:

**Collection**: `public_profiles`
**Fields**:
- `userType` (Ascending)
- Any other fields used in queries

### Firebase Console
```
Collection: public_profiles
Indexes:
  - userType (Ascending)
```

### User Profile Data

Ensure all user profiles have the `userType` field set:
```typescript
{
  id: "user123",
  firstName: "John",
  lastName: "Doe",
  userType: "job_seeker", // Required for filtering
  // ... other fields
}
```

## 🔒 Security Considerations

### Firebase Security Rules

Ensure your Firestore rules allow reading job-seeker profiles:

```javascript
match /public_profiles/{profileId} {
  // Allow anyone to read job-seeker profiles
  allow read: if resource.data.userType == 'job_seeker';
  
  // Only allow users to write their own profile
  allow write: if request.auth != null 
    && request.auth.uid == profileId;
}
```

## 💡 Future Enhancements

- [ ] Add toggle to view recruiters vs job-seekers
- [ ] Show user type badge on profile cards
- [ ] Add statistics (X job-seekers, Y recruiters)
- [ ] Filter by experience level
- [ ] Filter by years of experience
- [ ] Sort by profile completeness
- [ ] Featured job-seekers section
- [ ] Recently joined job-seekers
- [ ] Most viewed profiles

## 📝 Important Notes

### User Type Assignment

**During Signup:**
- Users should select their account type
- Options: "Job Seeker" or "Recruiter"
- This sets the `userType` field in their profile

**Default Behavior:**
- If `userType` is not set, user won't appear in candidates list
- Existing users without `userType` need to update their profiles

### Data Migration

If you have existing users without `userType`:

```typescript
// Migration script example
const updateExistingUsers = async () => {
  const usersRef = collection(firestore, 'public_profiles');
  const snapshot = await getDocs(usersRef);
  
  snapshot.forEach(async (doc) => {
    if (!doc.data().userType) {
      // Set default to job_seeker or prompt user
      await updateDoc(doc.ref, {
        userType: 'job_seeker'
      });
    }
  });
};
```

## 🔗 Related Files

- `src/app/candidates/page.tsx` - Find candidates page (MODIFIED)
- `src/lib/types.ts` - TypeScript types (UserProfile type)
- `src/components/candidates/candidate-search.tsx` - Search component
- `src/components/auth/signup-form.tsx` - Signup form (should set userType)
- `src/app/candidates/[id]/page.tsx` - Candidate detail page

## 📈 Benefits

1. **Better User Experience**: Recruiters see only relevant profiles
2. **Clearer Purpose**: Page clearly shows it's for finding job-seekers
3. **Improved Performance**: Smaller result set with filtering
4. **Data Accuracy**: Only shows users actively seeking jobs
5. **Scalability**: Query optimization with indexed field

---

**Status**: ✅ Implementation Complete

The find-candidates page now shows only users registered as job-seekers!
