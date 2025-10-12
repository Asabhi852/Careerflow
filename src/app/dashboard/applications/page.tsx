'use client';

import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import type { Application } from '@/lib/types';

const statusVariant: { [key: string]: 'default' | 'secondary' | 'outline' | 'destructive' } = {
  submitted: 'secondary',
  reviewed: 'default',
  interviewing: 'outline',
  offered: 'default', // would be green in a real app
  rejected: 'destructive',
};

const statusColors: { [key: string]: string } = {
  offered: 'bg-green-500 hover:bg-green-600',
};


export default function ApplicationsPage() {
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
  }

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({length: 3}).map((_, i) => (
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

          {!isLoading && applications && applications.length > 0 ? (
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
