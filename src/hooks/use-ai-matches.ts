import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { calculateMatchScore, getTopMatches } from '@/lib/matching-algorithm';
import { useExternalJobs } from './use-external-jobs';
import type { UserProfile, JobPosting } from '@/lib/types';

interface AIMatchResult {
  job: JobPosting;
  score: number;
  matchedSkills: string[];
  reasons: string[];
  distance?: number;
}

interface UseAIMatchesParams {
  limit?: number;
  minScore?: number;
  enabled?: boolean;
}

export function useAIMatches(params: UseAIMatchesParams = {}) {
  const { limit = 10, minScore = 60, enabled = true } = params;
  const { user } = useUser();
  const firestore = useFirestore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [aiMatches, setAiMatches] = useState<AIMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  useEffect(() => {
    if (!user || !firestore || !enabled) return;

    const fetchUserProfile = async () => {
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const profileData = userDoc.data() as UserProfile;
          setUserProfile(profileData);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');
      }
    };

    fetchUserProfile();
  }, [user, firestore, enabled]);

  // Fetch external jobs
  const { jobs: externalJobs, isLoading: isLoadingJobs, error: jobsError } = useExternalJobs({
    source: 'all',
    limit: 50,
    enabled: enabled && !!userProfile
  });

  // Calculate AI matches when profile and jobs are available
  useEffect(() => {
    if (!userProfile || !externalJobs || !enabled) return;

    const calculateMatches = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Calculate matches for all jobs
        const matches = externalJobs
          .map(job => {
            const matchResult = calculateMatchScore(userProfile!, job);
            return {
              job,
              score: matchResult.score,
              matchedSkills: matchResult.matchedSkills,
              reasons: matchResult.reasons,
              distance: matchResult.distance,
            };
          })
          .filter(match => match.score >= minScore)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);

        setAiMatches(matches);
      } catch (err) {
        console.error('Error calculating AI matches:', err);
        setError('Failed to calculate AI matches');
      } finally {
        setIsLoading(false);
      }
    };

    calculateMatches();
  }, [userProfile, externalJobs, limit, minScore, enabled]);

  return {
    aiMatches,
    isLoading: isLoading || isLoadingJobs,
    error: error || jobsError,
    userProfile,
    hasProfile: !!userProfile,
    totalMatches: aiMatches.length
  };
}
