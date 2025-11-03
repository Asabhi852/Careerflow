'use client';

import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Undo2 } from 'lucide-react';
import type { Application } from '@/lib/types';

const statusVariant: { [key: string]: 'default' | 'secondary' | 'outline' | 'destructive' } = {
  submitted: 'secondary',
  reviewed: 'default',
  interviewing: 'outline',
  offered: 'default', // would be green in a real app
  rejected: 'destructive',
  withdrawn: 'outline',
};

const statusColors: { [key: string]: string } = {
  offered: 'bg-green-500 hover:bg-green-600',
  withdrawn: 'bg-gray-500 hover:bg-gray-600',
};


export default function ApplicationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

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
  }

  // Check if application can be withdrawn
  const canWithdraw = (status: string) => {
    return ['submitted', 'reviewed'].includes(status);
  };

  // Handle application withdrawal
  const handleWithdrawApplication = async (applicationId: string) => {
    if (!firestore || !applicationId) return;

    try {
      // Find the application to get job details
      const applicationsData = applications?.find(app => app.id === applicationId);
      if (!applicationsData) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Application not found.',
        });
        return;
      }

      const applicationRef = doc(firestore, 'applications', applicationId);
      await updateDoc(applicationRef, {
        status: 'withdrawn',
        withdrawnDate: Timestamp.now(),
      });

      toast({
        title: 'Application Withdrawn',
        description: 'Your application has been successfully withdrawn.',
      });

      // Send notification to job poster about the withdrawal
      try {
        // Get job details to find the poster
        const jobRef = doc(firestore, 'job_postings', applicationsData.jobPostingId);
        const jobSnap = await getDoc(jobRef);
        
        if (jobSnap.exists() && jobSnap.data()?.posterId) {
          const jobData = jobSnap.data();
          const posterId = jobData.posterId;
          
          // Get applicant name for notification
          const applicantProfileRef = doc(firestore, 'users', user.uid);
          const applicantSnap = await getDoc(applicantProfileRef);
          const applicantData = applicantSnap.data();
          const applicantName = applicantData?.firstName && applicantData?.lastName 
            ? `${applicantData.firstName} ${applicantData.lastName}`
            : user.displayName || user.email || 'A candidate';

          // Import and send withdrawal notification
          const { notifyApplicationWithdrawn } = await import('@/lib/notifications');
          await notifyApplicationWithdrawn(firestore, posterId, {
            candidateId: user.uid,
            candidateName: applicantName,
            jobId: applicationsData.jobPostingId,
            jobTitle: applicationsData.jobTitle,
            applicationId: applicationId,
          });
        }
      } catch (notificationError) {
        // Don't show error to user if notification fails, just log it
        console.warn('Failed to send withdrawal notification:', notificationError);
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast({
        variant: 'destructive',
        title: 'Withdrawal Failed',
        description: 'There was an error withdrawing your application. Please try again.',
      });
    }
  };

  return (
    <div className="grid gap-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">
        My Applications
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Application Tracking</CardTitle>
          <CardDescription>
            Keep track of all your job applications in one place.
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({length: 3}).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 rounded" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && applications && applications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Date Applied</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.jobTitle}</TableCell>
                    <TableCell>{app.company}</TableCell>
                    <TableCell>{formatDate(app.applicationDate)}</TableCell>
                    <TableCell className="text-right">
                       <Badge 
                          variant={statusVariant[app.status] || 'default'} 
                          className={`capitalize ${statusColors[app.status] || ''}`}
                        >
                          {app.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canWithdraw(app.status) ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Undo2 className="h-4 w-4 mr-1" />
                              Withdraw
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Withdraw Application</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to withdraw your application for <strong>{app.jobTitle}</strong> at <strong>{app.company}</strong>? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleWithdrawApplication(app.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Withdraw Application
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {app.status === 'withdrawn' ? 'Withdrawn' : 
                           app.status === 'rejected' ? 'Cannot withdraw' :
                           app.status === 'offered' ? 'Accepted offer' : 'In progress'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
          
          {!isLoading && (!applications || applications.length === 0) && (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
              <h3 className="text-xl font-semibold">No Applications Yet</h3>
              <p className="text-muted-foreground mt-2">
                Once you start applying for jobs, they will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
