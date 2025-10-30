'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/firebase';
import { getCurrentLocation, geocodeLocation, reverseGeocode, type Coordinates } from '@/lib/geolocation';
import { toast } from '@/hooks/use-toast';

export function useLocationState() {
  const { user } = useUser();
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [locationString, setLocationString] = useState<string>('');
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [sortBy, setSortBy] = useState<'relevance' | 'distance'>('relevance');
  const [isLoading, setIsLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const locationUpdateCallbacksRef = useRef<Array<(location: Coordinates | null) => void>>([]);

  // Initialize location on mount
  useEffect(() => {
    initializeLocation();
  }, []);

  // Cleanup watch position on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const initializeLocation = async () => {
    setIsLoading(true);
    try {
      // Try to get user's current location
      const coordinates = await getCurrentLocation();
      if (coordinates) {
        await updateLocation(coordinates);

        // Try to reverse geocode to get location string
        try {
          const locationStr = await reverseGeocode(coordinates);
          if (locationStr) {
            setLocationString(locationStr);
          }
        } catch (error) {
          console.warn('Could not reverse geocode location:', error);
        }
      }
    } catch (error) {
      console.warn('Could not get initial location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocation = useCallback(async (coordinates: Coordinates | null, locationStr?: string) => {
    setCurrentLocation(coordinates);
    setLastUpdate(new Date());

    if (locationStr) {
      setLocationString(locationStr);
    } else if (coordinates) {
      // Try to get location string from coordinates
      try {
        const locationStr = await reverseGeocode(coordinates);
        if (locationStr) {
          setLocationString(locationStr);
        }
      } catch (error) {
        console.warn('Could not reverse geocode coordinates:', error);
      }
    } else {
      setLocationString('');
    }

    // Notify all registered callbacks
    locationUpdateCallbacksRef.current.forEach(callback => {
      try {
        callback(coordinates);
      } catch (error) {
        console.error('Error in location update callback:', error);
      }
    });
  }, []);

  const searchLocation = useCallback(async (locationQuery: string) => {
    setIsLoading(true);
    try {
      const coordinates = await geocodeLocation(locationQuery);
      if (coordinates) {
        await updateLocation(coordinates, locationQuery);
        return coordinates;
      } else {
        toast({
          variant: 'destructive',
          title: 'Location Not Found',
          description: 'Please check the location name and try again.',
        });
        return null;
      }
    } catch (error) {
      console.error('Error searching location:', error);
      toast({
        variant: 'destructive',
        title: 'Search Error',
        description: 'There was a problem searching for that location.',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [updateLocation]);

  const getCurrentLocationFromBrowser = useCallback(async () => {
    setIsLoading(true);
    try {
      const coordinates = await getCurrentLocation();
      if (coordinates) {
        await updateLocation(coordinates);
        toast({
          title: 'Location Updated',
          description: 'Using your current location for recommendations.',
        });
        return coordinates;
      } else {
        toast({
          variant: 'destructive',
          title: 'Location Access Denied',
          description: 'Please enable location access or search for a location manually.',
        });
        return null;
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      toast({
        variant: 'destructive',
        title: 'Location Error',
        description: 'There was a problem getting your location.',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [updateLocation]);

  const clearLocation = useCallback(() => {
    setCurrentLocation(null);
    setLocationString('');
    setLocationAccuracy(null);
    setLastUpdate(null);
    toast({
      title: 'Location Cleared',
      description: 'Showing all jobs regardless of location.',
    });
  }, []);

  const startLiveTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Geolocation Not Supported',
        description: 'Your browser does not support location tracking.',
      });
      return false;
    }

    if (watchIdRef.current !== null) {
      // Already tracking
      return true;
    }

    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coordinates: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setLocationAccuracy(position.coords.accuracy);
        updateLocation(coordinates);
      },
      (error) => {
        console.error('Error watching position:', error);
        setIsTracking(false);
        watchIdRef.current = null;

        let errorMessage = 'Error tracking location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location tracking permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location tracking timed out';
            break;
        }

        toast({
          variant: 'destructive',
          title: 'Location Tracking Error',
          description: errorMessage,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // Accept locations up to 30 seconds old
      }
    );

    toast({
      title: 'Live Location Enabled',
      description: 'Tracking your location for real-time recommendations.',
    });

    return true;
  }, [updateLocation]);

  const stopLiveTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    toast({
      title: 'Live Location Disabled',
      description: 'Location tracking stopped.',
    });
  }, []);

  const toggleLiveTracking = useCallback(() => {
    if (isTracking) {
      stopLiveTracking();
    } else {
      startLiveTracking();
    }
  }, [isTracking, startLiveTracking, stopLiveTracking]);

  const onLocationUpdate = useCallback((callback: (location: Coordinates | null) => void) => {
    locationUpdateCallbacksRef.current.push(callback);

    // Return cleanup function
    return () => {
      const index = locationUpdateCallbacksRef.current.indexOf(callback);
      if (index > -1) {
        locationUpdateCallbacksRef.current.splice(index, 1);
      }
    };
  }, []);

  return {
    currentLocation,
    locationString,
    maxDistance,
    sortBy,
    isLoading,
    isTracking,
    locationAccuracy,
    lastUpdate,
    setMaxDistance,
    setSortBy,
    updateLocation,
    searchLocation,
    getCurrentLocationFromBrowser,
    clearLocation,
    startLiveTracking,
    stopLiveTracking,
    toggleLiveTracking,
    onLocationUpdate,
  };
}
