# Dryer Management System Documentation

## ✅ Implementation Complete

The comprehensive dryer management system has been implemented with all required features for dryer registration and information display.

---

## 🎯 Features Implemented

### **6.2.1 Dryer Registration**

All required registration fields have been implemented:

#### **Dryer Identification**
- ✅ **Unique Dryer ID** - Text field, must be unique across system
- ✅ **Serial Number** - Hardware serial number, must be unique
- ✅ **Deployment Date** - Date picker for when dryer was deployed

#### **Installation Location**
- ✅ **GPS Coordinates** - Latitude and Longitude (decimal degrees)
  - Manual entry supported
  - **"Get Current Location" button** - Uses browser geolocation API
  - Precision: 8 decimal places for latitude, longitude
- ✅ **Physical Address** - Text area for location description

#### **Owner Information**
- ✅ **Name** - Owner's full name (required)
- ✅ **Contact Phone** - Phone number with validation
- ✅ **Contact Email** - Email address with validation
- ✅ **Address** - Owner's physical address
- ✅ **Farm/Business Name** - Optional business name

### **6.2.2 Dryer Information Display**

Comprehensive information display with multiple data points:

#### **Current Status**
- ✅ **Status Badge** - Color-coded status indicator
  - 🟢 **Active** - Green (dryer is running)
  - ⚪ **Inactive** - Gray (dryer is idle)
  - 🟡 **Maintenance** - Yellow (under maintenance)
  - 🔴 **Offline** - Red (not communicating)
  - ⚫ **Decommissioned** - Slate (retired)

#### **Communication Status**
- ✅ **Last Communication Timestamp** - Shows when dryer last sent data
- ✅ **Communication Status Indicator**
  - 🟢 Online - Last communication < 5 minutes
  - 🔵 Recent - Last communication < 1 hour
  - 🟡 Today - Last communication < 24 hours
  - 🔴 Offline - Last communication > 24 hours or never

#### **Operational Metrics**
- ✅ **Total Runtime Hours** - Cumulative operating hours
- ✅ **Deployment Duration** - Time since deployment (years, months, days)
- ✅ **Active Alerts Count** - Number of current alerts
- ✅ **Battery Level** - Percentage with visual progress bar
- ✅ **Battery Voltage** - Current voltage reading
- ✅ **Signal Strength** - Network signal percentage

#### **Location Details**
- ✅ **Region Name** - Assigned region
- ✅ **GPS Coordinates** - Clickable link to Google Maps
- ✅ **Physical Address** - Installation location
- ✅ **Deployment Date** - Formatted date display

#### **Owner Details**
- ✅ **Owner Name** - Full name
- ✅ **Farm/Business Name** - Business identifier
- ✅ **Contact Phone** - Clickable tel: link
- ✅ **Contact Email** - Clickable mailto: link
- ✅ **Owner Address** - Physical address

#### **Additional Information**
- ✅ **Current Crop Type** - Active drying preset
- ✅ **Assigned Technician** - Field technician name

---

## 📊 Database Schema

### **Tables Created**

#### **1. owners**
Stores dryer owner/farmer information:
```sql
- id (UUID, Primary Key)
- name (TEXT, NOT NULL)
- contact_phone (TEXT)
- contact_email (TEXT)
- address (TEXT)
- farm_business_name (TEXT)
- id_number (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### **2. dryers** (Enhanced)
Comprehensive dryer information:
```sql
-- Registration Fields
- id (UUID, Primary Key)
- dryer_id (TEXT, UNIQUE, NOT NULL)
- serial_number (TEXT, UNIQUE, NOT NULL)
- deployment_date (TIMESTAMPTZ, NOT NULL)

-- Location Fields
- location_latitude (DECIMAL(10,8))
- location_longitude (DECIMAL(11,8))
- location_address (TEXT)
- region_id (UUID, FK to regions)

-- Owner Reference
- owner_id (UUID, FK to owners)

-- Status Fields
- status (dryer_status ENUM)
- last_communication (TIMESTAMPTZ)
- total_runtime_hours (DECIMAL(10,2))

-- Hardware Configuration
- num_temp_sensors (INTEGER)
- num_humidity_sensors (INTEGER)
- num_fans (INTEGER)
- num_heaters (INTEGER)
- solar_capacity_w (INTEGER)
- battery_capacity_ah (INTEGER)

