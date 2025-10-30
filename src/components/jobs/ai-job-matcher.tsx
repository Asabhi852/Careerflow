'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Upload, Loader2, Sparkles, Briefcase, MapPin, DollarSign, TrendingUp, BookOpen, Lightbulb, ExternalLink } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface JobMatch {
  title: string;
  company: string;
  location: string;
  matchScore: number;
  matchReasons: string[];
  salaryRange?: string;
  jobType: string;
  description: string;
  requirements: string[];
  url?: string;
  source?: string;
}

interface SkillGap {
  skill: string;
  importance: 'high' | 'medium' | 'low';
  learningResources: string[];
}

interface MatchResult {
  parsedResume: any;
  jobMatches: JobMatch[];
  summaryForRecruiters: string;
  skillGaps: SkillGap[];
  careerAdvice: string;
}

export function AIJobMatcher() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromFile = async (file: File): Promise<string> => {
    // For PDFs, we'll just read as text and let the backend handle proper parsing
    // This avoids the pdfjs-dist webpack issues in Next.js
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result;
          
          if (file.type === 'application/pdf') {
            // For PDFs, read as text (basic extraction)
            // The AI backend will handle proper parsing
            resolve(content as string);
          } else {
            // For text files, just return the content
            resolve(content as string);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      // Always read as text - simpler and works for the AI backend
      reader.readAsText(file);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Resume must be less than 10MB.',
      });
      return;
    }

    setFile(selectedFile);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const resumeText = await extractTextFromFile(file);
      
      if (!resumeText || resumeText.trim().length < 50) {
        toast({
          variant: 'destructive',
          title: 'Unable to parse resume',
          description: 'Could not extract text from the resume.',
        });
        setIsProcessing(false);
        return;
      }

      const response = await fetch('/api/ai-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeText }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to match jobs');
      }

      const data = await response.json();
      setResult(data.data);

      toast({
        title: 'Analysis Complete!',
        description: `Found ${data.data.jobMatches.length} matching jobs for you.`,
      });
    } catch (error: any) {
      console.error('Job matching error:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis failed',
        description: error.message || 'Could not analyze your resume.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getImportanceColor = (importance: string) => {
    if (importance === 'high') return 'destructive';
    if (importance === 'medium') return 'default';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-blue-600" />
            AI-Powered Job Matching
          </CardTitle>
          <CardDescription className="text-base">
            Upload your resume and let AI find the perfect jobs for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
              id="resume-upload-ai"
            />
            <label
              htmlFor="resume-upload-ai"
              className="flex items-center gap-2 px-6 py-3 border-2 border-blue-300 bg-white rounded-lg cursor-pointer hover:bg-blue-50 transition-colors w-full max-w-md justify-center"
            >
              <Upload className="h-5 w-5 text-blue-600" />
              <span className="font-medium">
                {file ? file.name : 'Choose Resume (TXT recommended, PDF/DOC supported)'}
              </span>
            </label>

            {file && (
              <Button
                onClick={handleAnalyze}
                disabled={isProcessing}
                size="lg"
                className="w-full max-w-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing Resume...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Find Matching Jobs
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Career Summary */}
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Professional Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{result.summaryForRecruiters}</p>
            </CardContent>
          </Card>

          {/* Career Advice */}
          {result.careerAdvice && (
            <Card className="border-l-4 border-l-green-600 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Lightbulb className="h-5 w-5" />
                  Career Advice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-900/80 leading-relaxed">{result.careerAdvice}</p>
              </CardContent>
            </Card>
          )}

          {/* Job Matches */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              Recommended Jobs ({result.jobMatches.length})
            </h2>
            <div className="grid gap-4">
              {result.jobMatches.map((job, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <CardDescription className="text-base font-medium mt-1">
                          {job.company}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getMatchScoreColor(job.matchScore)}`}>
                          {job.matchScore}%
                        </div>
                        <p className="text-xs text-muted-foreground">Match Score</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={job.matchScore} className="h-2" />

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{job.location}</span>
                      </div>
                      {job.salaryRange && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{job.salaryRange}</span>
                        </div>
                      )}
                      <Badge variant="outline">{job.jobType}</Badge>
                      {job.source && <Badge variant="secondary">{job.source}</Badge>}
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">{job.description}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2">Why you're a great match:</h4>
                      <ul className="space-y-1">
                        {job.matchReasons.map((reason, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">✓</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {job.requirements && job.requirements.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Key Requirements:</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.requirements.map((req, idx) => (
                            <Badge key={idx} variant="secondary">{req}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {job.url && (
                      <Button asChild className="w-full">
                        <a href={job.url} target="_blank" rel="noopener noreferrer">
                          Apply Now
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Skill Gaps */}
          {result.skillGaps && result.skillGaps.length > 0 && (
            <Card className="border-l-4 border-l-orange-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Skills to Develop
                </CardTitle>
                <CardDescription>
                  Enhance your profile by learning these skills
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.skillGaps.map((gap, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{gap.skill}</h4>
                      <Badge variant={getImportanceColor(gap.importance)}>
                        {gap.importance} priority
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Learning Resources:</p>
                      <div className="flex flex-wrap gap-2">
                        {gap.learningResources.map((resource, idx) => (
                          <Badge key={idx} variant="outline">{resource}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
