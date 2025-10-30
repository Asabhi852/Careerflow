# Firebase Storage Setup Script for Windows
Write-Host "🚀 Setting up Firebase Storage for CareerFlow Connect" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Check if Firebase CLI is installed
try {
    $firebaseVersion = firebase --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Firebase CLI not found"
    }
    Write-Host "✅ Firebase CLI found: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI is not installed." -ForegroundColor Red
    Write-Host "Please install it first:" -ForegroundColor Yellow
    Write-Host "npm install -g firebase-tools" -ForegroundColor Cyan
    Write-Host "firebase login" -ForegroundColor Cyan
    exit 1
}

# Check if user is logged in
try {
    firebase projects:list 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Not logged in"
    }
    Write-Host "✅ Firebase authentication verified" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Firebase." -ForegroundColor Red
    Write-Host "Please run: firebase login" -ForegroundColor Yellow
    exit 1
}

# Deploy storage rules
Write-Host "📦 Deploying Firebase Storage Rules..." -ForegroundColor Yellow
try {
    firebase deploy --only storage
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Storage rules deployed successfully!" -ForegroundColor Green
    } else {
        throw "Deploy failed"
    }
} catch {
    Write-Host "❌ Failed to deploy storage rules." -ForegroundColor Red
    Write-Host "Please check the error above and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎉 Firebase Storage setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure Firebase Storage is enabled in your Firebase Console" -ForegroundColor White
Write-Host "2. Restart your development server: npm run dev" -ForegroundColor White
Write-Host "3. Test file uploads in your application" -ForegroundColor White
Write-Host ""
Write-Host "If you still see CORS errors:" -ForegroundColor Yellow
Write-Host "1. Check Firebase Console → Storage → Rules" -ForegroundColor White
Write-Host "2. Verify the rules are published" -ForegroundColor White
Write-Host "3. Clear your browser cache" -ForegroundColor White
