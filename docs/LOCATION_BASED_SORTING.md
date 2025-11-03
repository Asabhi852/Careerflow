# 📍 Location-Based Sorting Feature

## Overview

Careerflow automatically sorts **Jobs** and **Candidates** based on your **live location** to show the most relevant opportunities and talent near you.

---

## ✨ Features

### **Automatic Location Detection**
- ✅ **Auto-request** - Automatically asks for location permission on page load
- ✅ **Live Updates** - Uses real-time GPS coordinates
- ✅ **Distance Calculation** - Shows exact distance from your location
- ✅ **Smart Sorting** - Nearest items appear first

### **Privacy & Control**
- ✅ **Permission-based** - Only works if you grant location access
- ✅ **Optional** - Can browse without location
- ✅ **Transparent** - Clear indicators when location is active
- ✅ **Update Anytime** - Refresh location with one click

---

## 🎯 How It Works

### **1. Jobs Page** (`/jobs`)

#### **Location Request**
When you visit the jobs page:
1. Browser asks for location permission
2. If granted, GPS coordinates are captured
3. Jobs are automatically sorted by distance
4. Distance shown on each job card

#### **Sorting Logic**
```typescript
// Jobs sorted by distance from your location
if (userLocation && jobLocation) {
  distance = calculateDistance(userLocation, jobLocation);
  sortByDistance(jobs, distance);
}
```

#### **Visual Indicators**
- 🧭 **Navigation icon** - Shows you're using location
- 📍 **Distance badge** - "2.5 km away" on each job
- 🗺️ **Location string** - "Showing jobs near Bangalore, India"
- 🔄 **Update button** - Refresh your location

---

### **2. Candidates Page** (`/candidates`)

#### **Location Request**
When you visit the candidates page:
1. Browser asks for location permission
2. If granted, GPS coordinates are captured
3. Candidates are automatically sorted by distance
4. Distance shown on each candidate card

#### **Sorting Logic**
```typescript
// Candidates sorted by distance from your location
if (userLocation && candidateLocation) {
  distance = calculateDistance(userLocation, candidateLocation);
  sortByDistance(candidates, distance);
}
```

#### **Visual Indicators**
- 🧭 **Navigation icon** - Shows you're using location
- 📍 **Distance badge** - "5.2 km away" on each candidate
- 🗺️ **Location string** - "Showing candidates near you"
- 🔄 **Update button** - Refresh your location

---

## 📊 Distance Calculation

### **Algorithm**
Uses the **Haversine formula** to calculate great-circle distance between two points on Earth:

```typescript
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}
```

### **Accuracy**
- ✅ **GPS-based** - Uses device GPS for precise location
- ✅ **Real-time** - Updates as you move
- ✅ **Geocoding** - Converts addresses to coordinates
- ✅ **Reverse Geocoding** - Converts coordinates to readable addresses

---

## 🗺️ Geocoding

### **What is Geocoding?**
Converting addresses to geographic coordinates (latitude, longitude).

### **When Used**
- **Jobs**: When job location is text (e.g., "Bangalore, India")
- **Candidates**: When candidate location is text
- **Caching**: Coordinates cached to avoid repeated API calls

### **Example**
```typescript
// Input
location: "Bangalore, Karnataka, India"

// Geocoding
const coords = await geocodeLocation(location);

// Output
coords: { lat: 12.9716, lng: 77.5946 }
```

---

## 🎨 User Interface

### **Location Banner**
When you first visit:
```
┌─────────────────────────────────────────────────┐
│ 📍 Enable Location for Better Results          │
│                                                 │
│ Allow location access to see jobs/candidates   │
│ sorted by distance from you.                   │
│                                                 │
│ [Enable Location]  [Maybe Later]               │
└─────────────────────────────────────────────────┘
```

### **Location Indicator**
When location is active:
```
┌─────────────────────────────────────────────────┐
│ 🧭 Showing jobs near you                       │
│ 📍 Bangalore, Karnataka, India                 │
│                                    [Update 🔄]  │
└─────────────────────────────────────────────────┘
```

