# PowerShell script to set up CORS for Firebase Storage
# This script requires Google Cloud SDK to be installed

Write-Host "Setting up CORS for Firebase Storage..." -ForegroundColor Green

# Check if gsutil is available
if (Get-Command gsutil -ErrorAction SilentlyContinue) {
    Write-Host "Google Cloud SDK found. Setting up CORS..." -ForegroundColor Yellow
    
    # Set CORS configuration
    gsutil cors set cors.json gs://studio-2435754906-32654.firebasestorage.app
    
    Write-Host "CORS configuration applied successfully!" -ForegroundColor Green
} else {
    Write-Host "Google Cloud SDK not found. Please install it first:" -ForegroundColor Red
    Write-Host "1. Download from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    Write-Host "2. After installation, run this script again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Use Firebase Console to configure CORS:" -ForegroundColor Cyan
    Write-Host "https://console.firebase.google.com/project/studio-2435754906-32654/storage" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "CORS configuration file created: cors.json" -ForegroundColor Green
Write-Host "This allows requests from localhost:3000, localhost:9002, and your production domain" -ForegroundColor Green
