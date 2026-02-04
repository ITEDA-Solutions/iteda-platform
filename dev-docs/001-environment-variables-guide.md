# Environment Variables Security Guide

## What Was Done

### 1. Removed Sensitive Files from Git Tracking

The following files containing **real credentials** were removed from git tracking:

- `.env` - Main environment file with Supabase credentials
- `.env.development` - Development-specific variables
- `.env.production` - Production-specific variables

**Command used:**
```bash
git rm --cached .env .env.development .env.production
```

This removes the files from git's index (tracking) but keeps them locally on your machine.

### 2. Updated `.gitignore`

Added comprehensive rules to prevent any `.env` files from being committed:

```gitignore
# Environment files (NEVER commit secrets!)
.env
.env.local
.env.development
.env.production
.env.development.local
.env.test.local
.env.production.local
.env.*.local
*.local

# Keep only .env.example committed
!.env.example
```

### 3. Created Comprehensive `.env.example`

A template file documenting all required environment variables with:
- Clear descriptions for each variable
- Placeholder values showing the expected format
- Grouping by category (Supabase, Database, Auth, etc.)
- Comments explaining where to find each value

### 4. Consolidated Environment Files

Simplified from 3 separate files to 1:

| Before | After |
|--------|-------|
| `.env` | `.env` (single source of truth) |
| `.env.development` | *(deleted)* |
| `.env.production` | *(deleted)* |
| `.env.example` | `.env.example` (template) |

---

## Why This Matters

### Security Risks of Committed Secrets

When credentials are committed to git:

1. **They live forever in history** - Even after deletion, anyone can view them via `git log` or by cloning the repo
2. **Public exposure** - If the repo is public (or becomes public), credentials are immediately compromised
3. **Bot scraping** - Automated bots constantly scan GitHub for exposed API keys and credentials
4. **Supply chain attacks** - Compromised credentials can lead to data breaches, unauthorized access, or financial loss

### What Was Exposed

The following sensitive data was in your git history:

| Secret | Risk Level | Action Required |
|--------|------------|-----------------|
| `DATABASE_URL` with password | **CRITICAL** | Rotate password |
| `SUPABASE_SERVICE_ROLE_KEY` | **CRITICAL** | Regenerate key |
| `SUPABASE_JWT_SECRET` | **CRITICAL** | Regenerate secret |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Medium | Regenerate key |
| `JWT_SECRET` | **CRITICAL** | Change secret |
| `POSTGRES_PASSWORD` | **CRITICAL** | Rotate password |

---

## The Way Forward

### Immediate Actions Required

#### 1. Rotate All Compromised Credentials

**Supabase Dashboard** (https://supabase.com/dashboard):
- Go to **Settings > API**
- Click "Regenerate" for both `anon` and `service_role` keys
- Copy new JWT secret from **Settings > API > JWT Settings**

**Database Password**:
- Go to **Settings > Database**
- Change the database password

#### 2. Update Local `.env`

After rotating credentials, update your local `.env` file with the new values.

#### 3. Update Production Environment

If deployed (Vercel, etc.), update environment variables there too:
- Vercel: Project Settings > Environment Variables
- Other platforms: Check their documentation

#### 4. Consider Cleaning Git History (Optional)

To fully remove secrets from history, you can use:

```bash
# Using git-filter-repo (recommended)
pip install git-filter-repo
git filter-repo --path .env --invert-paths
git filter-repo --path .env.development --invert-paths
git filter-repo --path .env.production --invert-paths
```

**Warning:** This rewrites history and requires force-pushing. Coordinate with your team.

### Best Practices Going Forward

#### Do's

- **Always** copy `.env.example` to `.env` when setting up the project
- **Keep** `.env.example` updated when adding new variables
- **Use** different credentials for development vs production
- **Store** production secrets in your deployment platform (Vercel, AWS, etc.)
- **Review** `.gitignore` before committing

#### Don'ts

- **Never** commit real credentials to git
- **Never** share `.env` files via Slack, email, or other channels
- **Never** use production credentials in development
- **Never** hardcode secrets in source code

---

## How Environment Variables Work in Next.js

### Loading Order (Priority: highest to lowest)

1. `.env.$(NODE_ENV).local` (e.g., `.env.development.local`)
2. `.env.local`
3. `.env.$(NODE_ENV)` (e.g., `.env.development`)
4. `.env`

### When Each File Loads

| Command | NODE_ENV | Files Loaded |
|---------|----------|--------------|
| `npm run dev` | development | `.env.development.local` > `.env.local` > `.env.development` > `.env` |
| `npm run build` | production | `.env.production.local` > `.env.local` > `.env.production` > `.env` |
| `npm run start` | production | `.env.production.local` > `.env.local` > `.env.production` > `.env` |

### Variable Prefixes

| Prefix | Available In | Use For |
|--------|--------------|---------|
| `NEXT_PUBLIC_` | Browser + Server | Public config (API URLs, feature flags) |
| *(no prefix)* | Server only | Secrets (API keys, DB credentials) |

---

## Setting Up a New Development Environment

```bash
# 1. Clone the repository
git clone <repo-url>
cd iteda-platform

# 2. Copy the example environment file
cp .env.example .env

# 3. Fill in your credentials in .env
# Get values from Supabase dashboard or team lead

# 4. Install dependencies
npm install

# 5. Run the development server
npm run dev
```

---

## Quick Reference

### Required Variables

```env
# Minimum required for app to run
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
DATABASE_URL=postgres://...
JWT_SECRET=your-secret
```

### Where to Find Values

| Variable | Location |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Settings > API > anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Settings > API > service_role |
| `DATABASE_URL` | Supabase > Settings > Database > Connection string |
| `SUPABASE_JWT_SECRET` | Supabase > Settings > API > JWT Settings |

---

## Related Documentation

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Git - Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
