#!/usr/bin/env node

/**
 * Deploy Firebase Storage Rules
 * 
 * This script deploys the Firebase Storage rules to fix CORS issues.
 * Run this script after setting up Firebase Storage in the console.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Firebase Storage Rules...\n');

// Check if firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Firebase CLI is not installed. Please install it first:');
  console.error('npm install -g firebase-tools');
  console.error('firebase login');
  process.exit(1);
}

// Check if storage.rules exists
if (!fs.existsSync('storage.rules')) {
  console.error('❌ storage.rules file not found. Please create it first.');
  process.exit(1);
}

// Check if firebase.json exists
if (!fs.existsSync('firebase.json')) {
  console.error('❌ firebase.json file not found. Please create it first.');
  process.exit(1);
}

try {
  // Deploy storage rules
  console.log('📦 Deploying Storage Rules...');
  execSync('firebase deploy --only storage', { stdio: 'inherit' });
  
  console.log('\n✅ Firebase Storage Rules deployed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Make sure Firebase Storage is enabled in your Firebase Console');
  console.log('2. Verify the rules are active in Storage → Rules');
  console.log('3. Restart your development server: npm run dev');
  console.log('4. Test file uploads in your application');
  
} catch (error) {
  console.error('❌ Failed to deploy Firebase Storage Rules:');
  console.error(error.message);
  console.log('\n🔧 Manual setup required:');
  console.log('1. Go to Firebase Console → Storage');
  console.log('2. Click "Get Started" if not already enabled');
  console.log('3. Go to Storage → Rules tab');
  console.log('4. Copy the content from storage.rules file');
  console.log('5. Paste and publish the rules');
  process.exit(1);
}
