# Location-Based Recommendations Feature

## Overview

Implemented a comprehensive location-based recommendation system that allows users to find nearby jobs and candidates based on their current geographic location. The system uses browser geolocation API and geocoding services to calculate distances and sort results accordingly.

## ✨ Features

### 1. **User Location Detection**

- Browser geolocation API integration
- Permission-based location access
- Automatic location caching (5 minutes)
- Fallback handling for denied permissions

### 2. **Distance Calculation**

- Haversine formula for accurate distance calculation
- Results in kilometers with proper formatting
- Supports both job postings and candidate profiles

### 3. **Location-Based Job Search**

- Toggle button to enable/disable location sorting
- Jobs sorted by distance from user's location
- Distance display on job cards
- Works with internal jobs (external jobs use location string only)

### 4. **Location-Based Candidate Search**

- Toggle button to enable/disable location sorting
- Candidates sorted by distance from user's location
- Distance display on candidate cards
- Seamless integration with existing filters

### 5. **Geocoding Integration**

- Automatic geocoding of location strings to coordinates
- Uses OpenStreetMap Nominatim (free service)
- Reverse geocoding for coordinate-to-address conversion
- Caching to minimize API calls

## 📂 Files Created

### Core Utilities

- **`src/lib/geolocation.ts`** - Geolocation utilities and distance calculations
  - `calculateDistance()` - Haversine formula implementation
  - `getCurrentLocation()` - Browser geolocation API wrapper
  - `geocodeLocation()` - Convert address to coordinates
  - `reverseGeocode()` - Convert coordinates to address
  - `sortByDistance()` - Generic distance-based sorting
  - `formatDistance()` - Human-readable distance formatting

### Hooks

- **`src/hooks/use-geolocation.ts`** - React hook for geolocation
  - Manages geolocation state
  - Handles permission requests
  - Provides loading and error states
  - Auto-request option for immediate location access

## 📝 Files Modified

### Type Definitions

- **`src/lib/types.ts`**
  - Added `Coordinates` interface
  - Added `coordinates` field to `JobPosting`
  - Added `coordinates` field to `UserProfile`
  - Added `distance` field to both types (calculated at runtime)

### Job Listings

- **`src/app/jobs/page.tsx`**
  - Integrated geolocation hook
  - Added location toggle button
  - Implemented distance-based sorting
  - Geocoding for job locations
  - Toast notifications for location status

- **`src/components/jobs/job-card.tsx`**
  - Added distance display with Navigation icon
  - Formatted distance shown when available
  - Highlighted in primary color for visibility

### Candidate Search

- **`src/app/candidates/page.tsx`**
  - Integrated geolocation hook
  - Added location toggle button
  - Implemented distance-based sorting
  - Geocoding for candidate locations
  - Toast notifications for location status

- Updated `CandidateCard` component
  - Added distance display with Navigation icon
  - Enhanced location display with MapPin icon
  - Formatted distance shown when available

## 🎯 How It Works

### User Flow

#### For Job Seekers (Finding Jobs)

1. User visits `/jobs` page
2. Clicks "Sort by Location" button
3. Browser requests location permission
4. If granted, jobs are sorted by distance
5. Distance shown on each job card
6. Can toggle off to return to date sorting

#### For Recruiters (Finding Candidates)

1. User visits `/candidates` page
2. Clicks "Sort by Location" button
3. Browser requests location permission
4. If granted, candidates are sorted by distance
5. Distance shown on each candidate card
6. Can toggle off to return to default sorting

### Technical Flow

```text
1. User clicks location toggle
   ↓
2. useGeolocation hook requests browser location
   ↓
3. Browser prompts user for permission
   ↓
4. If granted: coordinates stored in state
   ↓
5. Geocoding service converts location strings to coordinates
   ↓
6. Distance calculated using Haversine formula
   ↓
7. Results sorted by distance
   ↓
8. Distance displayed on cards
```

## 🔧 Technical Details

### Distance Calculation

Uses the Haversine formula to calculate great-circle distance between two points on Earth:

```typescript
const R = 6371; // Earth's radius in km
const dLat = toRad(lat2 - lat1);
const dLon = toRad(lon2 - lon1);

const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
          
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
const distance = R * c;
```

### Geocoding Service

Uses OpenStreetMap Nominatim API (free, no API key required):
- **Geocoding**: `https://nominatim.openstreetmap.org/search`
- **Reverse Geocoding**: `https://nominatim.openstreetmap.org/reverse`
- Rate limit: 1 request per second
- User-Agent header required

### Data Storage

**Firebase Firestore Schema Updates:**

