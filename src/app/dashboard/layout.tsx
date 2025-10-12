'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SheetTitle,
  SheetHeader,
} from '@/components/ui/sidebar';
import { useUser, useAuth } from '@/firebase';
import {
  Briefcase,
  User,
  LogOut,
  Settings,
  LayoutGrid,
  Bell,
  MessageSquare,
  FileText,
  BrainCircuit,
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const handleSignOut = () => {
    if (auth) {
      signOut(auth).then(() => {
        router.push('/');
      });
    }
  };

  const menuItems = [
    { href: '/dashboard', label: 'My Profile', icon: User, exact: true },
    { href: '/dashboard/jobs', label: 'Find Jobs', icon: Briefcase },
    { href: '/dashboard/applications', label: 'Applications', icon: FileText },
    { href: '/dashboard/ai-matches', label: 'AI Matches', icon: BrainCircuit },
    { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
    { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const isMenuItemActive = (item: { href: string, exact?: boolean }) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col">
        {isMobile && (
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Logo />
            <SidebarTrigger />
          </header>
        )}
        <Sidebar>
          <SheetHeader>
            <SheetTitle>
              <Logo />
            </SheetTitle>
          </SheetHeader>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton href="/candidates">
                  <LayoutGrid />
                  Find Candidates
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="/chatbot">
                  <MessageSquare />
                  AI Chatbot
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenu>
                <h2 className="px-2 py-4 text-xs font-semibold text-muted-foreground">My Account</h2>
                {menuItems.map(item => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      href={item.href} 
                      isActive={isMenuItemActive(item)}
                    >
                      <item.icon />
                      {item.label}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className='items-center'>
            {user && (
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.photoURL ?? undefined}
                    alt={user.displayName ?? 'User'}
                  />
                  <AvatarFallback>
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-sm w-full truncate">
                  <span className="font-semibold">{user.displayName || user.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.displayName ? user.email : ''}
                  </span>
                </div>
                 <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
           {!isMobile && (
             <header className="sticky top-0 z-40 flex h-14 items-center justify-end gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
              <SidebarTrigger />
            </header>
           )}
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
