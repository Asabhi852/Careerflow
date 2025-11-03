'use client';
// @ts-ignore - React hooks import issue
import { useState, useMemo } from 'react';
// @ts-ignore - Firebase Firestore import issue
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { JobCard, JobCardSkeleton } from '@/components/jobs/job-card';
import { CreateJobPostingDialog } from '@/components/jobs/create-job-dialog';
import type { JobPosting } from '@/lib/types';
// @ts-ignore - Lucide icons import issue
import { PlusCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExternalJobs } from '@/hooks/use-external-jobs';
import { Badge } from '@/components/ui/badge';

export default function JobsPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'internal' | 'linkedin' | 'naukri'>('all');
  const firestore = useFirestore();
  const { user } = useUser();

  // Fetch internal jobs from Firestore
  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'job_postings'), orderBy('title'));
  }, [firestore]);

  const { data: internalJobs, isLoading: isLoadingInternal } = useCollection<JobPosting>(jobsQuery);

  // Fetch external jobs from LinkedIn and Naukri
  const { 
    jobs: externalJobs, 
    isLoading: isLoadingExternal, 
    error: externalError,
    refetch: refetchExternal 
  } = useExternalJobs({
    source: activeTab === 'all' ? 'all' : activeTab === 'internal' ? 'all' : activeTab,
    enabled: activeTab !== 'internal'
  });

  // Separate user's jobs and other jobs, then combine based on active tab
  const { myJobs, displayedJobs } = useMemo(() => {
    const internal = (internalJobs || []).map(job => ({ ...job, source: 'internal' as const }));
    
    let jobsToDisplay: JobPosting[] = [];
    
    switch (activeTab) {
      case 'internal':
        jobsToDisplay = internal;
        break;
      case 'linkedin':
        jobsToDisplay = externalJobs.filter(job => job.source === 'linkedin');
        break;
      case 'naukri':
        jobsToDisplay = externalJobs.filter(job => job.source === 'naukri');
        break;
      case 'all':
      default:
        jobsToDisplay = [...internal, ...externalJobs];
    }
    
    // Separate jobs posted by current user
    const myJobs = user ? jobsToDisplay.filter(job => job.posterId === user.uid) : [];
    const otherJobs = user ? jobsToDisplay.filter(job => job.posterId !== user.uid) : jobsToDisplay;
    
    // Put user's jobs first
    return {
      myJobs,
      displayedJobs: [...myJobs, ...otherJobs]
    };
  }, [internalJobs, externalJobs, activeTab, user]);

  const isLoading = activeTab === 'internal' ? isLoadingInternal : isLoadingInternal || isLoadingExternal;

  return (
    <div className="grid gap-6">
       <div className="flex items-center justify-between">
         <div>
           <h1 className="font-headline text-3xl font-bold tracking-tight">
              Job Openings
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse jobs from multiple sources including LinkedIn and Naukri.com
          </p>
         </div>
        {user && (
            <Button onClick={() => setCreateDialogOpen(true)}>
                <PlusCircle className="mr-2" />
                Post a Job
            </Button>
        )}
       </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">
              All Jobs
              {displayedJobs.length > 0 && (
                // @ts-ignore - Badge children prop
                <Badge variant="secondary" className="ml-2">{displayedJobs.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="internal">
              Internal
              {internalJobs && internalJobs.length > 0 && (
                // @ts-ignore - Badge children prop
                <Badge variant="secondary" className="ml-2">{internalJobs.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="linkedin">
              LinkedIn
              {externalJobs.filter(j => j.source === 'linkedin').length > 0 && (
                // @ts-ignore - Badge children prop
                <Badge variant="secondary" className="ml-2">
                  {externalJobs.filter(j => j.source === 'linkedin').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="naukri">
              Naukri.com
              {externalJobs.filter(j => j.source === 'naukri').length > 0 && (
                // @ts-ignore - Badge children prop
                <Badge variant="secondary" className="ml-2">
                  {externalJobs.filter(j => j.source === 'naukri').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {activeTab !== 'internal' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetchExternal}
              disabled={isLoadingExternal}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingExternal ? 'animate-spin' : ''}`} />
              Refresh External Jobs
            </Button>
          )}
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'all' && 'All Job Opportunities'}
                {activeTab === 'internal' && 'Internal Job Postings'}
                {activeTab === 'linkedin' && 'LinkedIn Jobs'}
                {activeTab === 'naukri' && 'Naukri.com Jobs'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'all' && 'Browse jobs from all available sources'}
                {activeTab === 'internal' && 'Jobs posted on our platform'}
                {activeTab === 'linkedin' && 'Latest opportunities from LinkedIn'}
                {activeTab === 'naukri' && 'Latest opportunities from Naukri.com'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {externalError && activeTab !== 'internal' && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-4">
                  <p className="font-semibold">Error loading external jobs</p>
                  <p className="text-sm">{externalError}</p>
                </div>
              )}
              
              {/* Show user's jobs first in a highlighted section */}
              {!isLoading && myJobs.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold">My Posted Jobs</h3>
                    <Badge className="bg-primary">{myJobs.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                    {myJobs.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                  {displayedJobs.length > myJobs.length && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Other Jobs</h3>
                    </div>
                  )}
                </div>
              )}
              
              {/* Show other jobs or all jobs if user hasn't posted any */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading && Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
                {!isLoading && displayedJobs.filter(job => job.posterId !== user?.uid).map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
              
              {displayedJobs.length === 0 && !isLoading && (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">No jobs found.</h3>
                    <p className="text-muted-foreground mt-2">
                      {activeTab === 'internal' 
                        ? 'Be the first one to post a job!' 
                        : 'Try refreshing or check back later.'}
                    </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateJobPostingDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
