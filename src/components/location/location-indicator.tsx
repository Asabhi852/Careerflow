'use client';

// @ts-ignore - React hooks import issue
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// @ts-ignore - Lucide icons import issue
import { MapPin, Navigation, X } from 'lucide-react';
import { useGeolocation } from '@/hooks/use-geolocation';

interface LocationIndicatorProps {
  onLocationChange?: () => void;
}

/**
 * Location indicator similar to Zomato's location selector
 * Shows current location and allows changing it
 */
export function LocationIndicator({ onLocationChange }: LocationIndicatorProps) {
  const { coordinates, locationString, isLoading, requestLocation, permissionDenied } = useGeolocation(true);
  const [isOpen, setIsOpen] = useState(false);

  const handleChangeLocation = async () => {
    await requestLocation();
    setIsOpen(false);
    if (onLocationChange) {
      onLocationChange();
    }
  };

  const handleDisableLocation = () => {
    localStorage.removeItem('location_permission');
    window.location.reload();
  };

  if (permissionDenied) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleChangeLocation}
        className="gap-2"
      >
        <MapPin className="h-4 w-4" />
        <span className="hidden sm:inline">Enable Location</span>
      </Button>
    );
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <Navigation className="h-4 w-4 animate-spin" />
        <span className="hidden sm:inline">Detecting...</span>
      </Button>
    );
  }

  if (!coordinates || !locationString) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleChangeLocation}
        className="gap-2"
      >
        <MapPin className="h-4 w-4" />
        <span className="hidden sm:inline">Set Location</span>
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 max-w-[200px]">
          <Navigation className="h-4 w-4 text-primary" />
          <span className="truncate text-sm">{locationString}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-2">
          <p className="text-xs text-muted-foreground mb-2">Current Location</p>
          <p className="text-sm font-medium mb-3">{locationString}</p>
        </div>
        <DropdownMenuItem onClick={handleChangeLocation}>
          <Navigation className="mr-2 h-4 w-4" />
          Update Location
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDisableLocation} className="text-destructive">
          <X className="mr-2 h-4 w-4" />
          Disable Location
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
