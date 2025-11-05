# Firebase Setup Required ✅

## Issues Fixed

### 1. Firestore Rules - Posts Collection ✅ DEPLOYED
The Firestore rules for the `posts` collection have been deployed successfully.

**Rules Applied**:
```javascript
match /posts/{postId} {
  allow get, list: if true; // Anyone can read and list posts
  allow create: if request.auth != null; // Only authenticated users can create
  allow update, delete: if request.auth != null && request.auth.uid == resource.data.authorId;
}
```

✅ **Status**: Firestore rules are now active. Posts collection should work.

---

## Action Required: Enable Firebase Storage

### Issue
Firebase Storage is not yet enabled in your Firebase project. This is required for:
- ✅ Uploading post images
- ✅ Uploading videos
- ✅ Uploading certificates
- ✅ Resume uploads
- ✅ Profile pictures

### How to Enable Firebase Storage

**Step 1: Go to Firebase Console**
```
https://console.firebase.google.com/project/studio-2435754906-32654/storage
```

**Step 2: Click "Get Started"**
- You'll see a button that says "Get Started" 
- Click it to initialize Firebase Storage

**Step 3: Choose Security Rules**
- Select "Start in production mode" (we'll update the rules)
- Click "Next"

**Step 4: Select Location**
- Choose your preferred location (e.g., us-central1 or asia-south1)
- Click "Done"

**Step 5: Deploy Storage Rules**
After enabling storage in the console, run this command:
```bash
cd d:\ABHI\Project\Careerflow-main\FIREBASE
firebase deploy --only storage
```

---

## Storage Rules Configuration

The storage rules have been created at:
**File**: `FIREBASE/storage.rules`

**Rules Summary**:

### Post Media (Images, Videos, Certificates)
```javascript
match /posts/{type}/{userId}/{fileName} {
  - Users can upload their own files
  - Anyone can view (public posts)
  - Max file size: 100MB
  - Only owner can delete
}
```

### Resumes
```javascript
match /resumes/{userId}/{fileName} {
  - Users upload their own resume
  - Authenticated users can view (for job applications)
  - Max file size: 5MB
  - Only owner can delete
}
```

### Profile Pictures
```javascript
match /profile-pictures/{userId}/{fileName} {
  - Users upload their own photo
  - Anyone can view
  - Max file size: 2MB
  - Only owner can delete
}
```

---

## OAuth Domain Warning (Optional)

### Issue
```
The current domain is not authorized for OAuth operations.
Domain: careerflow-cyan.vercel.app
```

### Impact
- ❌ Affects: Google Sign-In, Facebook Sign-In, etc.
- ✅ Does NOT affect: Email/Password authentication (currently used)

### Fix (If needed for Social Login)

**Step 1: Go to Firebase Console**
```
https://console.firebase.google.com/project/studio-2435754906-32654/authentication/settings
```

**Step 2: Scroll to "Authorized Domains"**

**Step 3: Add Your Domain**
- Click "Add domain"
- Enter: `careerflow-cyan.vercel.app`
- Click "Add"

**Note**: This is only needed if you plan to use Google/Facebook/Twitter login. Email/password authentication works without this.

---

## Verification Steps

### After Enabling Firebase Storage:

**1. Test Post Creation**
- Login to the app
- Click "Create Post"
- Try uploading an image
- Should work without errors ✅

**2. Check Firebase Console**
```
https://console.firebase.google.com/project/studio-2435754906-32654/storage
```
- You should see uploaded files in the storage browser

**3. Check Console Logs**
- Open browser console (F12)
- Should see no more "Missing or insufficient permissions" errors

---

## Quick Setup Checklist

- [x] Firestore rules deployed
- [ ] Enable Firebase Storage in console
- [ ] Deploy storage rules: `firebase deploy --only storage`
- [ ] Test file upload in app
- [ ] (Optional) Add OAuth domain for social login

---

## Files Created/Modified

### Created
- ✅ `FIREBASE/storage.rules` - Storage security rules
- ✅ `extara/FIREBASE_SETUP_REQUIRED.md` - This guide

### Modified
- ✅ `FIREBASE/firebase.json` - Added storage configuration
- ✅ `FIREBASE/firestore.rules` - Already had posts rules

---

## Summary

**What's Working**:
- ✅ Firestore posts collection (rules deployed)
- ✅ Email/password authentication
- ✅ User profiles
- ✅ Job postings

**What Needs Action**:
- ⏳ Enable Firebase Storage (1-2 minutes in Firebase Console)
- ⏳ Deploy storage rules after enabling

**Commands to Run After Enabling Storage**:
```bash
cd d:\ABHI\Project\Careerflow-main\FIREBASE
firebase deploy --only storage
```

---

## Support Links

- **Firebase Console**: https://console.firebase.google.com/project/studio-2435754906-32654
- **Storage Setup**: https://console.firebase.google.com/project/studio-2435754906-32654/storage
- **Authentication**: https://console.firebase.google.com/project/studio-2435754906-32654/authentication

---

**Created**: November 5, 2025
**Status**: Action Required (Enable Storage)
