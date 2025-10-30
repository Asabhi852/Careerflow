# Update Existing Users with userType Field

## Problem
If you have existing users in your database that were created before the `userType` field was added, they won't appear in the "Find Candidates" page because the query filters by `userType === 'job_seeker'`.

## Solution

You need to add the `userType` field to existing user profiles in Firestore.

### Option 1: Manual Update via Firebase Console

1. Go to Firebase Console → Firestore Database
2. Navigate to the `public_profiles` collection
3. For each document:
   - Click on the document
   - Click "Add field"
   - Field name: `userType`
   - Field value: `job_seeker` (for job seekers) or `recruiter` (for recruiters)
   - Click "Add"

4. Repeat for the `users` collection

### Option 2: Automated Script (Recommended)

Create a one-time migration script to update all existing users.

**File: `scripts/migrate-user-types.ts`**

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  // Add your config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateUserTypes() {
  console.log('Starting migration...');
  
  // Update public_profiles
  const publicProfilesRef = collection(db, 'public_profiles');
  const publicProfilesSnapshot = await getDocs(publicProfilesRef);
  
  let updated = 0;
  
  for (const docSnapshot of publicProfilesSnapshot.docs) {
    const data = docSnapshot.data();
    
    // Skip if userType already exists
    if (data.userType) {
      console.log(`Skipping ${docSnapshot.id} - already has userType`);
      continue;
    }
    
    // Default to job_seeker (you can change this logic)
    const userType = 'job_seeker';
    
    await updateDoc(doc(db, 'public_profiles', docSnapshot.id), {
      userType: userType
    });
    
    await updateDoc(doc(db, 'users', docSnapshot.id), {
      userType: userType
    });
    
    console.log(`Updated ${docSnapshot.id} with userType: ${userType}`);
    updated++;
  }
  
  console.log(`Migration complete! Updated ${updated} profiles.`);
}

migrateUserTypes().catch(console.error);
```

### Option 3: Update via Firestore Rules (Temporary Fix)

If you want all existing users to appear as job seekers temporarily, you can modify the query in `src/app/candidates/page.tsx`:

**Before:**
```typescript
return query(
  collection(firestore, 'public_profiles'),
  where('userType', '==', 'job_seeker'),
  limit(100)
);
```

**After (Temporary - shows all users):**
```typescript
return query(
  collection(firestore, 'public_profiles'),
  limit(100)
);
```

Then filter in the client-side code:
```typescript
const profiles = useMemo(() => {
  if (!allProfiles) return [];
  
  let filtered = allProfiles.filter(profile => {
    // Only show job seekers (or users without userType for backward compatibility)
    if (profile.userType && profile.userType !== 'job_seeker') {
      return false;
    }
    
    // ... rest of filters
  });
  
  // ... rest of code
}, [allProfiles, filters]);
```

## Recommended Approach

1. **For New Deployments**: No action needed - the signup form already sets `userType`

2. **For Existing Deployments with Users**:
   - Use Option 1 (Manual) if you have < 10 users
   - Use Option 2 (Script) if you have many users
   - Use Option 3 (Temporary) to show all users immediately while you migrate

## Verification

After updating:

1. Go to `/candidates`
2. You should see all job seeker profiles
3. Check the browser console for any errors
4. Verify the Firestore query is working

## Future Considerations

- Add a migration script to your deployment process
- Consider adding a default value in Firestore rules
- Add validation to ensure `userType` is always set during signup
