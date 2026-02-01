# Supabase Connection Setup Guide

## 🎯 Objective
Connect the ITEDA Smart Dryer Platform to Supabase cloud database.

**Supabase Project**: `srwhtmefvsuzzoxhdpes`  
**Dashboard URL**: https://supabase.com/dashboard/project/srwhtmefvsuzzoxhdpes

---

## 📋 Prerequisites

Before proceeding, gather the following credentials from your [Supabase Dashboard](https://supabase.com/dashboard/project/srwhtmefvsuzzoxhdpes):

### 1. **Database Connection String**
Navigate to: **Project Settings** → **Database** → **Connection string**

You'll need the **Connection pooling** string in **Transaction mode**:
```
postgresql://postgres.srwhtmefvsuzzoxhdpes:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 2. **API Keys**
Navigate to: **Project Settings** → **API**

You'll need:
- **Project URL**: `https://srwhtmefvsuzzoxhdpes.supabase.co`
- **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (Keep this secret!)

---

## 🔧 Step 1: Update Environment Variables

Update your `.env` file with the Supabase credentials:

```env
# Supabase Database Configuration
DATABASE_URL="postgresql://postgres.srwhtmefvsuzzoxhdpes:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Supabase API Configuration
NEXT_PUBLIC_SUPABASE_URL="https://srwhtmefvsuzzoxhdpes.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"

# JWT Secret (keep your existing one or generate new)
JWT_SECRET="smart-dry-monitor-jwt-secret-2024-secure-key"
```

**Important Notes:**
- Replace `[YOUR-PASSWORD]` with your Supabase database password
- Replace `[YOUR-ANON-KEY]` with your actual anon key
- Replace `[YOUR-SERVICE-ROLE-KEY]` with your actual service role key
- Keep `JWT_SECRET` for custom authentication

---

## 📦 Step 2: Apply Database Migrations

Once your `.env` is updated, apply all migrations to your Supabase database:

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref srwhtmefvsuzzoxhdpes

# Push migrations to Supabase
supabase db push
```

### Option B: Manual Migration via Dashboard

1. Go to: https://supabase.com/dashboard/project/srwhtmefvsuzzoxhdpes/editor/sql
2. Copy and paste each migration file from `supabase/migrations/` in order:
   - `20240128_rbac_system.sql`
   - `20240128_dryer_management.sql`
   - `20240128_data_collection.sql`
   - `20240128_alerts_notifications.sql`
   - `20240128_alerts_fix.sql`
   - `20240129_seed_presets.sql`
   - `20240129_system_settings.sql`
   - `20251121080345_8432fcf4-4059-4d14-ae3f-9ab27c7b6453.sql`
   - `20251121080354_f37cd982-2767-4500-9ef4-292d9e88e263.sql`
3. Run each migration

---

## 🧪 Step 3: Test the Connection

After updating your `.env` file:

```bash
# Test database connection
npm run db:test

# Run the platform in development mode
npm run dev
```

Visit `http://localhost:3000` and try signing in/up.

---

## 🔐 Step 4: Seed Initial Data (Optional)

If you need to seed users and dryers:

```bash
# Seed users
npm run db:seed

# Seed dryers
npm run db:seed-dryers

# Or seed all at once
npm run db:seed-all
```

---

## ✅ Verification Checklist

- [ ] `.env` file updated with Supabase credentials
- [ ] `DATABASE_URL` points to Supabase connection pooler
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (server-only)
- [ ] All migrations applied successfully
- [ ] `npm run db:test` passes
- [ ] Platform runs and authentication works
- [ ] Can create/view dryers in the dashboard

---

## 🚀 Production Deployment

### Environment Variables for Production

Add these to your production environment (Vercel, Railway, etc.):

```env
DATABASE_URL=postgresql://postgres.srwhtmefvsuzzoxhdpes:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SUPABASE_URL=https://srwhtmefvsuzzoxhdpes.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
JWT_SECRET=[YOUR-SECURE-JWT-SECRET]
NODE_ENV=production
```

---

## 🔄 Migration from Local PostgreSQL

If you have existing data in your local PostgreSQL database:

### Option 1: Export/Import Data

```bash
# Export local data
pg_dump -h localhost -U postgres -d smart_dry_monitor -f backup.sql

# Import to Supabase (after running migrations)
psql "postgresql://postgres.srwhtmefvsuzzoxhdpes:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" < backup.sql
```

### Option 2: Manual Re-seeding

Simply run the seed scripts after migrations:
```bash
npm run db:seed-all
```

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

## 🆘 Troubleshooting

### Issue: "Connection refused" or timeout errors
- **Solution**: Make sure you're using the connection pooler URL (port 6543), not the direct connection
- Check if your IP is whitelisted in Supabase (Project Settings → Database → Connection pooling)

### Issue: "Password authentication failed"
- **Solution**: Double-check your database password in the connection string
- Reset password in Project Settings → Database if needed

### Issue: Migrations fail
- **Solution**: Check if tables already exist - drop and recreate if testing
- Run migrations one by one to identify which one fails

### Issue: "Invalid API key"
- **Solution**: Verify you're using the correct anon key for client-side and service role key for server-side
- Regenerate keys if they were rotated

---

## 📞 Support

For issues specific to:
- **Supabase**: [Supabase Support](https://supabase.com/dashboard/support)
- **Platform**: Check the developer documentation in `/developer` folder
