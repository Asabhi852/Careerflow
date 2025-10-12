'use client';
// @ts-ignore - React hooks import issue
import { useState, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
// @ts-ignore - Firebase Firestore import issue
import { doc, collection, query, limit } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// @ts-ignore - Lucide icons import issue
import { Loader2, Briefcase, MapPin, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { jobMatchSuggestions, type JobMatchSuggestionsInput } from '@/ai/flows/job-match-suggestions';
import type { UserProfile, JobPosting } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getTopMatches, getMatchQuality, type MatchScore } from '@/lib/matching-algorithm';
import Link from 'next/link';

export default function AiMatchesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<{ jobMatches: string[], summaryForRecruiters: string } | null>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  // Fetch available jobs
  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jobs'), limit(50));
  }, [firestore]);

  const { data: jobs } = useCollection<JobPosting>(jobsQuery);

  // Calculate matches using our algorithm
  const matches = useMemo(() => {
    if (!userProfile || !jobs) return [];
    return getTopMatches(userProfile, jobs, 10);
  }, [userProfile, jobs]);

  const handleGenerateMatches = async () => {
    if (!userProfile) {
      toast({
        variant: 'destructive',
        title: 'Profile Not Found',
        description: 'Please complete your profile before generating matches.',
      });
      return;
    }

    setIsLoading(true);
    setMatchResult(null);

    try {
      // NOTE: In a real app, you would fetch job requirements from actual job postings.
      // For this demo, we'll use a sample job requirement string.
      const sampleJobRequirements = "Seeking a senior software engineer with experience in React, TypeScript, and Node.js. Strong problem-solving skills and experience with cloud platforms like AWS or Google Cloud is a plus.";

      const profileDataString = JSON.stringify({
        skills: userProfile.skills,
        education: userProfile.education,
        location: userProfile.location,
      });

      const input: JobMatchSuggestionsInput = {
        profileData: profileDataString,
        resumeDataUri: userProfile.resumeUrl || 'data:text/plain;base64,bm8gcmVzdW1l', // Provide a dummy data URI if no resume
        jobRequirements: sampleJobRequirements,
      };

      const result = await jobMatchSuggestions(input);
      setMatchResult(result);

      toast({
        title: 'Matches Generated!',
        description: 'AI has found potential job matches for you.',
      });

    } catch (error) {
      console.error('Error generating job matches:', error);
      toast({
        variant: 'destructive',
        title: 'Error Generating Matches',
        description: 'There was a problem contacting the AI. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">
        AI Job Matches
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Your Personalized Job Feed</CardTitle>
          <CardDescription>
            Click the button below to use our AI to analyze your profile against open roles and suggest the best fits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!matchResult && (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">Ready to find your next opportunity?</p>
              <Button onClick={handleGenerateMatches} disabled={isLoading || !userProfile}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  'Generate My Job Matches'
                )}
              </Button>
              {!userProfile && (
                 <p className="text-sm text-muted-foreground mt-4">Please complete your profile to enable this feature.</p>
              )}
            </div>
          )}
          {matches.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-4">Your Top Job Matches</h3>
              <div className="grid gap-4">
                {matches.map((match) => {
                  const job = jobs?.find(j => j.id === match.jobId);
                  if (!job) return null;
                  const quality = getMatchQuality(match.score);
                  
                  return (
                    <Card key={match.jobId}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl">{job.title}</CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-2">
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4" />
                                {job.company}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                              </span>
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            {/* @ts-ignore - Badge children prop */}
                            <Badge variant={quality.color === 'green' ? 'default' : 'secondary'}>
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {match.score}% Match
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">{quality.label}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {job.salary && (
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span>${job.salary.toLocaleString()}/year</span>
                            </div>
                          )}
                          
                          {match.matchedSkills.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Matched Skills:</p>
                              <div className="flex flex-wrap gap-2">
                                {match.matchedSkills.map((skill, idx) => (
                                  // @ts-ignore - Badge children prop
                                  <Badge key={idx} variant="outline">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {match.reasons.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Why this matches:</p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {match.reasons.map((reason, idx) => (
                                  <li key={idx}>• {reason}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button asChild className="w-full">
                          <Link href={`/jobs/${job.id}`}>View Job Details</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {matchResult && (
            <div className="space-y-6 mt-8">
              <div>
                <h3 className="font-semibold text-lg mb-2">AI-Suggested Job Titles</h3>
                <div className="flex flex-col gap-2">
                  {matchResult.jobMatches.map((jobTitle, index) => (
                     <Card key={index} className="bg-muted/50 p-4">
                        <p className="font-medium">{jobTitle}</p>
                    </Card>
                  ))}
                </div>
              </div>
               <div>
                <h3 className="font-semibold text-lg mb-2">Your AI-Generated Summary for Recruiters</h3>
                 <Alert>
                  <AlertTitle>Recruiter-Optimized Summary</AlertTitle>
                  <AlertDescription className="whitespace-pre-wrap">
                    {matchResult.summaryForRecruiters}
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}
        </CardContent>
        {matchResult && (
          <CardFooter>
             <Button onClick={handleGenerateMatches} disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Re-generating...</>
                ) : (
                  'Generate Again'
                )}
              </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
