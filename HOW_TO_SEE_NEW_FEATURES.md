# How to See the New Features

## 🚀 Quick Start Guide

All the features have been implemented in the code. Here's how to see them in your browser:

---

## Step 1: Make Sure Your Server is Running

Open a terminal and run:

```bash
cd "/home/esther-zawadi/Downloads/iteda-platform-developer (1)"
npm run dev
```

The server should start on: **http://localhost:3000**

---

## Step 2: Sign In as Super Admin

1. Go to: **http://localhost:3000/auth**
2. Sign in with: **estherzawadi887@gmail.com**
3. (Make sure you ran the SQL script to make yourself Super Admin)

---

## Step 3: See the Enhanced Dryer List

1. Navigate to: **http://localhost:3000/dashboard/dryers**

**What you should see:**
- ✅ **Green "Register Dryer" button** in the top-right corner
- ✅ **Battery indicators** with color-coded icons (green/yellow/red)
- ✅ **Signal strength** indicators
- ✅ **Alert count badges** (red badge if alerts, green "No alerts" if clean)
- ✅ **Last communication** timestamps (e.g., "5m ago", "2h ago")
- ✅ **Days active** counter with runtime hours
- ✅ **Refresh button** to reload data

**If you don't see these:**
- Press **Ctrl+Shift+R** (hard refresh) to clear cache
- Or press **F12** → Go to "Application" tab → Click "Clear storage" → Reload

---

## Step 4: Register a New Dryer

1. Click the **green "Register Dryer" button**
2. You'll be taken to: **http://localhost:3000/dashboard/dryers/register**

**What you should see:**
- ✅ **4-tab wizard interface:**
  - **Basic Info** tab (Dryer ID auto-generated, serial number, date, status)
  - **Location** tab (GPS coordinates, "Get GPS" button, address, region)
  - **Hardware** tab (sensor counts, solar capacity, battery capacity)
  - **Owner** tab (name, phone, email, farm name, ID number)

**Try it:**
1. **Basic Info Tab:**
   - Dryer ID is already filled (e.g., DRY-2026-001)
   - Enter serial number: `SN123456789`
   - Select deployment date
   - Choose status: "Idle"
   - Click **"Next"**

2. **Location Tab:**
   - Click **"Get GPS"** button to capture your location
   - Or manually enter coordinates
   - Enter address
   - Select a region from dropdown
   - Click **"Next"**

3. **Hardware Tab:**
   - Temperature Sensors: 3
   - Humidity Sensors: 2
   - Fans: 1
   - Heaters: 1
   - Solar Capacity: 100 (W)
   - Battery Capacity: 100 (Ah)
   - Click **"Next"**

4. **Owner Tab:**
   - Enter owner name: `John Kamau`
   - Enter phone: `+254700000000`
   - Enter email (optional)
   - Enter address
   - Enter farm name (optional)
   - Enter ID number (optional)
   - Click **"Register Dryer"**

**Result:**
- ✅ Success message appears
- ✅ Form resets
- ✅ New dryer is created in database
- ✅ Go back to dryers list to see it

---

## Step 5: View Individual Dryer Details

1. Go to: **http://localhost:3000/dashboard/dryers**
2. Click **"View Details"** button on any dryer

**What you should see:**

### **Header Section:**
- Dryer ID and serial number
- Status badge
- **"Export Data"** button (placeholder)
- **"Generate Report"** button (placeholder)
- **"Back"** button

### **Real-time Metrics Cards (4 cards):**
- 🔋 **Battery Level** - Shows percentage and voltage
- 📶 **Signal Strength** - Shows percentage
- 🚨 **Active Alerts** - Shows count
- ⏱️ **Runtime** - Shows hours and days active

### **Tabbed Interface:**

**Overview Tab:**
- Location information (address, region, GPS coordinates)
- Status details (deployment date, last communication)

**Hardware Tab:**
- Temperature sensors count
- Humidity sensors count
- Number of fans
- Number of heaters
- Solar capacity (W)
- Battery capacity (Ah)

**Owner Tab:**
- Owner name
- Phone number
- Email address

**Preset Tab:**
- Active preset details
- Crop type
- Region

---

## Step 6: Verify Auto-Generated Dryer IDs

Every time you register a new dryer, the ID auto-increments:
- First dryer: `DRY-2026-001`
- Second dryer: `DRY-2026-002`
- Third dryer: `DRY-2026-003`
- And so on...

The year changes automatically based on current year.

---

## 🔍 Troubleshooting

### Issue: "Register Dryer" button not visible

