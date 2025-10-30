'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AiMatchesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard AI matches page
    router.replace('/dashboard/ai-matches');
  }, [router]);

  return null;
}