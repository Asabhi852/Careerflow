# Location Feature - Quick Start Guide

## 🎯 What's New?

Your CareerFlow application now works **exactly like Zomato** - automatically detecting user location and showing nearby jobs and candidates!

## 🚀 How It Works

### For Job Seekers (Finding Jobs)

1. **Visit the Jobs Page** (`/jobs`)
2. **Location banner appears** at the bottom after 1 second
3. **Click "Enable Location"** to allow access
4. **Jobs automatically sorted** by distance from you
5. **See distance** on each job card (e.g., "2.5km away")
6. **Location indicator** shows your current location at the top

### For Recruiters (Finding Candidates)

1. **Visit the Candidates Page** (`/candidates`)
2. **Location banner appears** at the bottom after 1 second
3. **Click "Enable Location"** to allow access
4. **Candidates automatically sorted** by distance from you
5. **See distance** on each candidate card
6. **Location indicator** shows your current location at the top

## 📱 User Interface

### Location Permission Banner (Bottom of Page)

```
┌──────────────────────────────────────────────────┐
│  📍  Enable Location Access                  ✕   │
│      Get personalized recommendations            │
│      for jobs and candidates near you            │
│                                                   │
│      [📍 Enable Location]  [Not Now]             │
└──────────────────────────────────────────────────┘
```

**When to show:**
- First time visiting the page
- Location permission not yet granted
- User hasn't dismissed it

**Actions:**
- **Enable Location**: Requests browser location permission
- **Not Now**: Dismisses banner for current session
- **X button**: Closes banner

### Location Indicator (Top of Results)

```
┌──────────────────────────────────────────────────┐
│  📍 Showing jobs near you                        │
│     San Francisco, CA                      [▼]   │
└──────────────────────────────────────────────────┘
```

**When to show:**
- Location permission granted
- User location detected
- Results being sorted by distance

**Click dropdown to:**
- **Update Location**: Refresh your current location
- **Disable Location**: Turn off location-based sorting

### Job/Candidate Cards with Distance

```
┌──────────────────────────────────────────────────┐
│  Software Engineer                               │
│  💼 Tech Corp                                    │
│  📍 San Francisco, CA                            │
│  🧭 2.5km away          ← Distance shown here    │
│  💰 $120,000                                     │
│                                                   │
│  [View Details]                                  │
└──────────────────────────────────────────────────┘
```

## 🎬 Complete User Flow

### Scenario 1: First-Time User

```
Step 1: User visits /jobs
        ↓
Step 2: Page loads normally
        ↓
Step 3: After 1 second, banner slides up from bottom
        ↓
Step 4: User clicks "Enable Location"
        ↓
Step 5: Browser shows permission dialog
        ↓
Step 6: User clicks "Allow"
        ↓
Step 7: Jobs automatically re-sort by distance
        ↓
Step 8: Distance shown on each job card
        ↓
Step 9: Location indicator appears at top
        ↓
Step 10: User can browse nearby jobs!
```

### Scenario 2: Returning User (Location Already Enabled)

```
Step 1: User visits /jobs
        ↓
Step 2: Location detected automatically (cached)
        ↓
Step 3: Jobs sorted by distance immediately
        ↓
Step 4: No banner shown (already granted)
        ↓
Step 5: Location indicator visible at top
        ↓
Step 6: User sees nearby jobs instantly!
```

### Scenario 3: User Changes Location

```
Step 1: User clicks location dropdown
        ↓
Step 2: Selects "Update Location"
        ↓
Step 3: Browser detects new location
        ↓
Step 4: Results automatically re-sort
        ↓
Step 5: Toast notification: "Location Updated"
        ↓
Step 6: User sees jobs near new location
```

### Scenario 4: User Disables Location

```
Step 1: User clicks location dropdown
        ↓
Step 2: Selects "Disable Location"
        ↓
Step 3: localStorage cleared
        ↓
Step 4: Page reloads
        ↓
Step 5: Back to default date-based sorting
        ↓
Step 6: No distance shown on cards
```

## 🔧 Technical Details

### Files Created

1. **`src/components/location/location-banner.tsx`**
   - Bottom permission banner
   - Auto-appears on first visit
   - Handles permission flow

2. **`src/components/location/location-indicator.tsx`**
   - Top location dropdown
   - Shows current location
   - Allows location management

### Files Modified

1. **`src/app/jobs/page.tsx`**
   - Auto-requests location on load
   - Auto-sorts by distance
   - Shows location banner and indicator