### **Job/Candidate Card**
```
┌─────────────────────────────────────┐
│ Software Engineer                   │
│ Tech Corp                           │
│ 📍 Bangalore                        │
│ 🧭 2.5 km away                      │
│                                     │
│ [View Details]                      │
└─────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### **Files Involved**

1. **`src/hooks/use-geolocation.ts`**
   - Custom hook for location access
   - Auto-request on mount
   - Permission handling
   - Error management

2. **`src/lib/geolocation.ts`**
   - Distance calculation (Haversine)
   - Geocoding functions
   - Reverse geocoding
   - Sorting utilities

3. **`src/app/jobs/page.tsx`**
   - Jobs page with location sorting
   - Auto-enable when coordinates available
   - Distance display on cards

4. **`src/app/candidates/page.tsx`**
   - Candidates page with location sorting
   - Auto-enable when coordinates available
   - Distance display on cards

5. **`src/components/location/location-banner.tsx`**
   - Permission request UI
   - User-friendly messaging

6. **`src/components/location/location-indicator.tsx`**
   - Active location display
   - Update location button

---

## 📱 User Flow

### **First Visit**

1. **User lands on Jobs/Candidates page**
   ```
   → Browser requests location permission
   ```

2. **User grants permission**
   ```
   → GPS coordinates captured
   → Location string generated (reverse geocode)
   → Sorting enabled automatically
   → Banner shows "Showing jobs near [location]"
   ```

3. **User denies permission**
   ```
   → Banner dismissed
   → Default sorting (by date/relevance)
   → No distance shown on cards
   ```

### **Subsequent Visits**

1. **Permission already granted**
   ```
   → Auto-request location
   → Immediate sorting by distance
   → No banner shown
   ```

2. **User moves to new location**
   ```
   → Click "Update Location" button
   → New coordinates captured
   → List re-sorted automatically
   → Toast notification: "Location updated"
   ```

---

## 🎯 Benefits

### **For Job Seekers**
- ✅ **Find nearby jobs** - See opportunities close to home
- ✅ **Reduce commute** - Prioritize local positions
- ✅ **Save time** - No need to manually filter by location
- ✅ **Better matches** - Location-relevant results first

### **For Recruiters**
- ✅ **Find local talent** - See candidates in your area
- ✅ **Reduce relocation costs** - Hire locally
- ✅ **Faster hiring** - Local candidates more available
- ✅ **Better retention** - Local hires stay longer

### **For Platform**
- ✅ **Better UX** - Personalized, relevant results
- ✅ **Higher engagement** - Users find what they need faster
- ✅ **Competitive advantage** - Unique feature
- ✅ **Data insights** - Location-based analytics

---

## 🔒 Privacy & Security

### **Data Collection**
- ✅ **Permission-based** - Only with explicit user consent
- ✅ **Temporary** - Coordinates not stored permanently
- ✅ **Session-only** - Cleared when browser closes
- ✅ **No tracking** - Location not shared with third parties

### **User Control**
- ✅ **Opt-in** - Must grant permission
- ✅ **Opt-out** - Can deny or revoke anytime
- ✅ **Transparent** - Clear indicators when active
- ✅ **Revocable** - Browser settings control access

### **Best Practices**
- ✅ **HTTPS only** - Secure connection required
- ✅ **No storage** - Coordinates not saved to database
- ✅ **Client-side** - Processing done in browser
- ✅ **Minimal data** - Only lat/lng used

---

## 📊 Performance

### **Optimization**
- ✅ **Caching** - Geocoded coordinates cached
- ✅ **Lazy loading** - Geocode only when needed
- ✅ **Debouncing** - Prevent excessive API calls
- ✅ **Efficient sorting** - O(n log n) complexity

### **Loading States**
```typescript
// While getting location
isLoading: true → Show skeleton

// Location obtained
isLoading: false → Show sorted results

// Permission denied
permissionDenied: true → Show default sorting
```

---

## 🐛 Error Handling

### **Common Errors**

1. **Permission Denied**
   ```
   → Show banner: "Location access denied"
   → Fall back to default sorting
   → Option to enable later
   ```

2. **Location Unavailable**
   ```
   → Show error: "Unable to get location"
   → Fall back to default sorting
   → Retry option available
   ```

3. **Geocoding Failed**
   ```
   → Use text-based location matching
   → Show items without distance
   → Continue with partial sorting
   ```

4. **Network Error**
   ```
   → Retry geocoding
   → Cache previous results
   → Graceful degradation
   ```

---

## 🔄 Update Location

### **Manual Update**
Users can update their location anytime:

1. **Click "Update Location" button**
2. **New coordinates captured**
3. **List re-sorted**
4. **Toast notification shown**

### **Auto Update**
Location updates automatically when:
- ✅ **Page refresh** - New request on reload
- ✅ **Tab focus** - Update when returning to tab
- ✅ **Significant movement** - GPS detects location change

---

## 📈 Future Enhancements

### **Planned Features**
- [ ] **Radius filter** - "Show jobs within 10 km"
- [ ] **Map view** - Visual representation of locations
- [ ] **Route planning** - Directions to job/candidate
- [ ] **Commute time** - Estimated travel time
- [ ] **Public transport** - Transit options
- [ ] **Save locations** - Favorite search areas
- [ ] **Location history** - Recent search locations
- [ ] **Multi-location** - Search multiple areas

---

## 🎓 Usage Examples

### **Job Seeker in Bangalore**
```
1. Visit /jobs
2. Grant location permission
3. See jobs sorted by distance:
   - Software Engineer @ Tech Corp (2.5 km)
   - Data Analyst @ StartupXYZ (5.8 km)
   - Product Manager @ BigCo (12.3 km)
4. Apply to nearby jobs first
```

### **Recruiter in Mumbai**
```
1. Visit /candidates
2. Grant location permission
3. See candidates sorted by distance:
   - John Doe - Full Stack Dev (1.2 km)
   - Jane Smith - UI Designer (3.7 km)
   - Bob Johnson - DevOps (8.9 km)
4. Contact local candidates first
```

---

## ✅ Testing Checklist

- [ ] Location permission request appears
- [ ] Coordinates captured correctly
- [ ] Location string displays properly
- [ ] Jobs/Candidates sorted by distance
- [ ] Distance shown on cards
- [ ] Update location button works
- [ ] Permission denial handled gracefully
- [ ] Default sorting works without location
- [ ] Geocoding caches results
- [ ] Performance is acceptable
- [ ] Mobile responsive
- [ ] Works in all browsers

---

## 📞 Support

### **User Issues**

**Q: Location permission not working?**
A: Check browser settings → Site permissions → Location

**Q: Distance seems incorrect?**
A: Click "Update Location" to refresh coordinates

**Q: Don't want to share location?**
A: Click "Maybe Later" - browse without location sorting

**Q: How to disable location?**
A: Browser settings → Site permissions → Block location

---

**Status**: ✅ Fully Implemented
**Version**: 1.0
**Last Updated**: October 31, 2025
