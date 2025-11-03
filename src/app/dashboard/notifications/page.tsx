'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Briefcase, MessageSquare, UserCheck, CheckCircle2, FileText, Building2, MapPin, DollarSign, Check } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { getNotificationIcon, getNotificationColor, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notifications';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

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
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  // Auto-mark notifications as read when user views the page
  useEffect(() => {
    if (!user || !firestore || !notifications || !isClient) return;
    
    const unreadNotifications = notifications.filter(n => !n.read && n.id);
    if (unreadNotifications.length > 0) {
      // Wait a bit before marking as read (user should see the notifications first)
      const timer = setTimeout(async () => {
        try {
          await markAllNotificationsAsRead(firestore, user.uid, notifications);
          console.log('Notifications marked as read automatically');
        } catch (error) {
          console.error('Error auto-marking notifications:', error);
        }
      }, 2000); // 2 seconds delay

      return () => clearTimeout(timer);
    }
  }, [notifications, user, firestore, isClient]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
  }

  const handleMarkAllAsRead = async () => {
    if (!user || !firestore || !notifications) return;
    
    setIsMarkingAllRead(true);
    try {
      await markAllNotificationsAsRead(firestore, user.uid, notifications);
      toast({
        title: 'All notifications marked as read',
        description: 'Your notification badge has been cleared.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark notifications as read. Please try again.',
      });
    } finally {
      setIsMarkingAllRead(false);
    }
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
      <div className="mt-2 space-y-2 text-xs">
        {/* Candidate Profile Information (for application notifications) */}
        {notification.type === 'application' && data.candidateId && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-2 border border-border/50">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Candidate Profile</h4>
              {data.viewProfileUrl && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(data.viewProfileUrl);
                  }}
                >
                  <UserCheck className="h-3 w-3 mr-1" />
                  View Profile
                </Button>
              )}
            </div>
            
            {data.candidateName && (
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{data.candidateName}</span>
              </div>
            )}
            
            {data.candidateCurrentRole && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{data.candidateCurrentRole}</span>
              </div>
            )}
            
            {data.candidateLocation && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{data.candidateLocation}</span>
              </div>
            )}
            
            {data.candidateEmail && (
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{data.candidateEmail}</span>
              </div>
            )}
            
            {data.candidateSkills && data.candidateSkills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {data.candidateSkills.slice(0, 5).map((skill: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0">
                    {skill}
                  </Badge>
                ))}
                {data.candidateSkills.length > 5 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    +{data.candidateSkills.length - 5} more
                  </Badge>
                )}
              </div>
            )}
            
            {data.candidateResumeUrl && (
              <Button
                size="sm"
                variant="link"
                className="h-6 p-0 text-xs text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(data.candidateResumeUrl, '_blank');
                }}
              >
                <FileText className="h-3 w-3 mr-1" />
                View Resume
              </Button>
            )}
          </div>
        )}
        
        {/* Job Information */}
        {data.jobId && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>Job: {data.jobTitle || data.jobId.substring(0, 8)}</span>
          </div>
        )}
        
        {/* Application Status */}
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

  const unreadCount = notifications?.filter(n => !n.read && n.id).length || 0;

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Notifications
          {unreadCount > 0 && (
            <Badge className="ml-3 bg-red-600 hover:bg-red-700">
              {unreadCount} unread
            </Badge>
          )}
        </h1>
        {notifications && notifications.length > 0 && unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllRead}
          >
            {isMarkingAllRead ? (
              <>
                <Check className="mr-2 h-4 w-4 animate-pulse" />
                Marking...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Mark all as read
              </>
            )}
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Stay Updated</CardTitle>
          <CardDescription>
            Here are your latest notifications. Unread notifications will be automatically cleared after viewing.
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
