# Duplicate Features Cleanup Plan

## Identified Duplicates

### 1. **AI Job Matching Pages** (CRITICAL DUPLICATES)
```
❌ /dashboard/ai-matches/           - Main location-based matching
❌ /dashboard/ai-matches-enhanced/  - Enhanced version (DUPLICATE)
❌ /dashboard/resume-matcher/        - Resume-based matching (DUPLICATE)
```

**Issue:** Three different pages doing similar job matching with different approaches.

**Recommendation:** 
- ✅ **KEEP:** `/dashboard/ai-matches/` (location-based, recently updated)
- ❌ **DELETE:** `/dashboard/ai-matches-enhanced/` 
- ❌ **DELETE:** `/dashboard/resume-matcher/`

### 2. **AI Matching Hooks** (DUPLICATE FUNCTIONALITY)
```
❌ use-ai-matches.ts              - Basic AI matching
❌ use-enhanced-ai-matches.ts     - Enhanced matching (calls API)
❌ use-resume-job-matching.ts     - Resume-based matching
❌ useLiveRecommendations.ts      - Live location recommendations
```

**Issue:** Multiple hooks doing similar job matching logic.

**Recommendation:**
- ✅ **KEEP:** `use-enhanced-ai-matches.ts` (most complete, uses API)
- ❌ **DELETE:** `use-ai-matches.ts` (redundant)
- ❌ **DELETE:** `use-resume-job-matching.ts` (redundant)
- ⚠️ **REVIEW:** `useLiveRecommendations.ts` (if used elsewhere, keep; else delete)

### 3. **Redirect Page** (UNNECESSARY)
```
❌ /src/app/ai-matches/page.tsx   - Just redirects to /dashboard/ai-matches
```

**Issue:** Unnecessary redirect page.

**Recommendation:**
- ❌ **DELETE:** This file (users should navigate directly to dashboard)

### 4. **AI Matching Components**
```
Directory: /components/ai-matches/
- resume-job-matcher.tsx
```

**Recommendation:**
- ⚠️ **REVIEW:** Check if used, otherwise delete

### 5. **Job Components**
```
Directory: /components/jobs/
- ai-job-matcher.tsx
```

**Recommendation:**
- ⚠️ **REVIEW:** Check if used, otherwise delete

## Cleanup Actions Required

### Phase 1: Delete Duplicate Pages

1. **Delete `/src/app/dashboard/ai-matches-enhanced/`**
   - Remove page.tsx
   - Remove from navigation

2. **Delete `/src/app/dashboard/resume-matcher/`**
   - Remove page.tsx
   - Remove from navigation

3. **Delete `/src/app/ai-matches/`**
   - Remove redirect page

### Phase 2: Delete Duplicate Hooks

1. **Delete `/src/hooks/use-ai-matches.ts`**
2. **Delete `/src/hooks/use-resume-job-matching.ts`**
3. **Review and decide on `/src/hooks/useLiveRecommendations.ts`**

### Phase 3: Update Navigation

Remove references in:
- `/src/app/dashboard/layout.tsx` - Remove duplicate menu items
- `/src/components/layout/main-nav.tsx` - Remove duplicate links
- Any other navigation components

### Phase 4: Update Imports

Search and replace all imports:
```typescript
// Replace
import { useAIMatches } from '@/hooks/use-ai-matches';
// With
import { useEnhancedAIMatches } from '@/hooks/use-enhanced-ai-matches';
```

### Phase 5: Clean Up Unused Components

Review and delete if unused:
- `/components/ai-matches/resume-job-matcher.tsx`
- `/components/jobs/ai-job-matcher.tsx`

## Benefits After Cleanup

✅ **Reduced Confusion** - One clear AI matching feature
✅ **Easier Maintenance** - Single source of truth
✅ **Better Performance** - Less code to load
✅ **Cleaner Codebase** - No redundant files
✅ **Consistent UX** - One unified experience

## Recommended Feature Structure (After Cleanup)

```
src/
├── app/
│   └── dashboard/
│       └── ai-matches/          ← SINGLE AI matching page
│           └── page.tsx
│
├── hooks/
│   └── use-enhanced-ai-matches.ts  ← SINGLE AI matching hook
│
├── components/
│   └── [minimal AI matching components]
│
└── api/
    └── ai/
        └── job-matching/         ← SINGLE API endpoint
            └── route.ts
```

## Migration Steps (Safe Approach)

### Step 1: Deprecate (Don't Delete Yet)
1. Add deprecation warnings to duplicate pages
2. Redirect users to main `/dashboard/ai-matches`
3. Monitor usage for 1 week

### Step 2: Remove from Navigation
1. Remove menu items for duplicates
2. Keep files temporarily with redirect

### Step 3: Final Deletion
1. After confirming no usage, delete files
2. Clean up imports
3. Run build to check for errors

## Files to Delete (Final List)

```bash
# Pages
rm -rf src/app/dashboard/ai-matches-enhanced/
rm -rf src/app/dashboard/resume-matcher/
rm -rf src/app/ai-matches/

# Hooks
rm src/hooks/use-ai-matches.ts
rm src/hooks/use-resume-job-matching.ts

# Review before deleting
# src/hooks/useLiveRecommendations.ts
# src/components/ai-matches/resume-job-matcher.tsx
# src/components/jobs/ai-job-matcher.tsx
```

## Testing Checklist

After cleanup:
- [ ] AI matches page loads correctly
- [ ] Location-based matching works
- [ ] No broken imports
- [ ] Navigation menu updated
- [ ] Build succeeds without errors
- [ ] No console errors
- [ ] All existing features work

## Status

🔍 **Analysis Complete** - Duplicates identified
⏳ **Awaiting Approval** - Ready to execute cleanup
📋 **Plan Ready** - Follow phases above
