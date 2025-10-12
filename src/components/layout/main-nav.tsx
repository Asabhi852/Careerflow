'use client';

import Link from 'next/link';
// @ts-ignore - Next.js navigation import issue
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

export function MainNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const navItems = [
    { href: '/jobs', label: 'Find Jobs' },
    { href: '/candidates', label: 'Find Candidates' },
    { href: '/ai-matches', label: 'AI Matches' },
    { href: '/chatbot', label: 'Chatbot' },
    ...(user ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
  ];


  return (
    <div className="mr-4 hidden md:flex">
      <nav className="flex items-center gap-6 text-sm ml-10">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'transition-colors hover:text-foreground/80',
              pathname?.startsWith(item.href) ? 'text-foreground font-semibold' : 'text-foreground/60'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
