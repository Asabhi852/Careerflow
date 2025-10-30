'use client';

// @ts-ignore - React hooks import issue
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
// @ts-ignore - Lucide icons import issue
import { MapPin, X, Navigation } from 'lucide-react';
import { useGeolocation } from '@/hooks/use-geolocation';

interface LocationBannerProps {
  onLocationEnabled: () => void;
  onLocationDenied: () => void;
}

/**
 * Location permission banner similar to Zomato
 * Prompts user to enable location for better recommendations
 */
export function LocationBanner({ onLocationEnabled, onLocationDenied }: LocationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { coordinates, isLoading, requestLocation, permissionDenied, locationString } = useGeolocation(false);

  useEffect(() => {
    // Check if running in secure context (HTTPS or localhost)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      // Silently hide banner when not in secure context
      setIsVisible(false);
      return;
    }

    // Check if user has already granted/denied location
    const hasLocationPermission = localStorage.getItem('location_permission');
    
    if (!hasLocationPermission && !isDismissed) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isDismissed]);

  useEffect(() => {
    if (coordinates) {
      localStorage.setItem('location_permission', 'granted');
      setIsVisible(false);
      onLocationEnabled();
    }
  }, [coordinates, onLocationEnabled]);

  useEffect(() => {
    if (permissionDenied) {
      localStorage.setItem('location_permission', 'denied');
      setIsVisible(false);
      onLocationDenied();
    }
  }, [permissionDenied, onLocationDenied]);

  const handleEnableLocation = async () => {
    await requestLocation();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    localStorage.setItem('location_permission', 'dismissed');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-bottom-5">
      <Card className="p-4 shadow-lg border-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">
              Enable Location Access
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Get personalized recommendations for jobs and candidates near you
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleEnableLocation}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Navigation className="mr-2 h-3 w-3 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <Navigation className="mr-2 h-3 w-3" />
                    Enable Location
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                disabled={isLoading}
              >
                Not Now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}
