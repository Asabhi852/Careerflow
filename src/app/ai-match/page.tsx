'use client';

import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { AIJobMatcher } from '@/components/jobs/ai-job-matcher';

export default function AIMatchPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI Job Matching
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload your resume and let our AI find the perfect job opportunities tailored to your skills and experience
            </p>
          </div>
          
          <AIJobMatcher />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
