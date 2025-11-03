import { useState } from 'react';

export interface JobMatch {
  jobId: string;
  score: number;
  matchQuality: 'excellent' | 'good' | 'fair' | 'poor';
  matchedSkills: string[];
  reasons: string[];
  distance?: number;
  compatibilityFactors: {
    skills: number;
    experience: number;
    location: number;
    salary: number;
    availability: number;
    education: number;
    personality: number;
    careerProgression: number;
    culturalFit: number;
  };
  skillGaps: Array<{
    skill: string;
    importance: 'high' | 'medium' | 'low';
    currentLevel: number;
    requiredLevel: number;
    learningResources: string[];
  }>;
  careerAdvice: string;
  job: any;
  applied: boolean;
}

export interface ResumeJobMatchingResult {
  parsedResume: any;
  userProfile: {
    name: string;
    currentRole: string;
    location: string;
    skills: string[];
    experience: number;
  };
  jobMatches: JobMatch[];
  totalJobs: number;
  totalMatches: number;
  summaryForRecruiters: string;
  skillGaps: Array<{
    skill: string;
    importance: 'high' | 'medium' | 'low';
    learningResources: string[];
  }>;
  careerAdvice: string;
  matchingStats: {
    excellent: number;
    good: number;
    fair: number;
    averageScore: number;
  };
  message?: string;
}

export interface UseResumeJobMatchingOptions {
  onSuccess?: (data: ResumeJobMatchingResult) => void;
  onError?: (error: Error) => void;
}

export function useResumeJobMatching(options?: UseResumeJobMatchingOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ResumeJobMatchingResult | null>(null);
  const [progress, setProgress] = useState<string>('');

  /**
   * Extract text from PDF or DOCX file
   */
  const extractTextFromFile = async (file: File): Promise<string> => {
    setProgress('Reading file...');
    
    if (file.type === 'application/pdf') {
      const pdfjs = await import('pdfjs-dist');
      // Set worker source
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        text += strings.join(' ') + '\n';
      }
      return text;
    } else if (file.name.endsWith('.docx')) {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }
    
    // For text files
    return await file.text();
  };

  /**
   * Match resume against internal job database
   */
  const matchResume = async (
    file: File,
    userPreferences?: {
      location?: string;
      maxDistance?: number;
      sortByDistance?: boolean;
      limit?: number;
      minScore?: number;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    setProgress('Starting...');

    try {
      // Extract text from resume
      const resumeText = await extractTextFromFile(file);
      
      if (!resumeText || resumeText.trim().length < 50) {
        throw new Error('Could not extract sufficient text from the resume. Please ensure the file is readable.');
      }

      setProgress('Analyzing resume with AI...');

      // Call the API
      const response = await fetch('/api/ai/resume-job-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          userPreferences: userPreferences || {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to match resume with jobs');
      }

      setProgress('Matching with available jobs...');

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || result.error || 'Job matching failed');
      }

      setProgress('Complete!');
      setData(result.data);
      
      if (options?.onSuccess) {
        options.onSuccess(result.data);
      }

      return result.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      setProgress('');
      
      if (options?.onError) {
        options.onError(error);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset the state
   */
  const reset = () => {
    setIsLoading(false);
    setError(null);
    setData(null);
    setProgress('');
  };

  return {
    matchResume,
    isLoading,
    error,
    data,
    progress,
    reset,
  };
}
