'use client';

// @ts-ignore - React hooks import issue
import { useState, useEffect } from 'react';
import { getCurrentLocation, reverseGeocode, type Coordinates } from '@/lib/geolocation';

export interface GeolocationState {
  coordinates: Coordinates | null;
  locationString: string | null;
  isLoading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

/**
 * Hook to get user's current geolocation
 * @param autoRequest Whether to automatically request location on mount
 * @returns Geolocation state and request function
 */
export function useGeolocation(autoRequest: boolean = false) {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    locationString: null,
    isLoading: false,
    error: null,
    permissionDenied: false,
  });

  const requestLocation = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const coords = await getCurrentLocation();
      
      if (!coords) {
        setState({
          coordinates: null,
          locationString: null,
          isLoading: false,
          error: 'Unable to get location',
          permissionDenied: true,
        });
        return;
      }

      // Get location string from coordinates
      const locationStr = await reverseGeocode(coords);

      setState({
        coordinates: coords,
        locationString: locationStr,
        isLoading: false,
        error: null,
        permissionDenied: false,
      });
    } catch (error) {
      setState({
        coordinates: null,
        locationString: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get location',
        permissionDenied: false,
      });
    }
  };

  useEffect(() => {
    if (autoRequest) {
      requestLocation();
    }
  }, [autoRequest]);

  return {
    ...state,
    requestLocation,
  };
}
