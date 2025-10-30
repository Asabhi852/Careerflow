// @ts-ignore - React hooks import issue
import { useState, useEffect } from 'react';
import type { JobPosting } from '@/lib/types';

interface UseExternalJobsParams {
  source?: 'linkedin' | 'naukri' | 'all';
  query?: string;
  location?: string;
  limit?: number;
  category?: string;
  enabled?: boolean;
}

interface UseExternalJobsResult {
  jobs: JobPosting[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useExternalJobs(params: UseExternalJobsParams = {}): UseExternalJobsResult {
  const {
    source = 'all',
    query = '',
    location = '',
    limit = 100,
    category = '',
    enabled = true
  } = params;

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (source) params.append('source', source);
      if (query) params.append('query', query);
      if (location) params.append('location', location);
      if (limit) params.append('limit', limit.toString());
      if (category) params.append('category', category);

      const response = await fetch(`/api/jobs/external?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch external jobs');
      }

      const data = await response.json();
      
      if (data.success) {
        setJobs(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch jobs');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching external jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [source, query, location, limit, category, enabled]);

  return {
    jobs,
    isLoading,
    error,
    refetch: fetchJobs
  };
}