```typescript
// job_postings collection
{
  id: string;
  title: string;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  // ... other fields
}

// public_profiles collection
{
  id: string;
  firstName: string;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  // ... other fields
}
```

## 🎨 UI Components

### Location Toggle Button

**States:**
- **Default**: "Sort by Location" with MapPin icon
- **Loading**: "Getting Location..." with spinning Navigation icon
- **Active**: "Nearby Jobs/Candidates" with Navigation icon and "Active" badge
- **Disabled**: When permission denied or loading

### Distance Display

- Shown below location string
- Navigation icon for visual indication
- Primary color for emphasis
- Format: "1.5km away" or "250m away"

## 🔒 Privacy & Permissions

### Browser Permissions

- Location access requested only when user clicks toggle
- Permission prompt shown by browser
- Can be denied without breaking functionality
- Permission state cached by browser

### Data Privacy

- Coordinates not stored in database by default
- Calculated on-the-fly when location sorting enabled
- User location never shared with other users
- No tracking or persistent storage

## 📊 Performance Considerations

### Optimization Strategies

1. **Lazy Geocoding**: Only geocode when location sorting enabled
2. **Caching**: Browser geolocation cached for 5 minutes
3. **Batch Processing**: Geocode multiple locations efficiently
4. **Client-Side Sorting**: No server load for distance calculations
5. **Conditional Rendering**: Distance only shown when available

### Potential Improvements

- [ ] Cache geocoded coordinates in database
- [ ] Implement server-side geocoding for better performance
- [ ] Add distance radius filter (e.g., within 50km)
- [ ] Use Google Maps Geocoding API for better accuracy
- [ ] Implement geospatial queries in Firestore

## 🚀 Usage Examples

### Enable Location Sorting (Jobs)

```typescript
// User clicks button
handleLocationToggle()
  ↓
// Request location if not available
if (!coordinates) await requestLocation()
  ↓
// Enable sorting
setSortByLocation(true)
  ↓
// Jobs automatically re-sorted by distance
```

### Geocode a Location

```typescript
const coords = await geocodeLocation("San Francisco, CA");
// Returns: { latitude: 37.7749, longitude: -122.4194 }
```

### Calculate Distance

```typescript
const distance = calculateDistance(
  { latitude: 37.7749, longitude: -122.4194 },
  { latitude: 34.0522, longitude: -118.2437 }
);
// Returns: 559.1 (km)
```

## 🧪 Testing

### Manual Testing Steps

1. **Test Location Permission**

   ```text
   - Visit /jobs page
   - Click "Sort by Location"
   - Allow location permission
   - Verify jobs are sorted by distance
   - Verify distance shown on cards
   ```

2. **Test Permission Denial**

   ```text
   - Visit /jobs page
   - Click "Sort by Location"
   - Deny location permission
   - Verify graceful error handling
   - Verify button disabled state
   ```

3. **Test Candidate Sorting**

   ```text
   - Visit /candidates page
   - Click "Sort by Location"
   - Allow location permission
   - Verify candidates sorted by distance
   - Verify distance shown on cards
   ```

4. **Test Toggle Off**

   ```text
   - Enable location sorting
   - Click button again to disable
   - Verify return to default sorting
   - Verify distance no longer shown
   ```

### Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🌐 API Rate Limits

### Nominatim (OpenStreetMap)

- **Limit**: 1 request per second
- **Usage Policy**: <https://operations.osmfoundation.org/policies/nominatim/>
- **Alternative**: Google Maps Geocoding API (requires API key)

## 💡 Future Enhancements

### Short Term

- [ ] Add distance radius filter (e.g., "Within 25km")
- [ ] Show map view of jobs/candidates
- [ ] Add "Use my location" in search filters
- [ ] Cache geocoded coordinates in database

### Long Term

- [ ] Implement geospatial queries in Firestore
- [ ] Add commute time estimation (using routing APIs)
- [ ] Support multiple location preferences
- [ ] Add location-based notifications
- [ ] Implement location history/favorites

## 📚 Dependencies

### New Dependencies

None! Uses only browser APIs and free services.

### Browser APIs Used

- `navigator.geolocation` - For user location
- `fetch` - For geocoding API calls

### External Services

- OpenStreetMap Nominatim (free geocoding)

## 🔗 Related Documentation

- [Geolocation API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)
- [Nominatim API](https://nominatim.org/release-docs/latest/api/Overview/)

---

## Summary

✅ **Location-based recommendations fully implemented**

- Jobs sorted by distance from user
- Candidates sorted by distance from user
- Distance displayed on all cards
- Privacy-focused with permission-based access
- No additional dependencies required
- Works on all modern browsers

**Users can now discover nearby opportunities and talent with a single click!** 🎉
