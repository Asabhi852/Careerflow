# Resume Parser Setup Guide

## Quick Fix for "Failed to parse resume" Error

The error occurs because the Google AI API key is not configured. Follow these steps:

### Step 1: Create `.env.local` File

1. In your project root folder (`d:\ABHI\Project\Careerflow-main\`), create a new file named `.env.local`
2. Add the following line:

```
GOOGLE_GENAI_API_KEY=your_api_key_here
```

### Step 2: Get Your Google AI API Key

1. Open your browser and go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"** button
4. Select **"Create API key in new project"** or choose an existing project
5. Copy the generated API key
6. Paste it in your `.env.local` file (replace `your_api_key_here`)

Example:
```
GOOGLE_GENAI_API_KEY=AIzaSyABC123def456GHI789jkl012MNO345pqr
```

### Step 3: Restart Your Development Server

**IMPORTANT:** You MUST restart the server for environment variables to load.

1. Stop the current server:
   - Press `Ctrl + C` in your terminal

2. Start the server again:
   ```bash
   npm run dev
   ```

### Step 4: Test the Resume Parser

1. Go to your app: http://localhost:3000
2. Navigate to **Dashboard** → **My Profile**
3. Click on the **"AI Resume Parser"** tab
4. Upload a resume file (TXT or PDF)
5. Wait for processing (5-10 seconds)
6. Review the extracted data

## Troubleshooting

### Error: "GOOGLE_GENAI_API_KEY is not configured"

**Solution:** 
- Make sure `.env.local` file exists in the project root
- Verify the API key is on a line starting with `GOOGLE_GENAI_API_KEY=`
- Restart the development server

### Error: "Gemini API error: 400"

**Solution:**
- Your API key might be invalid
- Get a new API key from https://aistudio.google.com/app/apikey
- Make sure there are no extra spaces in the `.env.local` file

### Error: "Gemini API error: 429"

**Solution:**
- You've exceeded the free tier rate limit
- Wait a few minutes and try again
- Consider upgrading your Google AI plan

### Resume parsing is inaccurate

**Solution:**
- Use a well-formatted resume with clear sections
- Ensure the resume is in English (or supported language)
- Try a different file format (TXT works best)

### File upload doesn't work

**Solution:**
- Check file size (max 5MB)
- Use supported formats: PDF or TXT
- DOC/DOCX support coming soon

## File Structure

After setup, your project should have:

```
d:\ABHI\Project\Careerflow-main\
├── .env.local  ← YOU NEED TO CREATE THIS
├── src/
│   ├── app/
│   │   └── api/
│   │       └── ai/
│   │           └── parse-resume/
│   │               └── route.ts  ← API endpoint
│   └── components/
│       └── resume/
│           └── resume-parser.tsx  ← UI component
└── ...
```

## Testing with Sample Resume

Create a file named `sample-resume.txt` with this content:

```
John Doe
Email: john.doe@email.com
Phone: +1 234-567-8900
Location: San Francisco, CA

PROFESSIONAL SUMMARY
Experienced Software Engineer with 5 years of expertise in full-stack development.

WORK EXPERIENCE
Senior Software Engineer
Tech Corp | 2021 - Present
- Developed scalable web applications using React and Node.js
- Led a team of 5 developers

Software Engineer
StartupXYZ | 2019 - 2021
- Built RESTful APIs and microservices
- Implemented CI/CD pipelines

EDUCATION
Bachelor of Science in Computer Science
MIT | 2019

SKILLS
Technical: JavaScript, TypeScript, React, Node.js, Python, AWS
Soft Skills: Leadership, Communication, Problem Solving
Languages: English, Spanish
```

Upload this file to test the parser!

## Need Help?

1. Check the browser console for detailed error messages
2. Check the terminal/server logs
3. Verify `.env.local` file exists and has the correct API key
4. Make sure you restarted the server after adding the API key

## API Key Security

⚠️ **IMPORTANT:**
- Never commit `.env.local` to Git (it's already in `.gitignore`)
- Never share your API key publicly
- If you accidentally expose your key, delete it and create a new one

## Free Tier Limits

Google AI free tier includes:
- 15 requests per minute
- 1,500 requests per day
- 1 million tokens per month

This is more than enough for testing and small-scale use!
