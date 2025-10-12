'use client';

import { useState } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Button } from '@/components/ui/button';
import { JobCard, JobCardSkeleton } from '@/components/jobs/job-card';
import { CreateJobPostingDialog } from '@/components/jobs/create-job-dialog';
import type { JobPosting } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function JobsPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'job_postings'), orderBy('title'));
  }, [firestore]);

  const { data: jobs, isLoading } = useCollection<JobPosting>(jobsQuery);

  const handlePostAJobClick = () => {
    if (user) {
        setCreateDialogOpen(true);
    } else {
        router.push('/login?redirect=/jobs');
    }
  }

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
                    Find your next career opportunity from thousands of listings. Your dream job is just a click away.
                </p>
                <Button onClick={handlePostAJobClick} className="mt-6" size="lg">
                    <PlusCircle className="mr-2" />
                    Post a Job
                </Button>
            </div>
        </section>
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading && Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
            {jobs?.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          {jobs && jobs.length === 0 && !isLoading && (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-semibold">No jobs posted yet.</h3>
                <p className="text-muted-foreground mt-2">Check back later or be the first to post a job!</p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
      <CreateJobPostingDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
