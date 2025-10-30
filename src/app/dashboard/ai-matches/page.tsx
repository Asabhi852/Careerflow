'use client';
// @ts-ignore - React hooks import issue
import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
// @ts-ignore - Firebase Firestore import issue
import { doc, collection, query, limit } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// @ts-ignore - Lucide icons import issue
import { Loader2, Briefcase, MapPin, DollarSign, TrendingUp, Navigation, AlertCircle, BookOpen, Lightbulb } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { jobMatchSuggestions, type JobMatchSuggestionsInput, type JobMatchSuggestionsOutput } from '@/ai/flows/job-match-suggestions';
import type { UserProfile, JobPosting } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getTopMatches, getTopMatchesWithLocationFilter, getMatchQuality, type MatchScore } from '@/lib/matching-algorithm';
import { getTopEnhancedMatches, getTopEnhancedMatchesWithLocationFilter, type EnhancedMatchScore } from '@/lib/ai-matching-algorithm';
import { LocationFilter } from '@/components/LocationFilter';
import { useLocationState } from '@/hooks/useLocationState';
import { useLiveRecommendations } from '@/hooks/useLiveRecommendations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useExternalJobs } from '@/hooks/use-external-jobs';

export default function AiMatchesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<JobMatchSuggestionsOutput | null>(null);
  const [useEnhancedMatching, setUseEnhancedMatching] = useState(true);
  const [enhancedMatches, setEnhancedMatches] = useState<EnhancedMatchScore[]>([]);
  const [showSkillGaps, setShowSkillGaps] = useState(true);

  // Use live recommendations hook
  const { recommendations, isLoading: recsLoading, hasLocation, refreshRecommendations } = useLiveRecommendations();

  // Location state management
  const {
    currentLocation,
    locationString,
    maxDistance,
    sortBy,
    isTracking,
    setMaxDistance,
    setSortBy,
  } = useLocationState();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  // Fetch available jobs for manual matching (when AI is used)
  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jobs'), limit(100));
  }, [firestore]);

  const { data: internalJobs } = useCollection<JobPosting>(jobsQuery);

  // Fetch external jobs from LinkedIn and Naukri
  const { jobs: externalJobs } = useExternalJobs({
    source: 'all',
    limit: 100,
  });

  // Combine internal and external jobs
  const jobs = useMemo(() => {
    const internal = internalJobs || [];
    const external = externalJobs || [];
    return [...internal, ...external];
  }, [internalJobs, externalJobs]);

  // Calculate enhanced matches with skill gaps and career advice
  useEffect(() => {
    if (!userProfile || !jobs) {
      setEnhancedMatches([]);
      return;
    }

    // Create enhanced profile with location data
    const enhancedProfile = {
      ...userProfile,
      coordinates: currentLocation || userProfile.coordinates,
    };

    // Calculate enhanced matches with skill gaps
    let calculatedMatches: EnhancedMatchScore[] = [];
    
    if (currentLocation && sortBy === 'distance') {
      calculatedMatches = getTopEnhancedMatchesWithLocationFilter(enhancedProfile, jobs, {
        maxDistance,
        sortByDistance: true,
        limit: 20,
      });
    } else if (currentLocation) {
      calculatedMatches = getTopEnhancedMatchesWithLocationFilter(enhancedProfile, jobs, {
        maxDistance,
        sortByDistance: false,
        limit: 20,
      });
    } else {
      // Fallback to regular matching
      calculatedMatches = getTopEnhancedMatches(enhancedProfile, jobs, 20);
    }

    setEnhancedMatches(calculatedMatches);
  }, [userProfile, jobs, currentLocation, maxDistance, sortBy]);

  // Calculate matches using basic algorithm (for comparison)
  const matches = useMemo(() => {
    if (!userProfile || !jobs) return [];

    // Create enhanced profile with location data
    const enhancedProfile = {
      ...userProfile,
      coordinates: currentLocation || userProfile.coordinates,
    };

    // Use location-aware matching if location is set
    if (currentLocation && sortBy === 'distance') {
      return getTopMatchesWithLocationFilter(enhancedProfile, jobs, {
        maxDistance,
        sortByDistance: true,
        limit: 20,
      });
    } else if (currentLocation) {
      return getTopMatchesWithLocationFilter(enhancedProfile, jobs, {
        maxDistance,
        sortByDistance: false,
        limit: 20,
      });
    } else {
      // Fallback to regular matching
      return getTopMatches(enhancedProfile, jobs, 20);
    }
  }, [userProfile, jobs, currentLocation, maxDistance, sortBy]);

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
        location: locationString || userProfile.location,
        coordinates: currentLocation,
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

      {/* Location Filter */}
      <LocationFilter
        onLocationChange={(coordinates, locationStr) => {
          // Location state is managed by useLocationState hook
        }}
        onDistanceChange={setMaxDistance}
        onSortChange={setSortBy}
        currentLocation={currentLocation}
        currentMaxDistance={maxDistance}
        currentSortBy={sortBy}
      />

      <Card>
        <CardHeader>
          <CardTitle>Your Personalized Job Feed</CardTitle>
          <CardDescription>
            {currentLocation
              ? `Click the button below to use our AI to analyze your profile against open roles within ${maxDistance}km of your location.`
              : 'Click the button below to use our AI to analyze your profile against open roles and suggest the best fits.'
            }
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

          {(enhancedMatches.length > 0 || recommendations.length > 0) && !matchResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  {currentLocation
                    ? `AI Job Recommendations (${enhancedMatches.length} jobs within ${maxDistance}km)`
                    : `Your Top ${enhancedMatches.length} AI Job Matches`
                  }
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Sorted by {sortBy === 'distance' ? 'Distance' : 'Best Match'}
                  </Badge>
                  {isTracking && (
                    <Badge variant="default" className="text-xs">
                      <Navigation className="h-3 w-3 mr-1" />
                      Live
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSkillGaps(!showSkillGaps)}
                  >
                    {showSkillGaps ? 'Hide' : 'Show'} Skill Gaps
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="matches" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="matches">Job Matches</TabsTrigger>
                  <TabsTrigger value="skills">Skill Gaps</TabsTrigger>
                </TabsList>

                <TabsContent value="matches" className="grid gap-4">
                  {enhancedMatches.map((match) => {
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
                                  {match.distance && (
                                    <Badge variant="outline" className="ml-2">
                                      <Navigation className="h-3 w-3 mr-1" />
                                      {match.distance}km
                                    </Badge>
                                  )}
                                </span>
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <Badge variant={match.matchQuality === 'excellent' ? 'default' : 'secondary'}>
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {match.score}% Match
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1 capitalize">{match.matchQuality}</p>
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

                            {match.distance && (
                              <div className="flex items-center gap-2 text-sm">
                                <Navigation className="h-4 w-4 text-muted-foreground" />
                                <span>{match.distance}km from your location</span>
                              </div>
                            )}

                            {match.matchedSkills.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Matched Skills:</p>
                                <div className="flex flex-wrap gap-2">
                                  {match.matchedSkills.map((skill, idx) => (
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

                            {match.careerAdvice && showSkillGaps && (
                              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-2 mb-2">
                                  <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Career Advice</p>
                                </div>
                                <p className="text-sm text-blue-800 dark:text-blue-200">{match.careerAdvice}</p>
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
                </TabsContent>

                <TabsContent value="skills" className="space-y-4">
                  {enhancedMatches
                    .filter(match => match.skillGaps.length > 0)
                    .map((match) => {
                      const job = jobs?.find(j => j.id === match.jobId);
                      if (!job) return null;

                      return (
                        <Card key={match.jobId}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-yellow-500" />
                              {job.title} - Skill Development
                            </CardTitle>
                            <CardDescription>
                              {job.company} • {match.score}% Match
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {match.skillGaps.map((gap, idx) => (
                                <div key={idx} className="p-3 border rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">{gap.skill}</span>
                                    <Badge 
                                      variant={gap.importance === 'high' ? 'destructive' : gap.importance === 'medium' ? 'default' : 'secondary'}
                                    >
                                      {gap.importance} priority
                                    </Badge>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="text-muted-foreground">Current:</span>
                                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div 
                                          className="bg-blue-500 h-2 rounded-full"
                                          style={{ width: `${(gap.currentLevel / gap.requiredLevel) * 100}%` }}
                                        />
                                      </div>
                                      <span className="text-xs">{gap.currentLevel}/{gap.requiredLevel}</span>
                                    </div>
                                    {gap.learningResources.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Learning Resources:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {gap.learningResources.map((resource, rIdx) => (
                                            <Badge key={rIdx} variant="outline" className="text-xs">
                                              <BookOpen className="h-3 w-3 mr-1" />
                                              {resource}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  
                  {enhancedMatches.every(match => match.skillGaps.length === 0) && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Skill Gaps Identified</AlertTitle>
                      <AlertDescription>
                        Great! Your skills align well with the available opportunities. Consider exploring higher-level positions.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {matchResult && (
            <div className="space-y-6 mt-8">
              <div>
                <h3 className="font-semibold text-lg mb-2">AI-Suggested Job Titles</h3>
                <div className="flex flex-col gap-2">
                  {matchResult.jobMatches.map((jobTitle, index) => (
                     <Card key={index} className="bg-muted/50 p-4">
                        <p className="font-medium">{String(jobTitle)}</p>
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

