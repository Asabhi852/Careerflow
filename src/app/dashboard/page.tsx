'use client';

import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc as useSingleDoc } from '@/firebase';
// @ts-ignore - Firebase Firestore import issue
import { doc, collection, query, where, documentId } from 'firebase/firestore';
import { EnhancedProfileForm } from '@/components/dashboard/enhanced-profile-form';
import { useDoc } from '@/firebase/firestore/use-doc';
import type { UserProfile, JobPosting } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { JobCard, JobCardSkeleton } from '@/components/jobs/job-card';
// @ts-ignore - Lucide icons import issue
import { Briefcase } from 'lucide-react';


function SavedJobsSection({ userProfile }: { userProfile: UserProfile }) {
  const firestore = useFirestore();

  const savedJobsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile.savedJobIds || userProfile.savedJobIds.length === 0) return null;
    return query(collection(firestore, 'job_postings'), where(documentId(), 'in', userProfile.savedJobIds));
  }, [firestore, userProfile.savedJobIds]);

  const { data: savedJobs, isLoading } = useCollection<JobPosting>(savedJobsQuery);

  if (!userProfile.savedJobIds || userProfile.savedJobIds.length === 0) {
    return null; // Don't render the section if there are no saved jobs
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Briefcase /> Saved Jobs
        </CardTitle>
        <CardDescription>
          Jobs you've saved for later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <JobCardSkeleton />
            <JobCardSkeleton />
          </div>
        )}
        {savedJobs && savedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedJobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        ) : !isLoading && (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No Saved Jobs</h3>
            <p className="text-muted-foreground mt-2">
              You haven't saved any jobs yet. Start exploring!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

  return (
    <div className="grid gap-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">
        My Profile
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Keep your profile up to date to attract the best opportunities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !userProfile && (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          )}
          {userProfile && <EnhancedProfileForm userProfile={userProfile} />}
        </CardContent>
      </Card>
      {userProfile && <SavedJobsSection userProfile={userProfile} />}
    </div>
  );
}
