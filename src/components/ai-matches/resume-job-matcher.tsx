'use client';

import { useState, useCallback } from 'react';
import { useResumeJobMatching, type JobMatch } from '@/hooks/use-resume-job-matching';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Briefcase, MapPin, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function ResumeJobMatcher() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { matchResume, isLoading, error, data, progress, reset } = useResumeJobMatching({
    onSuccess: (result) => {
      toast({
        title: 'Resume analyzed successfully!',
        description: `Found ${result.totalMatches} matching jobs out of ${result.totalJobs} available positions.`,
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Analysis failed',
        description: error.message,
      });
    },
  });

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Resume file must be less than 5MB.',
      });
      return;
    }

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.docx')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a PDF, DOCX, or TXT file.',
      });
      return;
    }

    setResumeFile(file);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleAnalyze = async () => {
    if (!resumeFile) return;
    
    try {
      await matchResume(resumeFile, {
        limit: 50,
        minScore: 30,
      });
    } catch (err) {
      // Error is already handled in the hook
    }
  };

  const handleReset = () => {
    setResumeFile(null);
    reset();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">AI-Powered Job Matching</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upload your resume and let our AI match you with the best jobs from our database
        </p>
      </div>

      {/* Upload Section */}
      {!data && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Your Resume</CardTitle>
            <CardDescription>
              Upload your resume in PDF, DOCX, or TXT format (max 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-primary/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('resume-file-input')?.click()}
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-muted rounded-full">
                  {resumeFile ? (
                    <FileText className="h-8 w-8 text-primary" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                
                {resumeFile ? (
                  <div className="space-y-2">
                    <p className="font-medium">{resumeFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(resumeFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">Drag & drop your resume here</p>
                    <p className="text-sm text-muted-foreground">or click to browse files</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supports PDF, DOCX, and TXT (max 5MB)
                    </p>
                  </div>
                )}
              </div>
              
              <input
                id="resume-file-input"
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {resumeFile && (
              <div className="mt-4 flex gap-2 justify-center">
                <Button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {progress || 'Analyzing...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Analyze Resume & Find Jobs
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setResumeFile(null)}
                  disabled={isLoading}
                >
                  Remove
                </Button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-destructive">Error</p>
                  <p className="text-sm text-destructive/80">{error.message}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm font-medium">{progress}</p>
              </div>
              <Progress value={33} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {data && (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{data.totalMatches}</p>
                  <p className="text-sm text-muted-foreground">Matching Jobs</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{data.matchingStats.excellent}</p>
                  <p className="text-sm text-muted-foreground">Excellent Matches</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{data.matchingStats.good}</p>
                  <p className="text-sm text-muted-foreground">Good Matches</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{data.matchingStats.averageScore}%</p>
                  <p className="text-sm text-muted-foreground">Avg Match Score</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Your Profile Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{data.userProfile.name}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{data.userProfile.currentRole}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{data.userProfile.location}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.userProfile.skills.slice(0, 10).map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                  {data.userProfile.skills.length > 10 && (
                    <Badge variant="outline">+{data.userProfile.skills.length - 10} more</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Career Advice */}
          {data.careerAdvice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Career Advice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{data.careerAdvice}</p>
              </CardContent>
            </Card>
          )}

          {/* Job Matches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Matching Jobs ({data.totalMatches})</h2>
              <Button variant="outline" onClick={handleReset}>
                Upload New Resume
              </Button>
            </div>

            {data.totalMatches === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="font-medium">No matching jobs found</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {data.message || 'Try updating your resume or check back later for new opportunities.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {data.jobMatches.map((match: JobMatch, index: number) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{match.job?.title || 'Job Title'}</CardTitle>
                          <CardDescription className="mt-1">
                            {match.job?.company || 'Company'} • {match.job?.location || 'Location'}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-3xl font-bold text-primary">{match.score}%</div>
                          <Badge className={getMatchQualityColor(match.matchQuality)}>
                            {match.matchQuality}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Job Details */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {match.job?.salary && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span>₹{match.job.salary.toLocaleString()}/year</span>
                          </div>
                        )}
                        {match.job?.employmentType && (
                          <Badge variant="outline">{match.job.employmentType}</Badge>
                        )}
                        {match.distance !== undefined && (
                          <span className="text-muted-foreground">{match.distance} km away</span>
                        )}
                      </div>

                      {/* Match Reasons */}
                      <div>
                        <p className="font-medium text-sm mb-2">Why this matches:</p>
                        <ul className="space-y-1">
                          {match.reasons.map((reason, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Matched Skills */}
                      {match.matchedSkills.length > 0 && (
                        <div>
                          <p className="font-medium text-sm mb-2">Matched Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {match.matchedSkills.slice(0, 8).map((skill, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {match.job?.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {match.job.description}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1">View Details</Button>
                        <Button variant="outline">Save</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Skill Gaps */}
          {data.skillGaps && data.skillGaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Skills to Develop</CardTitle>
                <CardDescription>
                  These skills are in high demand and can improve your job prospects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.skillGaps.map((gap, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{gap.skill}</span>
                        <Badge variant="outline">{gap.importance}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Resources: {gap.learningResources.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
