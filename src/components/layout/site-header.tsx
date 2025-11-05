'use client';

import Link from 'next/link';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MainNav } from './main-nav';
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Loader2, Bell, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { collection, query, orderBy, where } from 'firebase/firestore';
import type { Notification, Message } from '@/lib/types';

export function SiteHeader() {
  const [isMounted, setIsMounted] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch notifications (only when user is authenticated and mounted)
  const notificationsQuery = useMemoFirebase(() => {
    if (!isMounted || !user || !firestore || !user.uid) return null;
    try {
      return query(
        collection(firestore, 'users', user.uid, 'notifications'),
        orderBy('timestamp', 'desc')
      );
    } catch (error) {
      console.error('Error creating notifications query:', error);
      return null;
    }
  }, [user, firestore]);

  const { data: notifications } = useCollection<Notification>(notificationsQuery);
  const unreadNotifications = isMounted ? (notifications?.filter(n => !n.read && n.id).length || 0) : 0;

  // Fetch unread messages (only when user is authenticated and mounted)
  const messagesQuery = useMemoFirebase(() => {
    if (!isMounted || !user || !firestore || !user.uid) return null;
    try {
      return query(
        collection(firestore, 'users', user.uid, 'messages'),
        orderBy('timestamp', 'desc')
      );
    } catch (error) {
      console.error('Error creating messages query:', error);
      return null;
    }
  }, [user, firestore, isMounted]);

  const { data: messages } = useCollection<Message>(messagesQuery);
  const unreadMessages = isMounted ? (messages?.filter(m => m.receiverId === user?.uid && m.id).length || 0) : 0;

  const handleSignOut = () => {
    // This will be handled by the dashboard layout's sign out button,
    // but we can add a fallback here if needed.
    router.push('/login');
  };

  const handleLogout = () => {
    if (auth) {
      signOut(auth).finally(() => router.push('/login'));
    } else {
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" suppressHydrationWarning>
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Logo />
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {!isMounted || isUserLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : user ? (
              <>
                {/* Notifications Icon */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative"
                  onClick={() => router.push('/dashboard/notifications')}
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600 hover:bg-red-700">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </Badge>
                  )}
                </Button>

                {/* Messages Icon */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative"
                  onClick={() => router.push('/dashboard/messages')}
                >
                  <MessageSquare className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-blue-600 hover:bg-blue-700">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </Badge>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                        <AvatarImage 
                          src={user.photoURL ?? ''} 
                          alt={user.displayName ?? 'User'} 
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                          {user.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName || user.email}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.displayName ? user.email : ''}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
