'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
// @ts-ignore - Firebase Firestore import issue
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  FileText,
  Briefcase,
  MapPin,
  DollarSign,
  TrendingUp,
  Loader2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { UserProfile, JobPosting } from '@/lib/types';

interface ResumeJobRecommendation {
  jobId: string;
  score: number;
  matchQuality: 'excellent' | 'good' | 'fair' | 'poor';
  matchedSkills: string[];
  reasons: string[];
  distance?: number;
  job: JobPosting;
}

export function ResumeBasedJobRecommendations() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [recommendations, setRecommendations] = useState<ResumeJobRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  const userProfileRef = firestore && user ? doc(firestore, 'users', user.uid) : null;
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  // Auto-analyze resume when profile loads or resume URL changes
  useEffect(() => {
    if (userProfile?.resumeUrl && !hasAnalyzed && !isAnalyzing) {
      analyzeResumeForJobs();
    }
  }, [userProfile?.resumeUrl, hasAnalyzed]);

  const analyzeResumeForJobs = async () => {
    if (!userProfile?.resumeUrl || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      // Extract text from resume URL
      const resumeText = await extractTextFromResume(userProfile.resumeUrl);

      if (!resumeText || resumeText.trim().length < 100) {
        toast({
          variant: 'destructive',
          title: 'Resume Analysis Failed',
          description: 'Could not extract sufficient text from your resume. Please ensure it contains readable content.',
        });
        return;
      }

      // Call the resume-job-match API
      const response = await fetch('/api/ai/resume-job-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          userPreferences: {
            limit: 5,
            minScore: 40,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze resume');
      }

      const result = await response.json();

      if (result.success && result.data.jobMatches) {
        setRecommendations(result.data.jobMatches.slice(0, 5));
        setLastAnalysis(new Date());
        setHasAnalyzed(true);

        toast({
          title: 'Resume Analyzed Successfully!',
          description: `Found ${result.data.jobMatches.length} job matches based on your resume.`,
        });
      }
    } catch (error: any) {
      console.error('Resume analysis error:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze your resume for job recommendations.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractTextFromResume = async (resumeUrl: string): Promise<string> => {
    try {
      // For Firebase Storage URLs, we need to fetch the file
      const response = await fetch(resumeUrl);
      const blob = await response.blob();

      if (blob.type === 'application/pdf') {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

        const arrayBuffer = await blob.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let text = '';

        for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) { // Limit to first 5 pages
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          text += strings.join(' ') + '\n';
        }
        return text;
      } else {
        // For text files, convert to text
        return await blob.text();
      }
    } catch (error) {
      console.error('Error extracting text from resume:', error);
      throw new Error('Could not read resume file');
    }
  };

  const getMatchQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!userProfile?.resumeUrl) {
    return (
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertTitle>Upload Your Resume</AlertTitle>
        <AlertDescription>
          Upload your resume to get personalized job recommendations based on your skills and experience.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Resume-Based Job Recommendations
        </CardTitle>
        <CardDescription>
          AI-powered job matches based on your uploaded resume
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasAnalyzed && !isAnalyzing && (
          <div className="text-center py-6">
            <Button onClick={analyzeResumeForJobs} disabled={isAnalyzing}>
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze Resume for Job Matches
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm font-medium">Analyzing your resume...</p>
            </div>
            <p className="text-xs text-muted-foreground">
              This may take a few moments while we match your skills with available jobs.
            </p>
          </div>
        )}

        {hasAnalyzed && recommendations.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Matches Found</AlertTitle>
            <AlertDescription>
              We couldn't find any job matches based on your resume. Try updating your resume or check back later for new opportunities.
            </AlertDescription>
          </Alert>
        )}

        {hasAnalyzed && recommendations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found {recommendations.length} job matches
                {lastAnalysis && (
                  <span className="ml-2">
                    • Analyzed {(() => {
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      return `${monthNames[lastAnalysis.getMonth()]} ${lastAnalysis.getDate()}, ${lastAnalysis.getFullYear()}`;
                    })()}
                  </span>
                )}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={analyzeResumeForJobs}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Re-analyze
              </Button>
            </div>

            <div className="space-y-3">
              {recommendations.map((rec) => (
                <Card key={rec.jobId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{rec.job.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {rec.job.company}
                          </span>
                          {rec.job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {rec.job.location}
                            </span>
                          )}
                          {rec.distance && (
                            <Badge variant="outline" className="text-xs">
                              {rec.distance}km away
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{rec.score}%</div>
                        <Badge className={getMatchQualityColor(rec.matchQuality)}>
                          {rec.matchQuality}
                        </Badge>
                      </div>
                    </div>

                    {rec.matchedSkills.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-2">Matching Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {rec.matchedSkills.slice(0, 4).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {rec.matchedSkills.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{rec.matchedSkills.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {rec.reasons.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">Why it matches:</p>
                        <p className="text-sm text-muted-foreground">{rec.reasons[0]}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      {rec.job.salary && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>${rec.job.salary.toLocaleString()}/year</span>
                        </div>
                      )}
                      <Button asChild size="sm">
                        <Link href={`/jobs/${rec.job.id}`}>
                          View Details
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center pt-4">
              <Button asChild variant="outline">
                <Link href="/dashboard/ai-matches">
                  View All Job Matches
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
