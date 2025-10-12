'use client';
// @ts-ignore - React hooks import issue
import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { JobPosting, UserProfile } from '@/lib/types';
// @ts-ignore - Lucide icons import issue
import { Briefcase, MapPin, DollarSign, Bookmark, FolderKanban } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
// @ts-ignore - Firebase Firestore import issue
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
        if (!userProfileRef) return;
        
        try {
            await updateDoc(userProfileRef, {
                savedJobIds: isSaved ? arrayRemove(jobId) : arrayUnion(jobId)
            });
            toast({
                title: isSaved ? 'Job Unsaved' : 'Job Saved',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not update saved jobs.',
            });
        }
    };
    
    return (
        <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={handleSaveToggle}>
            <Bookmark className={cn("h-5 w-5", isSaved && "fill-current text-primary")} />
            <span className="sr-only">{isSaved ? 'Unsave job' : 'Save job'}</span>
        </Button>
    )
}


export function JobCard({ job }: { job: JobPosting }) {
  return (
    <Card className="flex flex-col relative">
       <SaveJobButton jobId={job.id} />
      <CardHeader>
        <CardTitle className="font-headline hover:text-primary transition-colors pr-10">
            <Link href={`/jobs/${job.id}`}>{job.title}</Link>
        </CardTitle>
        <CardDescription className="flex flex-col gap-2 pt-2">
            <span className="flex items-center gap-2"><Briefcase /> {job.company}</span>
            <span className="flex items-center gap-2"><MapPin /> {job.location}</span>
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
        <Button asChild className="w-full">
            <Link href={`/jobs/${job.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}


export function JobCardSkeleton() {
    return (
      <Card>
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