**Solution:**
1. Make sure you're signed in as **Super Admin**
2. Check your role badge in top-right corner (should say "Super Admin" in red)
3. If not Super Admin, run the SQL script: `scripts/make-super-admin.sql`

### Issue: Page shows "Access Denied"

**Solution:**
1. You need Super Admin role to register dryers
2. Run the SQL script in Supabase to make yourself Super Admin
3. Sign out and sign in again

### Issue: Changes not visible

**Solution:**
1. **Hard refresh:** Press **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac)
2. **Clear cache:** F12 → Application → Clear storage → Reload
3. **Restart dev server:** Stop (Ctrl+C) and run `npm run dev` again

### Issue: "Get GPS" button doesn't work

**Solution:**
1. Your browser needs permission to access location
2. Click "Allow" when prompted
3. If blocked, go to browser settings and enable location for localhost
4. Or manually enter GPS coordinates

### Issue: Form submission fails

**Solution:**
1. Check browser console (F12) for errors
2. Make sure all required fields are filled (marked with *)
3. Check that Supabase connection is working
4. Verify `.env` file has correct credentials

### Issue: Dryer details page shows "Dryer not found"

**Solution:**
1. Make sure the dryer exists in database
2. Check that you have permission to view it
3. Try refreshing the dryers list first
4. Check browser console for API errors

---

## 📱 Mobile/Responsive View

All pages are responsive and work on mobile devices:
- Registration form adapts to smaller screens
- Dryer list shows fewer columns on mobile
- Detail page tabs stack vertically
- All buttons and inputs are touch-friendly

---

## 🎯 Quick Navigation

Here are all the URLs you can visit:

### Main Pages:
- **Dashboard:** http://localhost:3000/dashboard
- **Dryers List:** http://localhost:3000/dashboard/dryers
- **Register Dryer:** http://localhost:3000/dashboard/dryers/register
- **Dryer Details:** http://localhost:3000/dashboard/dryers/[id]
- **Alerts:** http://localhost:3000/dashboard/alerts
- **Analytics:** http://localhost:3000/dashboard/analytics
- **Staff:** http://localhost:3000/dashboard/staff
- **Presets:** http://localhost:3000/dashboard/presets
- **Data Viewer:** http://localhost:3000/dashboard/data

### Authentication:
- **Sign In:** http://localhost:3000/auth
- **Landing Page:** http://localhost:3000

---

## ✅ Verification Checklist

Use this checklist to verify all features are working:

### Enhanced Dryer List:
- [ ] Green "Register Dryer" button visible
- [ ] Battery indicators show color-coded icons
- [ ] Signal strength indicators visible
- [ ] Alert count badges show (red if alerts, green if none)
- [ ] Last communication shows human-readable time
- [ ] Days active counter displays
- [ ] Runtime hours visible
- [ ] "View Details" buttons work

### Dryer Registration:
- [ ] Registration page loads at `/dashboard/dryers/register`
- [ ] Dryer ID is auto-generated (DRY-2026-###)
- [ ] 4 tabs visible (Basic, Location, Hardware, Owner)
- [ ] "Get GPS" button works
- [ ] Region dropdown populated from database
- [ ] Form validates required fields
- [ ] "Next" and "Previous" buttons work
- [ ] "Register Dryer" button submits form
- [ ] Success message appears after registration
- [ ] Form resets after successful registration

### Dryer Detail Page:
- [ ] Detail page loads at `/dashboard/dryers/[id]`
- [ ] Header shows dryer ID and serial number
- [ ] Status badge displays
- [ ] 4 metric cards show (Battery, Signal, Alerts, Runtime)
- [ ] 4 tabs work (Overview, Hardware, Owner, Preset)
- [ ] Overview tab shows location and status
- [ ] Hardware tab shows sensor counts and specs
- [ ] Owner tab shows contact information
- [ ] Preset tab shows active preset
- [ ] "Back" button returns to list
- [ ] Export and Report buttons visible (placeholders)

---

## 🎉 Success!

If you can see and use all these features, congratulations! Your Phase 1 Week 2-3 implementation is complete.

**Next:** Week 4-5 Alert System (alert generation, email notifications, acknowledgment)

---

## 📞 Need Help?

If something isn't working:
1. Check browser console (F12) for errors
2. Check terminal for server errors
3. Verify Supabase connection in `.env` file
4. Make sure you're signed in as Super Admin
5. Try hard refresh (Ctrl+Shift+R)
6. Restart development server

---

**Last Updated:** February 2, 2026  
**Status:** All Week 2-3 features implemented and ready to use
