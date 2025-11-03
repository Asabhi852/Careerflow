import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { getNotificationIcon, getNotificationColor, markNotificationAsRead } from '@/lib/notifications';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function NotificationDropdown() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Get recent notifications (limit to 10 for dropdown)
  const notificationsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
  }, [user, firestore]);

  const { data: notifications } = useCollection<Notification>(notificationsQuery);

  // Count unread notifications
  const unreadCount = notifications?.filter(n => !n.read && n.id).length || 0;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!user || !firestore) return;

    // Mark as read
    if (!notification.read) {
      await markNotificationAsRead(firestore, user.uid, notification.id);
    }

    // Close dropdown
    setOpen(false);

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
  };

  const handleViewAllClick = () => {
    setOpen(false);
    router.push('/dashboard/notifications');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600 hover:bg-red-700"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" side="bottom">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>

        <ScrollArea className="h-80">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-muted/30' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback className={getNotificationColor(notification.type)}>
                      {getNotificationIcon(notification.type)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {notification.title || 'Notification'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(notification.timestamp)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications && notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleViewAllClick}
              >
                View All Notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
