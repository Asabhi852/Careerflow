'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Briefcase, MessageSquare, UserCheck, CheckCircle2, FileText, Building2, MapPin, DollarSign } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { getNotificationIcon, getNotificationColor, markNotificationAsRead } from '@/lib/notifications';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const iconMap: { [key: string]: React.ReactNode } = {
  'profile_view': <UserCheck className="h-5 w-5" />,
  'new_message': <MessageSquare className="h-5 w-5" />,
  'application_update': <Briefcase className="h-5 w-5" />,
  'new_job_posted': <FileText className="h-5 w-5" />,
  'application': <Briefcase className="h-5 w-5" />,
};

export default function NotificationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Ensure this only runs on client to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  const notificationsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !isClient) return null;
    return query(collection(firestore, 'users', user.uid, 'notifications'), orderBy('timestamp', 'desc'));
  }, [user, firestore, isClient]);

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!user || !firestore) return;
    
    // Mark as read
    if (!notification.read) {
      await markNotificationAsRead(firestore, user.uid, notification.id);
    }

    // Navigate based on notification type
    if (notification.data?.jobId) {
      router.push(`/jobs/${notification.data.jobId}`);
    } else if (notification.data?.applicationId) {
      router.push(`/dashboard/applications`);
    } else if (notification.data?.conversationId) {
      router.push(`/dashboard/messages`);
    } else if (notification.data?.candidateId) {
      router.push(`/candidates/${notification.data.candidateId}`);
    }
  }

  const renderNotificationDetails = (notification: Notification) => {
    const { data } = notification;
    
    if (!data) return null;

    return (
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        {data.jobId && (
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>Job ID: {data.jobId.substring(0, 8)}...</span>
          </div>
        )}
        {data.posterId && (
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            <span>Posted by: {data.posterId.substring(0, 8)}...</span>
          </div>
        )}
        {data.candidateId && (
          <div className="flex items-center gap-1">
            <UserCheck className="h-3 w-3" />
            <span>Candidate: {data.candidateId.substring(0, 8)}...</span>
          </div>
        )}
        {data.applicationStatus && (
          <Badge variant="outline" className="mt-1">
            Status: {data.applicationStatus}
          </Badge>
        )}
      </div>
    );
  }

  // Show loading skeleton until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="grid gap-6">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Notifications
        </h1>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({length: 3}).map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">
        Notifications
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Stay Updated</CardTitle>
          <CardDescription>
            Here are your latest notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4">
              {Array.from({length: 3}).map((_, i) => (
                 <div key={i} className="flex items-start gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && notifications && notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((note) => (
                <div 
                  key={note.id} 
                  className={`flex items-start gap-4 p-4 rounded-lg transition-colors cursor-pointer hover:bg-muted/30 ${
                    !note.read ? 'bg-muted/50 border-l-4 border-l-blue-600' : 'bg-transparent'
                  }`}
                  onClick={() => handleNotificationClick(note)}
                >
                  <Avatar className="h-10 w-10 border">
                    <AvatarFallback className={getNotificationColor(note.type)}>
                      {getNotificationIcon(note.type)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{note.title || 'Notification'}</p>
                        <p className="text-sm text-muted-foreground mt-1">{note.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(note.timestamp)}</p>
                        {renderNotificationDetails(note)}
                      </div>
                      {!note.read && (
                        <div className="h-2 w-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!isLoading && (!notifications || notifications.length === 0) && (
             <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">No new notifications.</h3>
                <p className="text-muted-foreground mt-2">
                    We'll let you know when something new happens.
                </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
