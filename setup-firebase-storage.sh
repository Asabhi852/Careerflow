#!/bin/bash

echo "🚀 Setting up Firebase Storage for CareerFlow Connect"
echo "=================================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "Please install it first:"
    echo "npm install -g firebase-tools"
    echo "firebase login"
    exit 1
fi

echo "✅ Firebase CLI found"

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase."
    echo "Please run: firebase login"
    exit 1
fi

echo "✅ Firebase authentication verified"

# Deploy storage rules
echo "📦 Deploying Firebase Storage Rules..."
if firebase deploy --only storage; then
    echo "✅ Storage rules deployed successfully!"
else
    echo "❌ Failed to deploy storage rules."
    echo "Please check the error above and try again."
    exit 1
fi

echo ""
echo "🎉 Firebase Storage setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure Firebase Storage is enabled in your Firebase Console"
echo "2. Restart your development server: npm run dev"
echo "3. Test file uploads in your application"
echo ""
echo "If you still see CORS errors:"
echo "1. Check Firebase Console → Storage → Rules"
echo "2. Verify the rules are published"
echo "3. Clear your browser cache"
