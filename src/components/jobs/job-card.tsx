'use client';
// @ts-ignore - React hooks import issue
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { JobPosting, UserProfile } from '@/lib/types';
// @ts-ignore - Lucide icons import issue
import { Briefcase, MapPin, DollarSign, Bookmark, FolderKanban, ExternalLink, Trash2, Navigation } from 'lucide-react';
import { formatDistance } from '@/lib/geolocation';
import { Skeleton } from '../ui/skeleton';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
// @ts-ignore - Firebase Firestore import issue
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

function SaveJobButton({ jobId }: { jobId: string }) {
    const { user } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const isSaved = useMemo(() => {
        return userProfile?.savedJobIds?.includes(jobId) ?? false;
    }, [userProfile, jobId]);

    if (!user) return null;

    const handleSaveToggle = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent link navigation
        if (!userProfileRef || !firestore || !user) return;

        try {
            const updateData = {
                savedJobIds: isSaved ? arrayRemove(jobId) : arrayUnion(jobId)
            };

            // Update both users and public_profiles collections
            // Use setDoc with merge to create document if it doesn't exist
            // @ts-ignore - Firebase setDoc import
            const { setDoc } = await import('firebase/firestore');

            await setDoc(userProfileRef, updateData, { merge: true });

            const publicProfileRef = doc(firestore, 'public_profiles', user.uid);
            await setDoc(publicProfileRef, updateData, { merge: true });

            toast({
                title: isSaved ? 'Job Unsaved' : 'Job Saved',
                description: isSaved ? 'Removed from your saved jobs' : 'Added to your saved jobs',
            });
        } catch (error) {
            console.error('Error updating saved jobs:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not update saved jobs. Please try again.',
            });
        }
    };
    
    return (
        <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={handleSaveToggle}>
            <Bookmark className={cn("h-5 w-5", isSaved && "fill-current text-primary")} />
            <span className="sr-only">{isSaved ? 'Unsave job' : 'Save job'}</span>
        </Button>
    );
}

function DeleteJobButton({ jobId, onDeleted }: { jobId: string; onDeleted?: () => void }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    if (!user || !firestore) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const jobRef = doc(firestore, 'job_postings', jobId);
            await deleteDoc(jobRef);
            toast({
                title: 'Job Deleted',
                description: 'The job posting has been successfully removed.',
            });
            setShowDeleteDialog(false);
            if (onDeleted) {
                onDeleted();
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete the job posting.',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-12"
                onClick={(e) => {
                    e.preventDefault();
                    setShowDeleteDialog(true);
                }}
            >
                <Trash2 className="h-5 w-5 text-destructive" />
                <span className="sr-only">Delete job</span>
            </Button>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    {/* @ts-ignore - AlertDialog children prop */}
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Job Posting?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the job posting
                            and remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {/* @ts-ignore - AlertDialog children prop */}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export function JobCard({ job, onDeleted }: { job: JobPosting; onDeleted?: () => void }) {
  const { user } = useUser();
  const isExternalJob = job.source && job.source !== 'internal';
  const isOwnJob = user && job.posterId === user.uid;

  return (
    <Card className="flex flex-col relative border shadow-sm hover:shadow-md transition-shadow">
       <SaveJobButton jobId={job.id} />
       {isOwnJob && !isExternalJob && <DeleteJobButton jobId={job.id} onDeleted={onDeleted} />}
      <CardHeader>
        <div className="flex items-start justify-between pr-10">
          <CardTitle className="font-headline hover:text-primary transition-colors flex-1">
            {isExternalJob && job.externalUrl ? (
              <a href={job.externalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                {job.title}
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <Link href={`/jobs/${job.id}`}>{job.title}</Link>
            )}
          </CardTitle>
        </div>
        <CardDescription className="flex flex-col gap-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2"><Briefcase /> {job.company}</span>
              {job.source && job.source !== 'internal' && (
                // @ts-ignore - Badge children prop
                <Badge variant="outline" className="text-xs capitalize">{job.source}</Badge>
              )}
            </div>
            <span className="flex items-center gap-2"><MapPin /> {job.location}</span>
            {job.distance !== undefined && (
              <span className="flex items-center gap-2 text-primary">
                <Navigation className="h-4 w-4" /> {formatDistance(job.distance)}
              </span>
            )}
            {job.salary && <span className="flex items-center gap-2"><DollarSign/> {job.salary.toLocaleString()}</span>}
            {job.category && <span className="flex items-center gap-2 capitalize"><FolderKanban /> {job.category}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {job.description}
        </p>
      </CardContent>
      <CardFooter className="flex-col items-start gap-4">
        {job.skills && job.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
            {job.skills.slice(0, 3).map((skill) => (
                // @ts-ignore - Badge children prop
                <Badge key={skill} variant="secondary">{skill}</Badge>
            ))}
            {/* @ts-ignore - Badge children prop */}
            {job.skills.length > 3 && <Badge variant="outline">+{job.skills.length - 3}</Badge>}
            </div>
        )}
        {isExternalJob && job.externalUrl ? (
          <Button asChild className="w-full">
            <a href={job.externalUrl} target="_blank" rel="noopener noreferrer">
              View on {job.source === 'linkedin' ? 'LinkedIn' : job.source === 'naukri' ? 'Naukri.com' : 'External Site'}
            </a>
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href={`/jobs/${job.id}`}>View Details</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}


export function JobCardSkeleton() {
    return (
      <Card className="border shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <div className='flex flex-col gap-2 pt-4'>
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full mt-2" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </CardContent>
        <CardFooter className="flex-col items-start gap-4">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    )
  }
