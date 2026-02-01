# iTeda Solutions Platform - Project Structure

## 📁 Current Project Structure (After Cleanup)

```
iteda-platform-developer/
│
├── app/                          # Next.js App Router (Main Application)
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── signin/route.ts
│   │   │   ├── signup/route.ts
│   │   │   └── session/route.ts
│   │   ├── users/                # User management (Super Admin only)
│   │   │   ├── route.ts          # GET all users, POST create user
│   │   │   └── [id]/route.ts     # GET/PUT/DELETE specific user
│   │   ├── dryers/               # Dryer management (Role-filtered)
│   │   │   ├── route.ts          # GET all dryers, POST create dryer
│   │   │   └── [id]/
│   │   │       ├── route.ts      # GET/PUT/DELETE specific dryer
│   │   │       └── assign-preset/route.ts
│   │   ├── dryer-assignments/    # Technician assignments (Admin+)
│   │   │   ├── route.ts          # GET all, POST assign
│   │   │   └── [id]/route.ts     # DELETE assignment
│   │   ├── regions/              # Region management
│   │   │   └── route.ts          # GET all (all roles), POST (Super Admin)
│   │   ├── export/               # Data export (Admin+ only)
│   │   │   ├── sensor-data/route.ts
│   │   │   └── alerts/route.ts
│   │   ├── presets/              # Preset management
│   │   ├── sensor-data/          # Sensor data endpoints
│   │   ├── operational-events/   # Event logging
│   │   └── health/               # Health check
│   │
│   ├── dashboard/                # Dashboard Pages
│   │   ├── layout.tsx            # Dashboard layout
│   │   ├── page.tsx              # Main dashboard
│   │   ├── alerts/page.tsx       # Alerts page
│   │   ├── analytics/page.tsx    # Analytics page
│   │   ├── dryers/page.tsx       # Dryers list
│   │   ├── dryer/[id]/page.tsx   # Dryer detail
│   │   ├── presets/page.tsx      # Presets management
│   │   ├── register-dryer/page.tsx # Register new dryer
│   │   ├── staff/page.tsx        # Staff management (Super Admin)
│   │   └── users/page.tsx        # User management (Super Admin)
│   │
│   ├── auth/                     # Auth pages
│   │   └── page.tsx              # Sign in/Sign up
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── not-found.tsx             # 404 page
│   └── providers.tsx             # React Query provider
│
├── src/                          # Source files
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── ... (50+ UI components)
│   │   ├── dashboard/            # Dashboard components
│   │   │   ├── StatsCard.tsx
│   │   │   └── DryerStatusBadge.tsx
│   │   ├── dryer-detail/         # Dryer detail components
│   │   │   ├── TemperatureChart.tsx
│   │   │   ├── HumidityChart.tsx
│   │   │   ├── PowerMetrics.tsx
│   │   │   └── SensorMetrics.tsx
│   │   ├── PermissionGuard.tsx   # RBAC UI guard ✨
│   │   ├── ProtectedRoute.tsx    # Route protection
│   │   ├── Layout.tsx            # App layout
│   │   ├── AppSidebar.tsx        # Navigation sidebar
│   │   ├── DryerMap.tsx          # Dryer location map
│   │   └── ... (20+ components)
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── usePermissions.tsx    # RBAC permissions hook ✨
│   │   ├── useUserRole.tsx       # User role hook ✨
│   │   ├── useCanAccessDryer.tsx # Dryer access hook ✨
│   │   └── use-mobile.tsx
│   │
│   ├── lib/                      # Core libraries
│   │   ├── permissions.ts        # RBAC permission definitions ✨
│   │   ├── rbac-middleware.ts    # RBAC API middleware ✨
│   │   ├── auth.ts               # Authentication service
│   │   ├── db.ts                 # Database connection
│   │   ├── schema.ts             # Database schema (Drizzle)
│   │   ├── api-client.ts         # API client utilities
│   │   └── utils.ts              # Utility functions
│   │
│   ├── integrations/
│   │   └── supabase/             # Supabase integration
│   │       ├── client.ts
│   │       └── types.ts
│   │
│   └── index.css                 # Global styles
│
├── supabase/                     # Supabase configuration
│   ├── migrations/               # Database migrations
│   │   ├── 20240128_rbac_system.sql        # RBAC tables ✨
│   │   ├── 20240128_data_collection.sql    # Data collection
│   │   ├── 20240128_dryer_management.sql   # Dryer tables
│   │   ├── 20240128_alerts_notifications.sql
│   │   └── ... (9 migrations)
│   └── config.toml               # Supabase config
│
├── scripts/                      # Utility scripts
│   ├── test-rbac.js             # RBAC system tester ✨ NEW
│   ├── test-db.js               # Database connection test
│   ├── test-auth.js             # Auth system test
│   ├── seed-users.js            # Seed users
│   ├── seed-dryers.js           # Seed dryers
│   ├── database-summary.js      # DB summary
│   ├── deploy.sh                # Deployment script
│   ├── cron/                    # Cron job scripts
│   │   ├── daily-cleanup.sh
│   │   ├── hourly-aggregation.sh
│   │   └── setup-cron.sh
│   └── iot/
│       └── send-sensor-data.py  # IoT data sender
│
├── developer/                    # Developer documentation
│   ├── RBAC_USER_ROLES.md       # Complete RBAC docs ✨ NEW
│   ├── RBAC_SETUP_GUIDE.md      # RBAC setup guide ✨ NEW
│   ├── RBAC_IMPLEMENTATION_SUMMARY.md
│   ├── RBAC_VERIFICATION.md
│   ├── RBAC_SYSTEM.md
│   ├── DASHBOARD_RBAC_INTEGRATION.md
│   ├── CONFIGURATION_GUIDE.md
│   ├── DATABASE_SETUP.md
│   ├── DRYER_MANAGEMENT.md
│   ├── IOT_INTEGRATION_GUIDE.md
│   └── ... (13 docs)
│
├── firmware/                     # Arduino firmware
│   └── v1-platform-connected/
│       ├── solar_dryer_phase1.ino
│       └── README.md
│
├── public/                       # Static assets
│   ├── favicon.svg
│   ├── iteda-logo.png
│   └── placeholder.svg
│
├── Configuration Files
├── .env                         # Environment variables
├── .env.development
├── .env.production
├── .gitignore
├── package.json                 # Dependencies + scripts
├── tsconfig.json                # TypeScript config
├── next.config.js               # Next.js config
├── tailwind.config.ts           # Tailwind CSS config
├── postcss.config.js
├── eslint.config.js
├── drizzle.config.ts            # Drizzle ORM config
├── components.json              # shadcn/ui config
├── Dockerfile                   # Docker configuration
└── docker-compose.yml

├── Documentation
├── README.md                             # Project README
├── RBAC_IMPLEMENTATION.md               # RBAC quick ref ✨ NEW
├── CLEANUP_AND_RBAC_SUMMARY.md          # Cleanup summary ✨ NEW
├── PROJECT_STRUCTURE.md                 # This file ✨ NEW
├── SETUP_COMPLETE.md
├── MIGRATION_STATUS.md
├── AUTH_FIX_SUMMARY.md
└── SUPABASE_DEPLOYMENT_GUIDE.md
```

