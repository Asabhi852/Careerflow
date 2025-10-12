'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Briefcase, MessageSquare, UserCheck } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap: { [key: string]: React.ReactNode } = {
  'profile_view': <UserCheck className="h-5 w-5" />,
  'new_message': <MessageSquare className="h-5 w-5" />,
  'application_update': <Briefcase className="h-5 w-5" />,
};

export default function NotificationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const notificationsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'notifications'), orderBy('timestamp', 'desc'));
  }, [user, firestore]);

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
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
                <div key={note.id} className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${!note.isRead ? 'bg-muted/50' : ''}`}>
                  <Avatar className="h-10 w-10 border">
                    {/* In a real app, you might fetch the sender's avatar */}
                    <AvatarFallback>{iconMap[note.type] || <Bell className="h-5 w-5" />}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">{note.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(note.timestamp)}</p>
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
