'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Wifi, WifiOff, Clock } from 'lucide-react';
import { useLocationState } from '@/hooks/useLocationState';
import { formatDistanceToNow } from 'date-fns';

interface LiveLocationStatusProps {
  compact?: boolean;
}

export function LiveLocationStatus({ compact = false }: LiveLocationStatusProps) {
  const {
    currentLocation,
    locationString,
    isTracking,
    locationAccuracy,
    lastUpdate,
    toggleLiveTracking,
  } = useLocationState();

  const formatAccuracy = (accuracy: number | null) => {
    if (!accuracy) return 'Unknown';
    if (accuracy < 10) return 'Very High';
    if (accuracy < 50) return 'High';
    if (accuracy < 100) return 'Medium';
    return 'Low';
  };

  const getAccuracyColor = (accuracy: number | null) => {
    if (!accuracy) return 'secondary';
    if (accuracy < 10) return 'default';
    if (accuracy < 50) return 'secondary';
    if (accuracy < 100) return 'outline';
    return 'destructive';
  };

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Never';
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1">
          {isTracking ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-muted-foreground">
            {isTracking ? 'Live' : 'Static'}
          </span>
        </div>

        {currentLocation && (
          <>
            <span className="text-muted-foreground">•</span>
            <Badge variant={getAccuracyColor(locationAccuracy)} className="text-xs">
              {formatAccuracy(locationAccuracy)} accuracy
            </Badge>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLiveTracking}
          className="h-6 px-2 text-xs"
        >
          {isTracking ? 'Stop' : 'Start'} Live
        </Button>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <MapPin className="h-5 w-5 text-blue-600" />
              {isTracking && (
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>

            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                Location Status
                {isTracking ? (
                  <Badge variant="default" className="text-xs">
                    <Navigation className="h-3 w-3 mr-1" />
                    Live Tracking
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Static
                  </Badge>
                )}
              </h3>

              {currentLocation ? (
                <p className="text-xs text-muted-foreground mt-1">
                  {locationString || 'Location detected'}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  No location data
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentLocation && locationAccuracy && (
              <Badge variant={getAccuracyColor(locationAccuracy)} className="text-xs">
                {formatAccuracy(locationAccuracy)}
              </Badge>
            )}

            <Button
              variant={isTracking ? "destructive" : "default"}
              size="sm"
              onClick={toggleLiveTracking}
            >
              {isTracking ? 'Stop Tracking' : 'Start Live Tracking'}
            </Button>
          </div>
        </div>

        {lastUpdate && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Last updated {formatLastUpdate(lastUpdate)}
            </span>
          </div>
        )}

        {!currentLocation && !isTracking && (
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-muted-foreground">
              Enable live tracking to get real-time location-based recommendations as you move.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
