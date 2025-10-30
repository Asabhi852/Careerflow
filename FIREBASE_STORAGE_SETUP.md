# Firebase Storage CORS Fix Guide

## 🚨 CORS Error Fix

The error you're seeing indicates that Firebase Storage is not properly configured for your local development environment.

## Quick Fix Steps

### 1. Enable Firebase Storage (if not already done)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `studio-2435754906-32654`
3. Navigate to **Storage** in the left sidebar
4. Click **"Get Started"** if Storage is not enabled
5. Choose **"Start in test mode"** for development
6. Select a location (choose the same as your Firestore)

### 2. Deploy Storage Rules

**Option A: Using Firebase CLI (Recommended)**
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy storage rules
firebase deploy --only storage
```

**Option B: Manual Setup**
1. Go to Firebase Console → Storage → Rules
2. Replace the existing rules with the content from `storage.rules` file
3. Click **"Publish"**

### 3. Verify Storage Rules

The deployed rules should look like this:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /profile-pictures/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Create Environment File

Create `.env.local` in your project root:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBsbo8d4lI3S1rW841zqmRhtstFdkl1cws
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studio-2435754906-32654.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-2435754906-32654
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=studio-2435754906-32654.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=7551425371
NEXT_PUBLIC_FIREBASE_APP_ID=1:7551425371:web:ad26314192876e3c63187e
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

### 5. Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## 🔍 Troubleshooting

### If CORS error persists:

1. **Check Firebase Console Storage Rules**
   - Go to Storage → Rules
   - Ensure rules are published and active
   - Verify the rules match the content in `storage.rules`

2. **Clear Browser Cache**
   - Hard refresh (Ctrl+Shift+R)
   - Clear browser cache and cookies

3. **Check Network Tab**
   - Open Developer Tools → Network
   - Look for the failed request
   - Check if it's a 403 (Forbidden) or 404 (Not Found) error

4. **Verify Authentication**
   - Ensure user is logged in
   - Check if `user.uid` is available in the upload function

### Common Issues:

- **Storage not enabled**: Enable Storage in Firebase Console
- **Rules not deployed**: Deploy storage rules using Firebase CLI
- **Wrong bucket**: Verify `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` in env
- **Authentication issues**: Ensure user is logged in before upload

## ✅ Verification

After following these steps:

1. Go to `http://localhost:9002/dashboard`
2. Try uploading a profile picture
3. Check if the image appears in the preview
4. Verify the image is visible in candidate lists

## 📞 Support

If the issue persists after following these steps:

1. Check the browser console for specific error messages
2. Verify Firebase project settings
3. Ensure all environment variables are correct
4. Check Firebase Console for any error logs

The CORS error should be resolved once Firebase Storage is properly configured with the correct rules.
