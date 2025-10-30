'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, X, Satellite } from 'lucide-react';
import { useLocationState } from '@/hooks/useLocationState';
import { LiveLocationStatus } from '@/components/LiveLocationStatus';
import { getCurrentLocation, geocodeLocation, type Coordinates } from '@/lib/geolocation';
import { toast } from '@/hooks/use-toast';

interface LocationFilterProps {
  onLocationChange?: (coordinates: Coordinates | null, locationString?: string) => void;
  onDistanceChange: (maxDistance: number) => void;
  onSortChange: (sortBy: 'relevance' | 'distance') => void;
  currentLocation?: Coordinates | null;
  currentMaxDistance?: number;
  currentSortBy?: 'relevance' | 'distance';
}

export function LocationFilter({
  onLocationChange,
  onDistanceChange,
  onSortChange,
  currentLocation,
  currentMaxDistance = 50,
  currentSortBy = 'relevance'
}: LocationFilterProps) {
  const {
    currentLocation: locationState,
    locationString,
    maxDistance,
    sortBy,
    isLoading,
    isTracking,
    searchLocation,
    getCurrentLocationFromBrowser,
    clearLocation,
    toggleLiveTracking,
  } = useLocationState();

  // Use location state if provided, otherwise use props
  const displayLocation = currentLocation || locationState;
  const displayMaxDistance = currentMaxDistance;
  const displaySortBy = currentSortBy;

  const [searchLocationInput, setSearchLocationInput] = useState('');

  // Sync with external location changes
  useEffect(() => {
    if (onLocationChange && currentLocation !== undefined) {
      // This component manages its own location state, so we don't need to sync
    }
  }, [currentLocation, onLocationChange]);

  const handleLocationSearch = async () => {
    if (!searchLocationInput.trim()) return;

    const coordinates = await searchLocation(searchLocationInput.trim());
    if (coordinates && onLocationChange) {
      onLocationChange(coordinates, searchLocationInput.trim());
    }
    setSearchLocationInput('');
  };

  const handleGetCurrentLocation = async () => {
    const coordinates = await getCurrentLocationFromBrowser();
    if (coordinates && onLocationChange) {
      onLocationChange(coordinates);
    }
  };

  const handleClearLocation = () => {
    clearLocation();
    if (onLocationChange) {
      onLocationChange(null);
    }
  };

  const distanceOptions = [
    { value: 10, label: '10km' },
    { value: 25, label: '25km' },
    { value: 50, label: '50km' },
    { value: 100, label: '100km' },
    { value: 200, label: '200km' },
    { value: 500, label: '500km' },
  ];

  return (
    <div className="space-y-4">
      {/* Live Location Status */}
      <LiveLocationStatus />

      {/* Location Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Preferences
          </CardTitle>
          <CardDescription>
            Set your location preferences to get more relevant job recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Input */}
          <div className="space-y-2">
            <Label htmlFor="location-search">Search for a location</Label>
            <div className="flex gap-2">
              <Input
                id="location-search"
                placeholder="Enter city, state, or address..."
                value={searchLocationInput}
                onChange={(e) => setSearchLocationInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
              />
              <Button
                onClick={handleLocationSearch}
                disabled={!searchLocationInput.trim() || isLoading}
              >
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {/* Current Location Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGetCurrentLocation}
              disabled={isLoading}
              className="flex-1"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isLoading ? 'Getting Location...' : 'Use Current Location'}
            </Button>

            {displayLocation && (
              <Button
                variant="outline"
                onClick={handleClearLocation}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Location Status */}
          {displayLocation && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Using location for recommendations
                {isTracking && (
                  <Badge variant="default" className="ml-2 text-xs">
                    <Satellite className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                )}
              </span>
            </div>
          )}

          {/* Distance Filter */}
          <div className="space-y-3">
            <Label>Maximum Distance: {displayMaxDistance}km</Label>
            <Slider
              value={[displayMaxDistance]}
              onValueChange={(value) => onDistanceChange(value[0])}
              max={500}
              min={10}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10km</span>
              <span>500km</span>
            </div>
          </div>

          {/* Quick Distance Options */}
          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="flex flex-wrap gap-2">
              {distanceOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant={displayMaxDistance === option.value ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => onDistanceChange(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select value={displaySortBy} onValueChange={(value: 'relevance' | 'distance') => onSortChange(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Best Match</SelectItem>
                <SelectItem value="distance">Distance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Live Tracking Toggle */}
          <div className="pt-2 border-t">
            <Button
              variant={isTracking ? "destructive" : "default"}
              size="sm"
              onClick={toggleLiveTracking}
              className="w-full"
            >
              <Satellite className="h-4 w-4 mr-2" />
              {isTracking ? 'Stop Live Tracking' : 'Enable Live Tracking'}
            </Button>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {isTracking
                ? 'Real-time location updates enabled'
                : 'Enable for live location-based recommendations'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
