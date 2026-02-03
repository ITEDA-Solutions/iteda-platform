# Migration Summary

## Reason for Migration

This migration was carried out to **keep the codebase small, simple, and free of unnecessary dependencies**.

By standardizing on the Supabase client:
- We reduced dependency overhead by removing Drizzle ORM from the API layer
- Simplified database access patterns across routes
- Avoided maintaining parallel schema, migration, and query abstractions
- Improved maintainability by using a single, well-supported data access approach

The goal is a **leaner backend**, fewer moving parts, and faster onboarding for developers.

---

## Changes Overview

### Created

- `src/lib/supabase-db.ts`  
  Centralized Supabase admin client using a singleton pattern for reuse across API routes.

---

## Updated API Routes

### Data Routes

- `app/api/data/profiles/route.ts`
- `app/api/data/dryers/route.ts`
- `app/api/data/staff-roles/route.ts`
- `app/api/data/regions/route.ts`
- `app/api/data/alerts/route.ts`
- `app/api/data/presets/route.ts`
- `app/api/data/dryer-assignments/route.ts`
- `app/api/data/farmers/route.ts`
- `app/api/data/sensor-readings/route.ts`

---

### Dryer Routes

- `app/api/dryers/route.ts`
- `app/api/dryers/[id]/route.ts`
- `app/api/dryers/[id]/assign-preset/route.ts`

---

### Staff Routes

- `app/api/staff/route.ts`
- `app/api/staff/[id]/route.ts`

---

### Alert Routes

- `app/api/alerts/[id]/acknowledge/route.ts`
- `app/api/alerts/[id]/resolve/route.ts`
- `app/api/alerts/[id]/assign/route.ts`
- `app/api/alerts/[id]/dismiss/route.ts`
- `app/api/alerts/generate/route.ts`

---

### Other Routes

- `app/api/presets/route.ts`
- `app/api/presets/[id]/route.ts`
- `app/api/regions/route.ts`
- `app/api/users/route.ts`
- `app/api/users/[id]/route.ts`
- `app/api/dryer-assignments/route.ts`
- `app/api/dryer-assignments/[id]/route.ts`
- `app/api/export/sensor-data/route.ts`
- `app/api/export/alerts/route.ts`
- `app/api/auth/user-role/route.ts`
- `app/api/sensor-data/route.ts`
- `app/api/operational-events/route.ts`
- `app/api/settings/route.ts`
- `app/api/db/[table]/route.ts`

---

## Key Changes

- All API routes now use `getSupabaseAdmin()` from `@/lib/supabase-db`
- Removed inline `createClient` usage across routes
- Replaced Drizzle ORM queries with Supabase client methods
- Fixed Next.js 16 async route parameters issue  
  (`params` is now awaited as it is a Promise)
- `drizzle.config.ts` and related schema files are no longer used by API routes  
  They may be kept for reference or removed if no longer needed

---

## Result

- Smaller dependency surface
- Fewer abstractions to maintain
- Consistent data access across the API
- Cleaner, more predictable backend behavior