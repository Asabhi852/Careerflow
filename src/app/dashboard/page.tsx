'use client';

// @ts-ignore - React hooks import issue
import { useMemo } from 'react';
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc as useSingleDoc } from '@/firebase';
// @ts-ignore - Firebase Firestore import issue
import { doc, collection, query, where, documentId, orderBy, Timestamp } from 'firebase/firestore';
import { EnhancedProfileForm } from '@/components/dashboard/enhanced-profile-form';
import { ResumeParser } from '@/components/resume/resume-parser';
import { useDoc } from '@/firebase/firestore/use-doc';
import type { UserProfile, JobPosting, Application } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { JobCard, JobCardSkeleton } from '@/components/jobs/job-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
// @ts-ignore - Lucide icons import issue
import { Briefcase, FileText, TrendingUp, Users, CheckCircle, Clock, XCircle, Eye, ArrowRight, BarChart3, Target } from 'lucide-react';
import { ResumeBasedJobRecommendations } from '@/components/ai-matches/resume-based-job-recommendations';
import { EnhancedCareerDevelopment } from '@/components/ai-matches/enhanced-career-development';

const statusVariant: { [key: string]: 'default' | 'secondary' | 'outline' | 'destructive' } = {
  submitted: 'secondary',
  reviewed: 'default',
  interviewing: 'outline',
  offered: 'default',
  rejected: 'destructive',
};

const statusColors: { [key: string]: string } = {
  offered: 'bg-green-500 hover:bg-green-600',
};

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
    <Card>
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

function AppliedJobsSection() {
  const { user } = useUser();
  const firestore = useFirestore();

  const applicationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'applications'),
      where('applicantId', '==', user.uid),
      orderBy('applicationDate', 'desc')
    );
  }, [firestore, user]);

  const { data: applications, isLoading } = useCollection<Application>(applicationsQuery);

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
  };

  if (!isLoading && (!applications || applications.length === 0)) {
    return null; // Don't render if no applications
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText /> Applied Jobs
        </CardTitle>
        <CardDescription>
          Track your job applications and their status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Date Applied</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!isLoading && applications && applications.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Date Applied</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.jobTitle}</TableCell>
                  <TableCell>{app.company}</TableCell>
                  <TableCell>{formatDate(app.applicationDate)}</TableCell>
                  <TableCell className="text-right">
                    {/* @ts-ignore - Badge children prop */}
                    <Badge
                      variant={statusVariant[app.status] || 'default'}
                      className={`capitalize ${statusColors[app.status] || ''}`}
                    >
                      {app.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}


function DashboardStats({ applications, savedJobsCount }: { applications: Application[] | undefined, savedJobsCount: number }) {
  const stats = useMemo(() => {
    if (!applications) return { total: 0, pending: 0, interviewing: 0, offered: 0, rejected: 0 };
    
    return {
      total: applications.length,
      pending: applications.filter(a => a.status === 'submitted' || a.status === 'reviewed').length,
      interviewing: applications.filter(a => a.status === 'interviewing').length,
      offered: applications.filter(a => a.status === 'offered').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
    };
  }, [applications]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {savedJobsCount} jobs saved
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pending}</div>
          <p className="text-xs text-muted-foreground">
            Pending review
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Interviewing</CardTitle>
          <Users className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.interviewing}</div>
          <p className="text-xs text-muted-foreground">
            Active interviews
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Offers Received</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.offered}</div>
          <p className="text-xs text-muted-foreground">
            {stats.rejected} rejected
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickActions({ userType }: { userType?: string }) {
  const isJobSeeker = userType === 'job_seeker';
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Get started with these common tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {isJobSeeker ? (
          <>
            <Button asChild className="w-full justify-between">
              <Link href="/jobs">
                <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Browse Jobs
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/ai-matches">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  AI Job Matches
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/dashboard/messages">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Messages
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild className="w-full justify-between">
              <Link href="/post-job">
                <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Post a Job
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/candidates">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Find Candidates
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/dashboard/messages">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Manage Applications
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);
  
  // Get applications for stats
  const applicationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'applications'),
      where('applicantId', '==', user.uid),
      orderBy('applicationDate', 'desc')
    );
  }, [firestore, user]);

  const { data: applications } = useCollection<Application>(applicationsQuery);
  
  // Fallback profile so the form renders for all users even if no profile doc exists
  const fallbackProfile: UserProfile | null = user ? {
    id: user.uid,
    firstName: (user.displayName && user.displayName.split(' ')[0]) || '',
    lastName: (user.displayName && user.displayName.split(' ').slice(1).join(' ')) || '',
    email: user.email || '',
  } : null;

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Welcome back{userProfile?.firstName ? `, ${userProfile.firstName}` : ''}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your job search today.
          </p>
        </div>
      </div>
      
      {/* Stats Overview */}
      <DashboardStats 
        applications={applications} 
        savedJobsCount={userProfile?.savedJobIds?.length || 0}
      />
      
      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="resume">Resume Parser</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Applied Jobs Section */}
              <AppliedJobsSection />
              
              {/* Saved Jobs Section */}
              {userProfile && <SavedJobsSection userProfile={userProfile} />}
              
              {/* Empty State */}
              {!applications || applications.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Start Your Job Search</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                      You haven't applied to any jobs yet. Browse our job listings and find your dream role!
                    </p>
                    <Button asChild>
                      <Link href="/jobs">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Browse Jobs
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="profile" className="space-y-6">
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
                  {(userProfile || fallbackProfile) && (
                    <EnhancedProfileForm userProfile={(userProfile || fallbackProfile)!} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="resume">
              <ResumeParser />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          <QuickActions userType={userProfile?.userType} />
          
          {/* Profile Completion */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Profile Strength</span>
                  <span className="font-bold">
                    {userProfile ? Math.min(100, (
                      (userProfile.firstName ? 15 : 0) +
                      (userProfile.lastName ? 15 : 0) +
                      (userProfile.bio ? 20 : 0) +
                      (userProfile.skills?.length ? 20 : 0) +
                      (userProfile.location ? 10 : 0) +
                      (userProfile.profilePictureUrl ? 20 : 0)
                    )) : 0}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all" 
                    style={{ 
                      width: `${userProfile ? Math.min(100, (
                        (userProfile.firstName ? 15 : 0) +
                        (userProfile.lastName ? 15 : 0) +
                        (userProfile.bio ? 20 : 0) +
                        (userProfile.skills?.length ? 20 : 0) +
                        (userProfile.location ? 10 : 0) +
                        (userProfile.profilePictureUrl ? 20 : 0)
                      )) : 0}%` 
                    }}
                  />
                </div>
                <div className="space-y-1 mt-4">
                  {!userProfile?.bio && (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <XCircle className="h-3 w-3" /> Add a bio (+20%)
                    </p>
                  )}
                  {!userProfile?.skills?.length && (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <XCircle className="h-3 w-3" /> Add skills (+20%)
                    </p>
                  )}
                  {!userProfile?.profilePictureUrl && (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <XCircle className="h-3 w-3" /> Upload profile picture (+20%)
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resume-Based Job Recommendations */}
          <ResumeBasedJobRecommendations />

          {/* Enhanced Career Development */}
          <EnhancedCareerDevelopment />
        </div>
      </div>
    </div>
  );
}
