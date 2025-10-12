# CareerFlow Setup Guide

## Fixing Common Issues

### 1. ✅ Image Position Warning - FIXED
**Issue:** `Image with src has "fill" and parent element with invalid "position"`

**Solution:** Added `relative` class to the parent container in `hero-section.tsx`

---

### 2. 🔧 Firebase Authentication Error (400)

**Issue:** `identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=... Failed to load resource: 400`

**This means Firebase is not properly configured. Follow these steps:**

#### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable **Authentication** → Email/Password sign-in method

#### Step 2: Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Web" icon to add a web app
4. Copy the configuration values

#### Step 3: Update Environment Variables
Create/Update `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Step 4: Enable Firestore Database
1. Go to Firestore Database in Firebase Console
2. Click "Create Database"
3. Start in **Test Mode** (for development)
4. Choose a location

#### Step 5: Enable Firebase Storage
1. Go to Storage in Firebase Console
2. Click "Get Started"
3. Start in **Test Mode** (for development)

#### Step 6: Set Up Firestore Security Rules
In Firestore → Rules, add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow anyone to read public profiles
    match /public_profiles/{profileId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == profileId;
    }
    
    // Allow anyone to read job postings
    match /job_postings/{jobId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write their own messages
    match /users/{userId}/messages/{messageId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### Step 7: Set Up Storage Security Rules
In Storage → Rules, add:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

#### Step 8: Restart Development Server
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

---

### 3. 📝 Fast Refresh Warnings

**Issue:** `[Fast Refresh] done in NaNms` or slow rebuild times

**These are normal development warnings and don't affect functionality:**
- NaNms appears when timing data isn't available
- Rebuild times vary based on changes made
- No action needed

---

## Verification Checklist

After setup, verify:

- [ ] `.env.local` file exists with all Firebase credentials
- [ ] Firebase Authentication is enabled (Email/Password)
- [ ] Firestore Database is created
- [ ] Firebase Storage is enabled
- [ ] Security rules are set for Firestore and Storage
- [ ] Development server is running (`npm run dev`)
- [ ] Can access the app at `http://localhost:9002`

---

## Testing Authentication

1. Go to `http://localhost:9002/signup`
2. Create a test account
3. Check Firebase Console → Authentication to see the new user
4. Try logging in at `http://localhost:9002/login`
5. Access dashboard at `http://localhost:9002/dashboard`

---

## Common Firebase Errors

### Error: "Firebase: Error (auth/invalid-api-key)"
- Check your `NEXT_PUBLIC_FIREBASE_API_KEY` in `.env.local`
- Make sure there are no extra spaces or quotes

### Error: "Firebase: Error (auth/project-not-found)"
- Check your `NEXT_PUBLIC_FIREBASE_PROJECT_ID` in `.env.local`
- Verify the project exists in Firebase Console

### Error: "Missing or insufficient permissions"
- Update Firestore security rules as shown above
- Make sure you're authenticated when accessing protected data

---

## Need Help?

1. Check Firebase Console for error logs
2. Check browser console (F12) for detailed error messages
3. Verify all environment variables are set correctly
4. Make sure Firebase services are enabled in the console

---

## Production Deployment

Before deploying to production:

1. **Update Firestore Rules** to be more restrictive
2. **Update Storage Rules** to limit file sizes and types
3. **Set up Firebase App Check** for additional security
4. **Enable Firebase Analytics** (optional)
5. **Set up proper environment variables** in your hosting platform

---

Your CareerFlow platform is now ready! 🚀
