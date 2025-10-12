'use client';

import { useState } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { JobCard, JobCardSkeleton } from '@/components/jobs/job-card';
import { CreateJobPostingDialog } from '@/components/jobs/create-job-dialog';
import type { JobPosting } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function JobsPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'job_postings'), orderBy('title'));
  }, [firestore]);

  const { data: jobs, isLoading } = useCollection<JobPosting>(jobsQuery);

  return (
    <div className="grid gap-6">
       <div className="flex items-center justify-between">
         <h1 className="font-headline text-3xl font-bold tracking-tight">
            Job Openings
        </h1>
        {user && (
            <Button onClick={() => setCreateDialogOpen(true)}>
                <PlusCircle className="mr-2" />
                Post a Job
            </Button>
        )}
       </div>
      <Card>
        <CardHeader>
          <CardTitle>Explore Opportunities</CardTitle>
          <CardDescription>
            Find your next career move from the listings below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading && Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
            {jobs?.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          {jobs && jobs.length === 0 && !isLoading && (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-semibold">No jobs posted yet.</h3>
                <p className="text-muted-foreground mt-2">Be the first one to post a job!</p>
            </div>
          )}
        </CardContent>
      </Card>
      <CreateJobPostingDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