2. **`src/app/candidates/page.tsx`**
   - Auto-requests location on load
   - Auto-sorts by distance
   - Shows location banner and indicator

3. **`src/components/jobs/job-card.tsx`**
   - Displays distance when available
   - Navigation icon for visual clarity

### Key Functions

```typescript
// Auto-request location on page load
const { coordinates, locationString } = useGeolocation(true);
                                                      // ↑ true = auto-request

// Auto-enable sorting when location available
useEffect(() => {
  if (coordinates && !sortByLocation) {
    setSortByLocation(true);
  }
}, [coordinates]);

// Sort results by distance
const sortedJobs = sortByDistance(
  jobs,
  userCoordinates,
  (job) => job.coordinates
);
```

## 🎨 Customization

### Change Banner Delay

```typescript
// In location-banner.tsx
const timer = setTimeout(() => {
  setIsVisible(true);
}, 1000); // Change this value (milliseconds)
```

### Change Location Cache Duration

```typescript
// In geolocation.ts - getCurrentLocation()
{
  maximumAge: 300000, // 5 minutes (change this)
}
```

### Customize Banner Text

```typescript
// In location-banner.tsx
<h3>Enable Location Access</h3>
<p>Get personalized recommendations...</p>
// ↑ Edit these texts
```

## 📊 Permission States

| State | Banner Visible | Location Active | Results Sorted |
|-------|---------------|-----------------|----------------|
| Not Requested | ✅ Yes | ❌ No | ❌ By Date |
| Granted | ❌ No | ✅ Yes | ✅ By Distance |
| Denied | ❌ No | ❌ No | ❌ By Date |
| Dismissed | ❌ No | ❌ No | ❌ By Date |

## 🔒 Privacy

### What's Stored

- **localStorage**: Only permission state ('granted', 'denied', 'dismissed')
- **Memory**: Coordinates cached for 5 minutes
- **Database**: Nothing (coordinates not stored)

### What's Shared

- **With Other Users**: Nothing
- **With Server**: Nothing
- **With Third Parties**: Nothing (uses free OpenStreetMap API)

### User Control

✅ Can dismiss banner anytime
✅ Can deny permission
✅ Can disable location later
✅ Can update location anytime
✅ Clear indication when active

## 🧪 Testing Checklist

### Basic Tests

- [ ] Visit `/jobs` - banner appears after 1 second
- [ ] Click "Enable Location" - permission requested
- [ ] Allow permission - jobs sorted by distance
- [ ] Distance shown on job cards
- [ ] Location indicator visible at top
- [ ] Click dropdown - menu appears
- [ ] Select "Update Location" - location refreshes
- [ ] Select "Disable Location" - page reloads

### Edge Cases

- [ ] Deny permission - banner disappears, default sorting
- [ ] Click "Not Now" - banner dismisses
- [ ] Revisit page - banner doesn't show again (if granted)
- [ ] Clear localStorage - banner shows again
- [ ] Mobile browser - works correctly
- [ ] Slow network - loading states work

## 🎯 Success Metrics

### User Engagement

- **Higher permission grant rate** - Beautiful banner vs browser prompt
- **Faster job discovery** - Nearby jobs shown first
- **Better matches** - Location-based recommendations
- **Reduced bounce rate** - Relevant results immediately

### Technical Performance

- **Fast load times** - Location cached for 5 minutes
- **Low API calls** - Geocoding only when needed
- **Smooth UX** - No blocking operations
- **Error resilience** - Graceful fallbacks

## 🆘 Troubleshooting

### Banner Not Appearing

**Check:**
1. localStorage has no 'location_permission' key
2. Not on mobile with location disabled
3. JavaScript enabled
4. No console errors

### Location Not Detected

**Check:**
1. Browser supports geolocation
2. HTTPS connection (required for geolocation)
3. Permission granted in browser settings
4. No VPN blocking location

### Distance Not Showing

**Check:**
1. Job/candidate has location string
2. Geocoding successful (check console)
3. User coordinates available
4. sortByLocation is true

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify HTTPS connection
3. Test in different browser
4. Clear localStorage and retry

---

## 🎉 Summary

Your application now provides a **Zomato-like experience** with:

✅ Automatic location detection
✅ Beautiful permission banner
✅ Nearby results by default
✅ Easy location management
✅ Privacy-focused design
✅ Professional UX

**Users will love the seamless experience!** 🚀
