'use client';

import Link from 'next/link';
// @ts-ignore - Next.js navigation import issue
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nProvider';

export function MainNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Don't show navigation on landing page for non-logged in users (only after mount)
  const isLandingPage = pathname === '/';
  if (isLandingPage && isMounted && !user) {
    return null;
  }

  const navItems = [
    { href: '/jobs', label: t('nav_jobs', 'Jobs') },
    { href: '/posts', label: t('nav_posts', 'Posts') },
    { href: '/ai-match', label: t('nav_ai_match', 'AI Match') },
    { href: '/candidates', label: t('nav_candidates', 'Candidates') },
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
