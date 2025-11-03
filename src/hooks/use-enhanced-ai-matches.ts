import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

interface EnhancedMatchResult {
  jobId: string;
  score: number;
  matchQuality: 'excellent' | 'good' | 'fair' | 'poor';
  matchedSkills: string[];
  reasons: string[];
  distance?: number;
  compatibilityFactors: {
    skills: number;
    experience: number;
    location: number;
    salary: number;
    availability: number;
    education: number;
    personality: number;
    careerProgression: number;
    culturalFit: number;
  };
  skillGaps: Array<{
    skill: string;
    importance: 'high' | 'medium' | 'low';
    currentLevel: number;
    requiredLevel: number;
    learningResources: string[];
  }>;
  careerAdvice: string;
}

interface UseEnhancedAIMatchesParams {
  limit?: number;
  minScore?: number;
  maxDistance?: number;
  sortByDistance?: boolean;
  includeSkillGaps?: boolean;
  includeCareerAdvice?: boolean;
  enabled?: boolean;
}

interface MatchingSummary {
  totalMatches: number;
  excellentMatches: number;
  goodMatches: number;
  averageScore: number;
  topSkills: string[];
  skillGaps: string[];
  recommendations: string[];
}

export function useEnhancedAIMatches(params: UseEnhancedAIMatchesParams = {}) {
  const {
    limit = 10,
    minScore = 40,
    maxDistance = 100,
    sortByDistance = false,
    includeSkillGaps = true,
    includeCareerAdvice = true,
    enabled = true,
  } = params;

  const { user } = useUser();
  const firestore = useFirestore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [enhancedMatches, setEnhancedMatches] = useState<EnhancedMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchingSummary, setMatchingSummary] = useState<MatchingSummary | null>(null);

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

  // Fetch enhanced AI matches
  useEffect(() => {
    if (!user || !enabled) return;

    const fetchEnhancedMatches = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/job-matching', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            limit,
            minScore,
            maxDistance,
            sortByDistance,
            includeSkillGaps,
            includeCareerAdvice,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch matches`);
        }

        const data = await response.json();
        
        // Ensure matches is an array
        const matches = Array.isArray(data.matches) ? data.matches : [];
        setEnhancedMatches(matches);
        
        if (matches.length > 0) {
          setMatchingSummary(generateMatchingSummary(matches));
        } else {
          setMatchingSummary({
            totalMatches: 0,
            excellentMatches: 0,
            goodMatches: 0,
            averageScore: 0,
            topSkills: [],
            skillGaps: [],
            recommendations: ['No matches found. Try updating your profile with more skills and experience.'],
          });
        }
      } catch (err) {
        console.error('Error fetching enhanced AI matches:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to calculate AI matches';
        setError(errorMessage);
        setEnhancedMatches([]);
        setMatchingSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnhancedMatches();
  }, [user, limit, minScore, maxDistance, sortByDistance, includeSkillGaps, includeCareerAdvice, enabled]);

  // Generate matching summary
  const generateMatchingSummary = (matches: EnhancedMatchResult[]): MatchingSummary => {
    const totalMatches = matches.length;
    const excellentMatches = matches.filter(m => m.matchQuality === 'excellent').length;
    const goodMatches = matches.filter(m => m.matchQuality === 'good').length;
    const averageScore = matches.length > 0 
      ? Math.round(matches.reduce((sum, m) => sum + m.score, 0) / matches.length) 
      : 0;

    // Extract top skills from all matches
    const allSkills = matches.flatMap(m => m.matchedSkills);
    const skillCounts = allSkills.reduce((acc, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topSkills = Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([skill]) => skill);

    // Extract skill gaps
    const allSkillGaps = matches.flatMap(m => m.skillGaps);
    const skillGapCounts = allSkillGaps.reduce((acc, gap) => {
      acc[gap.skill] = (acc[gap.skill] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topSkillGaps = Object.entries(skillGapCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([skill]) => skill);

    // Generate recommendations
    const recommendations: string[] = [];
    if (excellentMatches > 0) {
      recommendations.push('You have excellent matches! Consider applying to these positions.');
    }
    if (goodMatches > 0) {
      recommendations.push('Good matches available. Focus on skill development for better scores.');
    }
    if (topSkillGaps.length > 0) {
      recommendations.push(`Consider developing: ${topSkillGaps.slice(0, 3).join(', ')}`);
    }
    if (averageScore < 60) {
      recommendations.push('Focus on building relevant skills and experience.');
    }

    return {
      totalMatches,
      excellentMatches,
      goodMatches,
      averageScore,
      topSkills,
      skillGaps: topSkillGaps,
      recommendations,
    };
  };

  // Memoized computed values
  const computedValues = useMemo(() => {
    const excellentMatches = enhancedMatches.filter(m => m.matchQuality === 'excellent');
    const goodMatches = enhancedMatches.filter(m => m.matchQuality === 'good');
    const fairMatches = enhancedMatches.filter(m => m.matchQuality === 'fair');
    const poorMatches = enhancedMatches.filter(m => m.matchQuality === 'poor');

    const averageScore = enhancedMatches.length > 0 
      ? Math.round(enhancedMatches.reduce((sum, m) => sum + m.score, 0) / enhancedMatches.length)
      : 0;

    const topSkills = enhancedMatches
      .flatMap(m => m.matchedSkills)
      .reduce((acc, skill) => {
        acc[skill] = (acc[skill] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const sortedTopSkills = Object.entries(topSkills)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    return {
      excellentMatches,
      goodMatches,
      fairMatches,
      poorMatches,
      averageScore,
      topSkills: sortedTopSkills,
    };
  }, [enhancedMatches]);

  return {
    enhancedMatches,
    isLoading,
    error,
    userProfile,
    hasProfile: !!userProfile,
    totalMatches: enhancedMatches.length,
    matchingSummary,
    computedValues,
    // Quality breakdown
    excellentMatches: computedValues.excellentMatches,
    goodMatches: computedValues.goodMatches,
    fairMatches: computedValues.fairMatches,
    poorMatches: computedValues.poorMatches,
    averageScore: computedValues.averageScore,
    topSkills: computedValues.topSkills,
  };
}