-- Operational Data
- current_preset_id (UUID, FK to presets)
- battery_level (INTEGER)
- battery_voltage (DECIMAL(5,2))
- signal_strength (INTEGER)
- active_alerts_count (INTEGER)
- assigned_technician_id (UUID, FK to profiles)

-- Metadata
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### **3. dryer_details** (View)
Comprehensive view joining all related data:
```sql
SELECT 
  - All dryer fields
  - region_name (from regions)
  - deployment_duration_days (calculated)
  - communication_status (calculated)
  - owner_name, owner_phone, owner_email, owner_address
  - farm_business_name
  - assigned_technician_name
  - current_crop_type
```

---

## 🔧 Components Created

### **1. DryerRegistrationForm.tsx**
Modal form component for registering new dryers.

**Features:**
- Multi-section form (Dryer Info, Location, Owner)
- GPS location capture via browser API
- Region selection dropdown
- Date picker for deployment date
- Form validation
- Supabase integration
- Success/error toast notifications

**Usage:**
```tsx
import { DryerRegistrationForm } from '@/components/DryerRegistrationForm';

<DryerRegistrationForm
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={() => refreshDryerList()}
/>
```

### **2. DryerInfoCard.tsx**
Comprehensive dryer information display component.

**Features:**
- Status badge with color coding
- Communication status indicator
- Operational metrics grid
- Location information with Google Maps link
- Owner contact details with clickable links
- Battery level progress bar
- Signal strength indicator
- Responsive grid layout

**Usage:**
```tsx
import { DryerInfoCard } from '@/components/DryerInfoCard';

<DryerInfoCard dryer={dryerData} />
```

---

## 🚀 Setup Instructions

### **Step 1: Run Supabase Migration**

1. Go to **Supabase Dashboard**: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor**
4. Copy contents of: `supabase/migrations/20240128_dryer_management.sql`
5. Paste and click **"Run"**

This creates:
- `owners` table
- Enhanced `dryers` table
- `dryer_details` view
- Row Level Security policies
- Indexes for performance
- Helper functions

### **Step 2: Add Sample Regions** (Optional)

```sql
INSERT INTO public.regions (name, code) VALUES
  ('Nairobi', 'NRB'),
  ('Central', 'CEN'),
  ('Coast', 'CST'),
  ('Western', 'WST'),
  ('Eastern', 'EST'),
  ('Nyanza', 'NYZ'),
  ('Rift Valley', 'RFT'),
  ('North Eastern', 'NET');
```

### **Step 3: Test Registration**

1. Navigate to dryers page
2. Click "Register New Dryer"
3. Fill in all required fields
4. Use "Get Current Location" for GPS
5. Submit form
6. Verify dryer appears in list

---

## 🎨 UI/UX Features

### **Registration Form**
- **Responsive Design** - Works on desktop and mobile
- **GPS Capture** - One-click location capture
- **Validation** - Required fields marked with *
- **Error Handling** - Clear error messages
- **Loading States** - Spinner during submission

### **Information Display**
- **Color-Coded Status** - Visual status indicators
- **Real-Time Updates** - Shows communication freshness
- **Clickable Links** - Phone, email, and maps integration
- **Progress Bars** - Visual battery level
- **Formatted Dates** - Human-readable timestamps
- **Responsive Grid** - Adapts to screen size

---

## 🔒 Security & Permissions

### **Row Level Security Policies**

#### **Owners Table**
- ✅ All authenticated users can view owners
- ✅ Super admins can manage all owners
- ✅ Admins can create and update owners

#### **Dryers Table**
- ✅ Super admins and admins can view all dryers
- ✅ Regional managers can view dryers in their region
- ✅ Field technicians can view assigned dryers only
- ✅ Super admins can manage all dryers
- ✅ Admins can create and update dryers
- ✅ Regional managers can update dryers in their region
- ✅ Field technicians can update assigned dryers

### **Permission Checks**

**Registration:**
- Only Super Admins and Admins can register new dryers
- Form is hidden for Regional Managers and Field Technicians

**Viewing:**
- Super Admin/Admin: See all dryers
- Regional Manager: See only regional dryers
- Field Technician: See only assigned dryers

