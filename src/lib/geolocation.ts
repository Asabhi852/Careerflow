/**
 * Geolocation utilities for location-based recommendations
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  city?: string;
  state?: string;
  country?: string;
  coordinates?: Coordinates;
  formattedAddress?: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  
  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 * @returns Formatted string
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km away`;
  } else {
    return `${Math.round(distanceKm)}km away`;
  }
}

/**
 * Get user's current location using browser geolocation API
 * @returns Promise with coordinates or null if denied/unavailable
 */
export async function getCurrentLocation(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    // Check if running in secure context (HTTPS or localhost)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      // Silently fail when not in secure context
      resolve(null);
      return;
    }

    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        // Provide more helpful error messages
        let errorMessage = 'Error getting location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = error.message;
        }
        console.warn(errorMessage);
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
}

/**
 * Geocode a location string to coordinates using a free geocoding service
 * Note: For production, consider using Google Maps Geocoding API or similar
 * @param locationString Location string (e.g., "San Francisco, CA")
 * @returns Coordinates or null if not found
 */
export async function geocodeLocation(locationString: string): Promise<Coordinates | null> {
  try {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Using Nominatim (OpenStreetMap) free geocoding service
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}&limit=1`,
      {
        headers: {
          'User-Agent': 'CareerFlow-Job-Matching-App/1.0 (contact: developer@careerflow.example.com)',
          'Referer': typeof window !== 'undefined' ? window.location.origin : 'https://careerflow.example.com',
        },
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Geocoding failed with status: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    
    return null;
  } catch (error) {
    // More detailed error handling
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('Geocoding request timed out');
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.warn('Geocoding request failed - network error or CORS issue');
      } else {
        console.error('Geocoding error:', error);
      }
    } else {
      console.error('Geocoding error:', error);
    }
    return null;
  }
}

/**
 * Reverse geocode coordinates to a location string
 * @param coordinates Coordinates to reverse geocode
 * @returns Location string or null if not found
 */
export async function reverseGeocode(coordinates: Coordinates): Promise<string | null> {
  try {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Use a more descriptive User-Agent to comply with Nominatim's usage policy
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.latitude}&lon=${coordinates.longitude}`,
      {
        headers: {
          'User-Agent': 'CareerFlow-Job-Matching-App/1.0 (contact: developer@careerflow.example.com)',
          'Referer': typeof window !== 'undefined' ? window.location.origin : 'https://careerflow.example.com',
        },
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Reverse geocoding failed with status: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.address) {
      const { city, town, village, state, country } = data.address;
      const locality = city || town || village;
      return locality && state ? `${locality}, ${state}` : locality || state || country || null;
    }
    
    return null;
  } catch (error) {
    // More detailed error handling
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('Reverse geocoding request timed out');
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.warn('Reverse geocoding request failed - network error or CORS issue');
      } else {
        console.error('Reverse geocoding error:', error);
      }
    } else {
      console.error('Reverse geocoding error:', error);
    }
    return null;
  }
}

/**
 * Sort items by distance from a reference point
 * @param items Items with location data
 * @param userLocation User's current location
 * @param getItemLocation Function to extract location from item
 * @returns Sorted items with distance property added
 */
export function sortByDistance<T>(
  items: T[],
  userLocation: Coordinates,
  getItemLocation: (item: T) => Coordinates | null
): (T & { distance?: number })[] {
  return items
    .map(item => {
      const itemLocation = getItemLocation(item);
      const distance = itemLocation ? calculateDistance(userLocation, itemLocation) : null;
      return { ...item, distance: distance ?? undefined };
    })
    .sort((a, b) => {
      // Items with distance come first, sorted by distance
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      // Items without distance go to the end
      if (a.distance !== undefined) return -1;
      if (b.distance !== undefined) return 1;
      return 0;
    });
}