**✨ = New or Updated for RBAC Implementation**

---

## 🗂️ Key Directories Explained

### `/app` - Next.js App Router
The main application using Next.js 13+ App Router:
- **`/api`** - Server-side API routes with RBAC protection
- **`/dashboard`** - Protected dashboard pages
- **`/auth`** - Authentication pages

### `/src` - Source Code
Core application logic and components:
- **`/components`** - React components (UI + business logic)
- **`/hooks`** - Custom React hooks (including RBAC hooks)
- **`/lib`** - Core libraries (permissions, auth, db)
- **`/integrations`** - Third-party integrations

### `/supabase` - Database
Database schema and migrations:
- **`/migrations`** - SQL migration files
- Includes RBAC system tables

### `/scripts` - Automation
Utility scripts for testing and maintenance:
- **`test-rbac.js`** - Automated RBAC testing
- **`seed-*.js`** - Database seeding
- **`/cron`** - Scheduled jobs

### `/developer` - Documentation
Comprehensive developer documentation:
- RBAC guides and references
- Setup and configuration docs
- System architecture docs

---

## 🔑 RBAC System Files

### Core Permission System
```
src/lib/
├── permissions.ts           # Permission definitions
└── rbac-middleware.ts       # API middleware
```

### Frontend Hooks
```
src/hooks/
├── usePermissions.tsx       # Main permissions hook
├── useUserRole.tsx          # User role hook
└── useCanAccessDryer.tsx    # Dryer access hook
```

### UI Components
```
src/components/
└── PermissionGuard.tsx      # Permission-based rendering
```