**Editing:**
- Super Admin: Edit all fields
- Admin: Edit all fields except deletion
- Regional Manager: Edit status and basic info for regional dryers
- Field Technician: Edit basic info for assigned dryers only

---

## 📱 Features by Role

### **Super Admin**
- ✅ Register new dryers
- ✅ View all dryers
- ✅ Edit all dryer information
- ✅ Delete dryers
- ✅ Manage owners
- ✅ Assign technicians
- ✅ Change dryer status

### **Admin**
- ✅ Register new dryers
- ✅ View all dryers
- ✅ Edit dryer information
- ✅ Manage owners
- ✅ Assign technicians
- ✅ Change dryer status

### **Regional Manager**
- ✅ View regional dryers
- ✅ View dryer details
- ✅ Update dryer status
- ✅ View owner information
- ❌ Cannot register new dryers
- ❌ Cannot edit owner information

### **Field Technician**
- ✅ View assigned dryers
- ✅ View dryer details
- ✅ Update basic dryer information
- ✅ View owner contact details
- ❌ Cannot register new dryers
- ❌ Cannot change dryer status
- ❌ Cannot edit owner information

---

## 🧪 Testing Checklist

### **Registration Testing**
- [ ] Open registration form
- [ ] Fill in dryer ID and serial number
- [ ] Select deployment date
- [ ] Click "Get Current Location"
- [ ] Verify GPS coordinates populated
- [ ] Enter location address
- [ ] Select region
- [ ] Enter owner information
- [ ] Submit form
- [ ] Verify success message
- [ ] Check dryer appears in list

### **Display Testing**
- [ ] View dryer details
- [ ] Verify status badge shows correct color
- [ ] Check communication status indicator
- [ ] Verify runtime hours displayed
- [ ] Check deployment duration calculation
- [ ] Verify GPS link opens Google Maps
- [ ] Test phone number click-to-call
- [ ] Test email click-to-email
- [ ] Verify battery level progress bar
- [ ] Check all owner details display

### **Permission Testing**
- [ ] Super admin can register dryers
- [ ] Admin can register dryers
- [ ] Regional manager cannot register dryers
- [ ] Field technician cannot register dryers
- [ ] Regional manager sees only regional dryers
- [ ] Field technician sees only assigned dryers

---

## 📊 Data Validation

### **Required Fields**
- Dryer ID (must be unique)
- Serial Number (must be unique)
- Deployment Date
- Owner Name

### **Optional Fields**
- GPS Coordinates
- Location Address
- Region
- Owner Contact Details
- Farm/Business Name

### **Data Types**
- GPS Coordinates: Decimal (8 decimal places)
- Dates: ISO 8601 format
- Phone: Text (no strict validation)
- Email: Email format validation

---

## 🎯 Key Features Summary

✅ **Complete Dryer Registration**
- Unique dryer ID and serial number
- Deployment date tracking
- GPS location capture
- Owner information management

✅ **Comprehensive Information Display**
- Current status with color coding
- Last communication timestamp
- Total runtime hours tracking
- Deployment duration calculation
- Battery and signal monitoring
- Owner contact details
- Location with maps integration

✅ **Role-Based Access Control**
- Registration restricted to admins
- Regional filtering for managers
- Assignment filtering for technicians

✅ **Database Integration**
- Supabase tables and views
- Row Level Security policies
- Automatic timestamp updates
- Calculated fields

✅ **User Experience**
- GPS location capture
- Responsive design
- Loading states
- Error handling
- Clickable contact links
- Visual status indicators

---

## 📁 Files Created/Modified

**Created:**
- `supabase/migrations/20240128_dryer_management.sql` - Database migration
- `src/components/DryerRegistrationForm.tsx` - Registration form
- `src/components/DryerInfoCard.tsx` - Information display
- `developer/DRYER_MANAGEMENT.md` - This documentation

**Database Objects:**
- `public.owners` table
- Enhanced `public.dryers` table
- `public.dryer_details` view
- RLS policies for owners and dryers
- Helper functions for calculations

---

## ✅ System Ready

The dryer management system is fully implemented and ready for use:

1. ✅ Run the Supabase migration
2. ✅ Add sample regions (optional)
3. ✅ Start registering dryers
4. ✅ View comprehensive dryer information
5. ✅ Monitor dryer status and metrics

All features from section 6.2 have been successfully implemented! 🎉
