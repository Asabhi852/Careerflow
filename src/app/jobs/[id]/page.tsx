'use client';

import { use, useMemo, useState } from 'react';
import { doc, collection, addDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { useFirestore, useDoc, useUser, useMemoFirebase, useDoc as useUserProfile } from '@/firebase';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { JobPosting, UserProfile } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Briefcase, MapPin, DollarSign, BrainCircuit, CheckCircle, Loader2, Bookmark, FolderKanban, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';


export default function JobDetailPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isApplying, setIsApplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  
  const { data: userProfile } = useUserProfile<UserProfile>(userProfileRef);

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !resolvedParams.id) return null;
    return doc(firestore, 'job_postings', resolvedParams.id);
  }, [firestore, resolvedParams.id]);

  const { data: job, isLoading } = useDoc<JobPosting>(jobRef);
  
  const isSaved = useMemo(() => {
    return userProfile?.savedJobIds?.includes(resolvedParams.id) ?? false;
  }, [userProfile, resolvedParams.id]);

  const isOwner = useMemo(() => {
    return user?.uid === job?.posterId;
  }, [user, job]);


  const handleApply = async () => {
    if (!user || !firestore || !job) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to apply.',
      });
      return;
    }
    
    setIsApplying(true);

    const applicationData = {
      jobPostingId: job.id,
      applicantId: user.uid,
      jobTitle: job.title,
      company: job.company,
      applicationDate: serverTimestamp(),
      status: 'submitted',
    };

    try {
      const applicationsCollection = collection(firestore, 'applications');
      await addDoc(applicationsCollection, applicationData).catch(error => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: applicationsCollection.path,
            operation: 'create',
            requestResourceData: applicationData,
          })
        );
        throw error;
      });

      toast({
        title: 'Application Submitted!',
        description: `You've successfully applied for the ${job.title} position.`,
        action: <CheckCircle className="text-green-500" />,
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        variant: 'destructive',
        title: 'Application Failed',
        description: 'There was an error submitting your application. Please try again.',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveToggle = async () => {
    if (!userProfileRef) return;

    try {
      await updateDoc(userProfileRef, {
        savedJobIds: isSaved ? arrayRemove(resolvedParams.id) : arrayUnion(resolvedParams.id)
      });
       toast({
        title: isSaved ? 'Job Unsaved' : 'Job Saved',
        description: isSaved ? 'Removed from your saved jobs.' : 'This job has been saved to your profile.',
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update your saved jobs.',
      });
    }
  };
  
  const handleDelete = async () => {
    if (!jobRef) return;
    setIsDeleting(true);
    try {
        await deleteDoc(jobRef);
        toast({
            title: 'Job Deleted',
            description: 'The job posting has been successfully removed.',
        });
        router.push('/jobs');
    } catch(error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not delete the job posting. Please try again.',
        });
        setIsDeleting(false);
    }
  }


  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 py-12">
        <div className="container">
          <Button variant="ghost" asChild className="mb-8">
            <Link href="/jobs">
              <ArrowLeft className="mr-2" />
              Back to Jobs
            </Link>
          </Button>

          {isLoading && (
            <Card>
              <CardHeader>
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/4 mt-2" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </CardContent>
              <CardFooter>
                 <Skeleton className="h-10 w-32" />
              </CardFooter>
            </Card>
          )}

          {job && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-4xl">{job.title}</CardTitle>
                <CardDescription className="text-lg flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                  <span className="flex items-center gap-2"><Briefcase /> {job.company}</span>
                  <span className="flex items-center gap-2"><MapPin /> {job.location}</span>
                  {job.salary && <span className="flex items-center gap-2"><DollarSign /> {job.salary.toLocaleString()}</span>}
                  {job.category && <span className="flex items-center gap-2 capitalize"><FolderKanban /> {job.category}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 mt-4">
                <div>
                    <h3 className="font-semibold text-xl mb-2">Job Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                </div>

                {job.skills && job.skills.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-xl mb-3 flex items-center gap-2"><BrainCircuit /> Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                        ))}
                        </div>
                    </div>
                )}

              </CardContent>
              <CardFooter className="flex items-center gap-4">
                <Button size="lg" onClick={handleApply} disabled={!user || isApplying || isUserLoading}>
                  {isApplying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    'Apply Now'
                  )}
                </Button>
                {user && (
                  <Button size="lg" variant="outline" onClick={handleSaveToggle}>
                     <Bookmark className={cn("mr-2", isSaved && "fill-current")} />
                    {isSaved ? 'Saved' : 'Save'}
                  </Button>
                )}
                 {isOwner && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="lg" variant="destructive">
                                <Trash2 className="mr-2" /> Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this job posting.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Continue
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 )}
              </CardFooter>
            </Card>
          )}
           {!job && !isLoading && (
             <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <h3 className="text-2xl font-semibold">Job not found</h3>
                <p className="text-muted-foreground mt-2">This job posting may have been removed.</p>
            </div>
           )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
