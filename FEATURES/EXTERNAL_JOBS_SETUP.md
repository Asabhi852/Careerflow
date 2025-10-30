# External Jobs Feature - Quick Setup Guide

## 🎉 What's New

Your Careerflow jobs dashboard now fetches jobs from **LinkedIn** and **Naukri.com** in addition to internal postings!

## 🚀 Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Navigate to Jobs Dashboard

Visit: `http://localhost:9002/dashboard/jobs`

### 3. Explore the Features

- **All Jobs Tab**: See jobs from all sources combined
- **Internal Tab**: View only platform-specific jobs
- **LinkedIn Tab**: Browse LinkedIn jobs
- **Naukri.com Tab**: Browse Naukri jobs
- **Refresh Button**: Update external job listings

## 📁 Files Created/Modified

### New Files
- `src/lib/job-scrapers.ts` - Job fetching logic
- `src/hooks/use-external-jobs.ts` - React hook for external jobs
- `src/app/api/jobs/external/route.ts` - API endpoint
- `docs/EXTERNAL_JOB_INTEGRATION.md` - Full documentation

### Modified Files
- `src/lib/types.ts` - Added source fields to JobPosting type
- `src/app/dashboard/jobs/page.tsx` - Enhanced with tabs and filtering
- `src/components/jobs/job-card.tsx` - Support for external jobs

## ⚠️ Important: Current Implementation

**This is a DEMO implementation using mock data.** For production use:

### Option 1: Use Official APIs (Recommended)
```typescript
// Example: LinkedIn Jobs API
const response = await fetch('https://api.linkedin.com/v2/jobs', {
  headers: {
    'Authorization': `Bearer ${process.env.LINKEDIN_API_KEY}`
  }
});
```

### Option 2: Use Third-Party Services
- **Adzuna API**: Free tier available - https://developer.adzuna.com/
- **RapidAPI**: Multiple job search APIs - https://rapidapi.com/
- **The Muse API**: https://www.themuse.com/developers/api/v2

### Option 3: Implement Web Scraping (Carefully)
- Must respect robots.txt
- Follow terms of service
- Implement rate limiting
- Use proper user agents

## 🔧 To Integrate Real APIs

1. **Get API Keys**
   - Sign up for job API services
   - Obtain API credentials

2. **Add Environment Variables**
   ```bash
   # .env.local
   LINKEDIN_API_KEY=your_key_here
   NAUKRI_API_KEY=your_key_here
   ```

3. **Update job-scrapers.ts**
   - Replace mock data with real API calls
   - Add error handling
   - Implement rate limiting

4. **Test Thoroughly**
   ```bash
   npm run dev
   # Visit /dashboard/jobs and test all tabs
   ```

## 🎨 UI Features

### Tabs
- Filter jobs by source with a single click
- Job count badges on each tab
- Smooth transitions between views

### Job Cards
- **Source Badge**: Shows where the job came from
- **External Link Icon**: Indicates external jobs
- **Direct Links**: Click to view on original platform
- **Save Jobs**: Bookmark any job (internal or external)

### Refresh Button
- Manually refresh external job listings
- Loading spinner during fetch
- Only appears for external job tabs

## 📊 Data Flow

```
User clicks tab
    ↓
useExternalJobs hook triggered
    ↓
Calls /api/jobs/external
    ↓
job-scrapers.ts fetches data
    ↓
Jobs displayed in dashboard
```

## 🐛 Troubleshooting

### No Jobs Showing?
- Check browser console for errors
- Verify the API endpoint is running
- Currently shows mock data - this is expected

### Tabs Not Working?
- Clear browser cache
- Restart dev server
- Check for TypeScript errors

### External Links Not Opening?
- Verify job has `externalUrl` field
- Check browser popup blocker settings

## 📚 Next Steps

1. **Review Documentation**: See `docs/EXTERNAL_JOB_INTEGRATION.md`
2. **Integrate Real APIs**: Replace mock data with actual API calls
3. **Add More Sources**: Extend to Indeed, Glassdoor, etc.
4. **Implement Caching**: Add Redis or similar for performance
5. **Add Search**: Implement search/filter functionality

## 💡 Tips

- **Mock Data**: Current implementation returns sample jobs - perfect for testing UI
- **Customization**: Easily add more job sources by following the pattern in `job-scrapers.ts`
- **Performance**: Consider implementing pagination for large result sets
- **Caching**: Cache API responses to reduce external API calls

## 🎯 Testing Checklist

- [ ] All tabs load without errors
- [ ] Job counts display correctly
- [ ] External links open in new tab
- [ ] Refresh button works
- [ ] Save job functionality works
- [ ] Mobile responsive design
- [ ] Loading states display properly
- [ ] Error states handled gracefully

## 📞 Support

Need help? Check:
- Full documentation in `docs/EXTERNAL_JOB_INTEGRATION.md`
- Code comments in source files
- Project README

---

**Happy Job Hunting! 🎯**
