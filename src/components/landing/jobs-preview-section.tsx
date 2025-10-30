'use client';

// @ts-ignore - React hooks import issue
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// @ts-ignore - Lucide icons import issue
import { ArrowRight, MapPin, Briefcase, DollarSign, ExternalLink } from 'lucide-react';
import type { JobPosting } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export function JobsPreviewSection() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch latest jobs from external sources
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs/external?limit=6');
        const data = await response.json();
        if (data.success) {
          setJobs(data.data.slice(0, 6));
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return (
    <section className="py-20 sm:py-32 bg-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Latest Job Opportunities
          </h2>
          <p className="text-lg text-muted-foreground">
            Fresh jobs from LinkedIn, Naukri.com, and top companies updated in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="flex flex-col">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))
          ) : (
            jobs.map((job, index) => (
              <Card 
                key={job.id} 
                className="flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="font-headline text-lg group-hover:text-primary transition-colors line-clamp-1">
                      {job.title}
                    </CardTitle>
                    {job.source && job.source !== 'internal' && (
                      // @ts-ignore - Badge children prop
                      <Badge variant="outline" className="text-xs capitalize shrink-0 ml-2">
                        {job.source}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4" />
                      <span className="line-clamp-1">{job.company}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{job.location}</span>
                    </div>
                    {job.salary && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4" />
                        <span>₹{(job.salary / 100000).toFixed(1)}L</span>
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {job.description}
                  </p>
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {job.skills.slice(0, 3).map((skill) => (
                        // @ts-ignore - Badge children prop
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {job.skills.length > 3 && (
                        // @ts-ignore - Badge children prop
                        <Badge variant="outline" className="text-xs">
                          +{job.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {job.externalUrl ? (
                    <Button asChild className="w-full group/btn" size="sm">
                      <a href={job.externalUrl} target="_blank" rel="noopener noreferrer">
                        View Job
                        <ExternalLink className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                  ) : (
                    <Button asChild className="w-full" size="sm">
                      <Link href={`/jobs/${job.id}`}>
                        View Details
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" asChild variant="outline" className="group">
            <Link href="/jobs">
              View All Jobs
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}} />
    </section>
  );
}
