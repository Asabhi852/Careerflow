'use client';

// @ts-ignore - Lucide React import issue
import { PlusCircle, Navigation } from 'lucide-react';
// @ts-ignore - Firebase Firestore import issue
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { useExternalJobs } from '@/hooks/use-external-jobs';
import type { JobPosting } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore - React hooks import issue
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGeolocation } from '@/hooks/use-geolocation';
import { SiteHeader } from '@/components/layout/site-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobCard, JobCardSkeleton } from '@/components/jobs/job-card';
import { CreateJobPostingDialog } from '@/components/jobs/create-job-dialog';
import { sortByDistance, geocodeLocation } from '@/lib/geolocation';
import { toast } from '@/hooks/use-toast';
import { LocationBanner } from '@/components/location/location-banner';
import { LocationIndicator } from '@/components/location/location-indicator';
import { SiteFooter } from '@/components/layout/site-footer';
import { ChatBot } from '@/components/chat/chat-bot';

export default function JobsPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [sortByLocation, setSortByLocation] = useState(false);
  const [showLocationBanner, setShowLocationBanner] = useState(true);
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { coordinates, isLoading: isLoadingLocation, requestLocation, permissionDenied, locationString } = useGeolocation(true);

  // AI Matches removed from Find Jobs page

  // Fetch internal jobs from Firebase
  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'job_postings'), orderBy('title'));
  }, [firestore]);

  const { data: internalJobs, isLoading: isLoadingInternal } = useCollection<JobPosting>(jobsQuery);

  // Fetch external jobs from LinkedIn and Naukri
  const { jobs: externalJobs, isLoading: isLoadingExternal } = useExternalJobs({
    source: 'all',
    limit: 100
  });

  // Cache geocoded coordinates for external jobs to enable distance sorting
  const [externalCoords, setExternalCoords] = useState<Record<string, { latitude: number; longitude: number }>>({});

  useEffect(() => {
    if (!sortByLocation || !externalJobs || !coordinates) return;
    let cancelled = false;
    const run = async () => {
      const updates: Record<string, { latitude: number; longitude: number }> = {};
      for (const job of externalJobs) {
        if (!job.location) continue;
        if (externalCoords[job.id || '']) continue;
        const coords = await geocodeLocation(job.location);
        if (cancelled) return;
        if (coords && job.id) {
          // Store coordinates directly (already in Coordinates format)
          updates[job.id] = coords;
        }
      }
      if (Object.keys(updates).length > 0) {
        setExternalCoords(prev => ({ ...prev, ...updates }));
      }
    };
    run();
    return () => { cancelled = true; };
  }, [externalJobs, sortByLocation, coordinates]);

  // Fetch LinkedIn jobs only
  const { jobs: linkedInJobs, isLoading: isLoadingLinkedIn } = useExternalJobs({
    source: 'linkedin',
    limit: 50
  });

  // Fetch Naukri jobs only
  const { jobs: naukriJobs, isLoading: isLoadingNaukri } = useExternalJobs({
    source: 'naukri',
    limit: 50
  });

  // Auto-enable location sorting when coordinates are available
  useEffect(() => {
    if (coordinates && !sortByLocation) {
      setSortByLocation(true);
    }
  }, [coordinates]);

  // Geocode job locations when they load
  useEffect(() => {
    if (!sortByLocation || !internalJobs) return;
    
    const geocodeJobs = async () => {
      for (const job of internalJobs) {
        if (!job.coordinates && job.location) {
          const coords = await geocodeLocation(job.location);
          if (coords) {
            job.coordinates = coords;
          }
        }
      }
    };
    
    geocodeJobs();
  }, [internalJobs, sortByLocation]);

  // Separate user's jobs and other jobs
  const { myJobs, otherJobs } = useMemo(() => {
    const internal = internalJobs || [];
    // Enrich external jobs with coordinates if available
    const external = (externalJobs || []).map(j => (
      externalCoords[j.id || ''] ? { ...j, coordinates: externalCoords[j.id || ''] } : j
    ));
    let combined = [...internal, ...external];
    
    // Separate jobs posted by current user
    const myJobs = user ? combined.filter(job => job.posterId === user.uid) : [];
    const otherJobs = user ? combined.filter(job => job.posterId !== user.uid) : combined;
    
    // Sort function
    const sortJobs = (jobs: JobPosting[]) => {
      if (sortByLocation && coordinates) {
        // Sort by distance from user's location
        return sortByDistance(
          jobs,
          coordinates,
          (job) => job.coordinates || null
        );
      } else {
        // Default sort by date
        return jobs.sort((a, b) => {
          const dateA = new Date(a.postedDate || 0).getTime();
          const dateB = new Date(b.postedDate || 0).getTime();
          return dateB - dateA;
        });
      }
    };
    
    return {
      myJobs: sortJobs([...myJobs]),
      otherJobs: sortJobs([...otherJobs])
    };
  }, [internalJobs, externalJobs, sortByLocation, coordinates, user]);

  // Combine all jobs with user's jobs first
  const allJobs = useMemo(() => {
    return [...myJobs, ...otherJobs];
  }, [myJobs, otherJobs]);

  const isLoading = isLoadingInternal || isLoadingExternal;

  const handlePostAJobClick = () => {
    if (user) {
        setCreateDialogOpen(true);
    } else {
        router.push('/login?redirect=/jobs');
    }
  };

  const handleLocationEnabled = () => {
    setShowLocationBanner(false);
    setSortByLocation(true);
  };

  const handleLocationDenied = () => {
    setShowLocationBanner(false);
    setSortByLocation(false);
  };

  const handleLocationChange = () => {
    // Location will be updated automatically by the hook
    toast({
      title: 'Location Updated',
      description: 'Jobs are being sorted by your new location.',
    });
  };

  const renderJobGrid = (jobs: JobPosting[] | undefined, loading: boolean, showMyJobsSection: boolean = false) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      );
    }

    if (showMyJobsSection && myJobs.length > 0) {
      return (
        <>
          {/* My Jobs Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-bold">My Posted Jobs</h2>
              <Badge className="bg-primary">{myJobs.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-muted/30 rounded-lg border-2 border-primary/20">
              {myJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>

          {/* Other Jobs Section */}
          {otherJobs.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-bold">All Jobs</h2>
                <Badge variant="secondary">{otherJobs.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </>
          )}
        </>
      );
    }

    // Default rendering for tabs without my jobs section
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs?.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
        {jobs && jobs.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No jobs found.</h3>
            <p className="text-muted-foreground mt-2">Check back later for new opportunities!</p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-muted/30">
            <div className="container text-center py-20">
                <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl">
                    Explore Job Openings
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                    Find your next career opportunity from thousands of listings across LinkedIn, Naukri.com, and more.
                </p>
                <Button onClick={handlePostAJobClick} className="mt-6" size="lg">
                    <PlusCircle className="mr-2" />
                    Post a Job
                </Button>
            </div>
        </section>
        <div className="container py-12">

          {/* Location Indicator */}
          {sortByLocation && coordinates && (
            <div className="flex justify-between items-center mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Showing jobs near you</p>
                  <p className="text-xs text-muted-foreground">{locationString}</p>
                </div>
              </div>
              <LocationIndicator onLocationChange={handleLocationChange} />
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full max-w-${user && myJobs.length > 0 ? '3xl' : 'md'} mx-auto grid-cols-${user && myJobs.length > 0 ? '5' : '4'} mb-8`}>
              {user && myJobs.length > 0 && (
                <TabsTrigger value="my-jobs" className="font-semibold">
                  My Jobs ({myJobs.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="all">
                All ({allJobs.length})
              </TabsTrigger>
              <TabsTrigger value="linkedin">
                LinkedIn ({linkedInJobs?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="naukri">
                Naukri ({naukriJobs?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="internal">
                Internal ({internalJobs?.length || 0})
              </TabsTrigger>
            </TabsList>
            
            {user && myJobs.length > 0 && (
              <TabsContent value="my-jobs">
                {renderJobGrid(myJobs, isLoading, false)}
              </TabsContent>
            )}
            
            <TabsContent value="all">
              {renderJobGrid(allJobs, isLoading, user && myJobs.length > 0)}
            </TabsContent>
            
            <TabsContent value="linkedin">
              {renderJobGrid(linkedInJobs, isLoadingLinkedIn)}
            </TabsContent>
            
            <TabsContent value="naukri">
              {renderJobGrid(naukriJobs, isLoadingNaukri)}
            </TabsContent>
            
            <TabsContent value="internal">
              {renderJobGrid(internalJobs, isLoadingInternal)}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <SiteFooter />
      <CreateJobPostingDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
      
      {/* Location Permission Banner */}
      {showLocationBanner && !coordinates && !permissionDenied && (
        <LocationBanner
          onLocationEnabled={handleLocationEnabled}
          onLocationDenied={handleLocationDenied}
        />
      )}
      <ChatBot />
    </div>
  );
}