### API Routes
```
app/api/
├── users/                   # Super Admin only
├── dryers/                  # Role-filtered
├── dryer-assignments/       # Admin+ only
├── regions/                 # Super Admin create
└── export/                  # Admin+ only
```

### Database
```
supabase/migrations/
└── 20240128_rbac_system.sql # RBAC tables
```

### Documentation
```
developer/
├── RBAC_USER_ROLES.md       # Complete reference
└── RBAC_SETUP_GUIDE.md      # Setup guide

(root)/
├── RBAC_IMPLEMENTATION.md   # Quick reference
└── CLEANUP_AND_RBAC_SUMMARY.md # Implementation summary
```

---

## 🚀 Development Workflow

### 1. Start Development Server
```bash
npm run dev
```
Runs on: http://localhost:3000

### 2. Test RBAC System
```bash
npm run test:rbac
```
Verifies all RBAC components are working

### 3. Build for Production
```bash
npm run build
npm run start
```

---

## 🔐 RBAC Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  ┌──────────────────────────────────────────────┐  │
│  │  usePermissions() Hook                        │  │
│  │  - isSuperAdmin, isAdmin, etc.               │  │
│  │  - canManageUsers, canExportData, etc.       │  │
│  │  - hasPermission(resource, action)           │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  PermissionGuard Component                    │  │
│  │  - Show/hide based on role                   │  │
│  │  - Access denied UI                          │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                API Routes (Next.js)                  │
│  ┌──────────────────────────────────────────────┐  │
│  │  RBAC Middleware                              │  │
│  │  - requireAuth()                              │  │
│  │  - requireRole(['admin', 'super_admin'])     │  │
│  │  - requirePermission('dryers', 'update')     │  │
│  │  - validateExportAccess()                    │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│               Database (Supabase)                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Tables:                                      │  │
│  │  - profiles (users)                          │  │
│  │  - staff_roles (user roles + regions)       │  │
│  │  - dryer_assignments (technician → dryer)   │  │
│  │  - regions (geographic regions)              │  │
│  │  - dryers (with region_id)                   │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 📦 Package Scripts

```json
{
  "dev": "next dev",                          # Start development
  "build": "next build",                       # Build for production
  "start": "next start",                       # Start production
  "lint": "next lint",                         # Run linter
  
  "db:push": "drizzle-kit push",              # Push schema to DB
  "db:generate": "drizzle-kit generate",       # Generate migrations
  "db:migrate": "drizzle-kit migrate",         # Run migrations
  "db:studio": "drizzle-kit studio",           # Open DB studio
  "db:test": "node scripts/test-db.js",       # Test DB connection
  "db:seed": "node scripts/seed-users.js",    # Seed users
  "db:seed-dryers": "node scripts/seed-dryers.js", # Seed dryers
  "db:summary": "node scripts/database-summary.js", # DB summary
  
  "test:rbac": "node scripts/test-rbac.js"    # Test RBAC system ✨
}
```

---

## 🎯 Quick Navigation

### For Developers
- **Permission System**: `src/lib/permissions.ts`
- **API Middleware**: `src/lib/rbac-middleware.ts`
- **React Hooks**: `src/hooks/usePermissions.tsx`
- **UI Guards**: `src/components/PermissionGuard.tsx`

### For Admins
- **Setup Guide**: `developer/RBAC_SETUP_GUIDE.md`
- **Test Script**: `npm run test:rbac`
- **User Roles Doc**: `developer/RBAC_USER_ROLES.md`

### For Reference
- **Quick Start**: `RBAC_IMPLEMENTATION.md`
- **Full Summary**: `CLEANUP_AND_RBAC_SUMMARY.md`
- **API Docs**: `developer/RBAC_USER_ROLES.md`

---

## ✅ What's Changed

### Removed ❌
- `pages/` directory (Pages Router)
- `src/App.tsx`, `src/main.tsx` (Vite files)
- `server.js` (Custom server)

### Added ✨
- `app/api/dryers/` (Role-filtered dryer endpoints)
- `app/api/regions/` (Region management)
- RBAC middleware in export endpoints
- Complete RBAC documentation
- `scripts/test-rbac.js` (Automated testing)

### Updated 🔄
- `package.json` (scripts)
- `Dockerfile` (removed custom server)
- Export API routes (added RBAC)

---

**🎉 Clean, Modern Next.js App with Full RBAC!**

The project structure is now clean and production-ready with comprehensive role-based access control.
