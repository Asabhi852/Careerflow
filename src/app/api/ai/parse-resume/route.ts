import { NextRequest, NextResponse } from 'next/server';

// Simple AI-powered resume parser using Google Gemini
async function parseResumeWithAI(resumeText: string) {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  
  console.log('API Key exists:', !!apiKey);
  console.log('API Key length:', apiKey?.length);
  
  if (!apiKey) {
    throw new Error('GOOGLE_GENAI_API_KEY is not configured');
  }

  const prompt = `You are an expert resume parser. Extract structured information from this resume and return ONLY valid JSON (no markdown, no code blocks, just pure JSON).

RESUME TEXT:
${resumeText}

Return a JSON object with this exact structure:
{
  "personalInfo": {
    "firstName": "string",
    "lastName": "string",
    "email": "string or null",
    "phoneNumber": "string or null",
    "location": "string or null",
    "linkedIn": "string or null",
    "portfolio": "string or null",
    "age": number or null
  },
  "professionalSummary": {
    "bio": "string",
    "currentJobTitle": "string or null",
    "currentCompany": "string or null",
    "yearsOfExperience": number or null
  },
  "workExperience": [
    {
      "company": "string",
      "position": "string",
      "startDate": "string",
      "endDate": "string or null",
      "current": boolean,
      "description": "string",
      "location": "string or null"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "graduationYear": "string or null",
      "gpa": "string or null"
    }
  ],
  "skills": {
    "technical": ["string"],
    "soft": ["string"],
    "languages": ["string"],
    "certifications": ["string"]
  },
  "certificates": [],
  "projects": [],
  "achievements": [],
  "interests": [],
  "availability": "available",
  "expectedSalary": null,
  "preferredJobTypes": [],
  "preferredLocations": []
}

Extract ALL information accurately. Return ONLY the JSON object, nothing else.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        }
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Gemini API error:', errorData);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    throw new Error('No response from AI');
  }

  // Clean up the response - remove markdown code blocks if present
  let cleanedText = generatedText.trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  // Parse the JSON
  const parsedData = JSON.parse(cleanedText);
  return parsedData;
}

export async function POST(request: NextRequest) {
  try {
    const { resumeText } = await request.json();

    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      );
    }

    // Parse the resume using AI
    const parsedData = await parseResumeWithAI(resumeText);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error parsing resume:', error);
    return NextResponse.json(
      { 
        error: 'Failed to parse resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
