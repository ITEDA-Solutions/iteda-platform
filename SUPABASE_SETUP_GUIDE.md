# Supabase Setup Guide

## 🔧 How to Connect Your Supabase Database

### Step 1: Get Your Supabase Credentials

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

### Step 2: Create Environment File

Create a file named `.env.local` in the root directory:

```bash
# In the project root directory
touch .env.local
```

### Step 3: Add Your Credentials

Open `.env.local` and add:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Service (Optional - for alerts)
EMAIL_PROVIDER=console
EMAIL_FROM=noreply@itedasolutions.com
```

**Important:** 
- Replace `your-project` with your actual Supabase project reference
- Replace the keys with your actual keys from Supabase dashboard
- Never commit `.env.local` to git (it's already in .gitignore)

### Step 4: Verify Connection

After adding your credentials, restart the dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 5: Test the Connection

1. Navigate to: `http://localhost:3000/dashboard/data`
2. Click the "Refresh Data" button
3. You should see your Supabase data loaded

---

## 📊 Checking Your Supabase Tables

Your platform expects these tables in Supabase:

### Required Tables:
- ✅ **dryers** - Dryer devices
- ✅ **sensor_readings** - Sensor data from devices
- ✅ **alerts** - System alerts
- ✅ **presets** - Drying presets
- ✅ **farmers** - Dryer owners
- ✅ **regions** - Geographic regions
- ✅ **profiles** - User profiles
- ✅ **user_roles** - User role assignments

### To Check Your Tables:

1. Go to Supabase Dashboard
2. Click on **Table Editor** (left sidebar)
3. You should see all the tables listed above

---

## 🔍 Testing API Endpoints

Once your `.env.local` is configured, test these endpoints:

```bash
# Test dryers endpoint
curl http://localhost:3000/api/data/dryers

# Test alerts endpoint
curl http://localhost:3000/api/data/alerts

# Test presets endpoint
curl http://localhost:3000/api/data/presets

# Test farmers endpoint
curl http://localhost:3000/api/data/farmers

# Test sensor readings
curl http://localhost:3000/api/data/sensor-readings?limit=10
```

---

## 📝 Adding Sample Data (If Tables Are Empty)

If your tables are empty, you can add sample data through Supabase:

### Option 1: Using Supabase Dashboard

1. Go to **Table Editor**
2. Select a table (e.g., `regions`)
3. Click **Insert row**
4. Fill in the data
5. Click **Save**

### Option 2: Using SQL Editor

Go to **SQL Editor** and run:

```sql
-- Insert sample regions
INSERT INTO regions (name, code) VALUES
  ('Rift Valley', 'RV'),
  ('Central', 'CN'),
  ('Coast', 'CS'),
  ('Western', 'WS'),
  ('Eastern', 'ES');

-- Insert sample farmer
INSERT INTO farmers (name, phone, email, farm_business_name) VALUES
  ('John Doe', '+254700000000', 'john@example.com', 'Doe Farms');

-- Insert sample preset
INSERT INTO presets (
  preset_id, crop_type, region, target_temp_c, 
  target_humidity_pct, fan_speed_rpm, duration_hours, is_active
) VALUES
  ('PRESET-001', 'Maize', 'Rift Valley', 45, 35, 1000, 6, true);

-- Insert sample dryer (replace farmer_id and region_id with actual UUIDs)
INSERT INTO dryers (
  dryer_id, serial_number, status, deployment_date,
  owner_id, region_id
) VALUES
  ('DRY-2024-001', 'SN12345', 'idle', NOW(),
  (SELECT id FROM farmers LIMIT 1),
  (SELECT id FROM regions WHERE code = 'RV' LIMIT 1)
);
```

---

## 🚨 Troubleshooting

### Error: "Missing Supabase environment variables"
- Check that `.env.local` exists in the root directory
- Verify all three environment variables are set
- Restart the dev server

### Error: "Failed to fetch dryers"
- Check your Supabase project is active
- Verify the URL and keys are correct
- Check Supabase Dashboard → Settings → API for correct values

### Error: "Could not find a relationship"
- Your database schema might be different
- Check the Supabase Table Editor to see actual table names
- Verify foreign key relationships exist

### No Data Showing
- Check if tables have data in Supabase Dashboard
- Use SQL Editor to verify: `SELECT * FROM dryers;`
- Check browser console for errors (F12)

---

## 📱 Next Steps After Setup

Once connected, you can:

1. **View Data**: Navigate to `/dashboard/data` to see all tables
2. **View Dryers**: Go to `/dashboard/dryers` for dryer management
3. **View Alerts**: Go to `/dashboard/alerts` for alert monitoring
4. **View Presets**: Go to `/dashboard/presets` for preset management

---

## 🔐 Security Notes

- ✅ `.env.local` is in `.gitignore` - never commit it
- ✅ Use `NEXT_PUBLIC_` prefix only for client-safe values
- ✅ Keep `SUPABASE_SERVICE_ROLE_KEY` secret - it has admin access
- ✅ Use Row Level Security (RLS) in Supabase for production

---

## 📞 Need Help?

If you're still having issues:

1. Check the browser console (F12) for errors
2. Check the terminal where `npm run dev` is running
3. Verify your Supabase project is not paused
4. Check Supabase logs in Dashboard → Logs

---

**Your platform is ready to connect to Supabase!** 🚀

Just add your credentials to `.env.local` and restart the server.
