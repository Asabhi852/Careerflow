import Link from 'next/link';
// @ts-ignore - Lucide icons import issue
import { Briefcase } from 'lucide-react';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <Briefcase className="h-7 w-7 text-primary" />
      <span className="text-xl font-bold font-headline text-foreground">
        CareerFlow Connect
      </span>
    </Link>
  );
}
