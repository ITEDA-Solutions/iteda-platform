# 🚀 Quick Start - View Your Supabase Data

## ✅ Your Platform is Already Connected!

Your Supabase database is connected and has data. Here's how to view it:

---

## 📊 View Your Data

### Option 1: Data Viewer Page (Recommended)
Navigate to: **http://localhost:3000/dashboard/data**

This page shows ALL your Supabase tables in one place:
- Dryers
- Alerts  
- Sensor Readings
- Presets (✅ **20 presets already loaded!**)
- Regions
- User Roles

### Option 2: Individual Pages

1. **Presets** - http://localhost:3000/dashboard/presets
   - ✅ Shows all 20 presets (Maize, Chili, Beans, Banana, Coffee, Tea, Rice, Sorghum)
   - View by crop type and region
   - See temperature, humidity, fan speed settings

2. **Dryers** - http://localhost:3000/dashboard/dryers
   - View all registered dryers
   - See status, battery level, location
   - Search and filter

3. **Alerts** - http://localhost:3000/dashboard/alerts
   - Monitor system alerts
   - Filter by status (Active, Acknowledged, Resolved)
   - View by severity (Critical, Warning, Info)

---

## 🎯 What Data You Currently Have

Based on the API response, you have:

### ✅ Presets (20 items)
- **Maize**: Rift Valley, Central, Western, Coast
- **Chili**: Rift Valley, Coast, Eastern
- **Beans**: Western, Nyanza, Central
- **Banana**: Coast, Western
- **Coffee**: Central, Eastern
- **Tea**: Rift Valley, Central
- **Rice**: Western, Nyanza
- **Sorghum**: Eastern, North Eastern

All presets are **active** and ready to use!

---

## 🔍 Check Other Tables

### Via Browser:
1. Go to: http://localhost:3000/dashboard/data
2. Click on each tab to see data

### Via API:
```bash
# Check dryers
curl http://localhost:3000/api/data/dryers

# Check alerts
curl http://localhost:3000/api/data/alerts

# Check sensor readings
curl http://localhost:3000/api/data/sensor-readings?limit=10

# Check presets (already working!)
curl http://localhost:3000/api/data/presets
```

---

## 📝 Add More Data (If Needed)

If you want to add dryers, owners, or other data:

### Option 1: Via Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your project: **srwhtmefvsuzzoxhdpes**
3. Click **Table Editor**
4. Select a table (e.g., `dryers`)
5. Click **Insert row**
6. Fill in the data
7. Click **Save**

### Option 2: Via SQL Editor
1. Go to Supabase Dashboard → **SQL Editor**
2. Run SQL commands to insert data

Example - Add a region:
```sql
INSERT INTO regions (name, code) VALUES ('Rift Valley', 'RV');
```

Example - Add a dryer:
```sql
INSERT INTO dryers (
  dryer_id, 
  serial_number, 
  status, 
  deployment_date,
  region_id
) VALUES (
  'DRY-2024-001',
  'SN12345',
  'idle',
  NOW(),
  (SELECT id FROM regions WHERE code = 'RV' LIMIT 1)
);
```

---

## ✅ Your Data is Live!

Your platform is **already displaying real Supabase data**. 

Just navigate to:
- **/dashboard/data** - See everything
- **/dashboard/presets** - See your 20 presets
- **/dashboard/dryers** - Manage dryers
- **/dashboard/alerts** - Monitor alerts

**No additional setup needed!** 🎉

---

## 🔧 Troubleshooting

### If you see "No data found":
- The table might be empty in Supabase
- Check Supabase Dashboard → Table Editor
- Add sample data using the methods above

### If you see errors:
- Check browser console (F12)
- Check terminal where `npm run dev` is running
- Verify server is running on http://localhost:3000

---

## 📞 Your Supabase Project

- **Project URL**: https://srwhtmefvsuzzoxhdpes.supabase.co
- **Project ID**: srwhtmefvsuzzoxhdpes
- **Dashboard**: https://supabase.com/dashboard/project/srwhtmefvsuzzoxhdpes

---

**Your platform is ready to use!** 🚀
