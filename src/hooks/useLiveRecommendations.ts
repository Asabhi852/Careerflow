'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, limit } from 'firebase/firestore';
import { getTopMatchesWithLocationFilter, type MatchScore } from '@/lib/matching-algorithm';
import { useLocationState } from '@/hooks/useLocationState';
import type { JobPosting, UserProfile, Coordinates } from '@/lib/types';

interface UseLiveRecommendationsProps {
  enabled?: boolean;
  minDistanceChange?: number; // Minimum distance change in km to trigger new recommendations
  debounceMs?: number; // Debounce time for location updates
}

export function useLiveRecommendations({
  enabled = true,
  minDistanceChange = 1, // 1km minimum change
  debounceMs = 2000, // 2 seconds debounce
}: UseLiveRecommendationsProps = {}) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [recommendations, setRecommendations] = useState<MatchScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastLocation, setLastLocation] = useState<Coordinates | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const {
    currentLocation,
    maxDistance,
    sortBy,
    isTracking,
    onLocationUpdate,
  } = useLocationState();

  // Fetch jobs data
  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jobs'), limit(100));
  }, [firestore]);

  const { data: jobs } = useCollection<JobPosting>(jobsQuery);

  // Fetch user profile
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  // Calculate distance between two coordinates
  const calculateDistance = useCallback((coord1: Coordinates, coord2: Coordinates) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Generate recommendations based on current location
  const generateRecommendations = useCallback(async (location: Coordinates | null) => {
    if (!userProfile || !jobs || !location || !enabled) {
      setRecommendations([]);
      return;
    }

    setIsLoading(true);
    try {
      const enhancedProfile: UserProfile = {
        ...userProfile,
        coordinates: location,
      };

      let newRecommendations: MatchScore[];

      if (sortBy === 'distance') {
        newRecommendations = getTopMatchesWithLocationFilter(enhancedProfile, jobs, {
          maxDistance,
          sortByDistance: true,
          limit: 20,
        });
      } else {
        newRecommendations = getTopMatchesWithLocationFilter(enhancedProfile, jobs, {
          maxDistance,
          sortByDistance: false,
          limit: 20,
        });
      }

      setRecommendations(newRecommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, jobs, maxDistance, sortBy, enabled]);

  // Handle location updates with debouncing and distance checking
  const handleLocationUpdate = useCallback((location: Coordinates | null) => {
    if (!location || !enabled) {
      setLastLocation(null);
      generateRecommendations(null);
      return;
    }

    // Check if location has changed significantly
    const hasSignificantChange = !lastLocation ||
      calculateDistance(lastLocation, location) >= minDistanceChange;

    if (hasSignificantChange) {
      setLastLocation(location);

      // Clear existing debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Set new debounce timer
      const timer = setTimeout(() => {
        generateRecommendations(location);
      }, debounceMs);

      setDebounceTimer(timer);
    }
  }, [lastLocation, calculateDistance, minDistanceChange, debounceMs, generateRecommendations, debounceTimer, enabled]);

  // Set up location update listener
  useEffect(() => {
    if (!enabled || !isTracking) return;

    const cleanup = onLocationUpdate(handleLocationUpdate);
    return cleanup;
  }, [enabled, isTracking, onLocationUpdate, handleLocationUpdate]);

  // Generate initial recommendations when data is available
  useEffect(() => {
    if (currentLocation && userProfile && jobs && enabled) {
      generateRecommendations(currentLocation);
    }
  }, [currentLocation, userProfile, jobs, enabled, generateRecommendations]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    recommendations,
    isLoading,
    isEnabled: enabled,
    isLiveTracking: isTracking,
    currentLocation,
    hasLocation: !!currentLocation,
    refreshRecommendations: () => generateRecommendations(currentLocation),
  };
}
