# Data Collection System Documentation

## ✅ Implementation Complete

A comprehensive data collection and storage system has been implemented for solar dryers with real-time sensor monitoring, operational event tracking, and configurable data retention policies.

---

## 🎯 Features Implemented

### **6.3.1 Real-Time Sensor Data Collection**

All required sensor data types are captured and stored:

#### **Temperature Sensors** 🌡️
- ✅ **Drying Chamber Temperature** - Main chamber temperature (°C)
- ✅ **Ambient Temperature** - External/environmental temperature (°C)
- ✅ **Heater Temperature** - Heating element temperature (°C)

#### **Humidity Sensors** 💧
- ✅ **Internal Humidity** - Chamber humidity level (%)
- ✅ **External Humidity** - Ambient humidity level (%)

#### **Fan Speed** 🌀
- ✅ **RPM** - Revolutions per minute
- ✅ **Percentage** - Fan speed as percentage of maximum

#### **Operational Status** ⚙️
- ✅ **Heater Status** - ON/OFF with timestamp
- ✅ **Fan Status** - ON/OFF with timestamp
- ✅ **Door Status** - OPEN/CLOSED with timestamp

#### **Power Metrics** 🔋
- ✅ **Solar Panel Voltage** - Solar input voltage (V)
- ✅ **Battery Level** - Battery charge percentage (%)
- ✅ **Battery Voltage** - Battery voltage (V)
- ✅ **Power Consumption** - Current power draw (W)
- ✅ **Charging Status** - Charging/discharging state

### **6.3.2 Data Storage**

#### **Timestamped Storage**
- ✅ All sensor readings stored with precise timestamps
- ✅ Automatic timestamp generation if not provided
- ✅ Timezone-aware storage (TIMESTAMPTZ)

#### **Data Retention Policies**
- ✅ **Detailed Data**: 3 months (90 days) - Full sensor readings
- ✅ **Operational Events**: 1 year (365 days) - Status change events
- ✅ **Hourly Aggregates**: 1 year - Aggregated hourly data
- ✅ **Daily Aggregates**: 5 years - Aggregated daily data
- ✅ **Monthly Aggregates**: Indefinite - Aggregated monthly data

#### **Data Aggregation**
- ✅ Automatic hourly aggregation function
- ✅ Min, max, average calculations
- ✅ Runtime hours tracking
- ✅ Power consumption totals (kWh)

---

## 📊 Database Schema

### **1. sensor_readings Table**

Primary table for real-time sensor data:

```sql
CREATE TABLE sensor_readings (
    id UUID PRIMARY KEY,
    dryer_id UUID REFERENCES dryers(id),
    timestamp TIMESTAMPTZ NOT NULL,
    
    -- Temperature Sensors (°C)
    chamber_temp DECIMAL(5, 2),
    ambient_temp DECIMAL(5, 2),
    heater_temp DECIMAL(5, 2),
    
    -- Humidity Sensors (%)
    internal_humidity DECIMAL(5, 2),
    external_humidity DECIMAL(5, 2),
    
    -- Fan Data
    fan_speed_rpm INTEGER,
    fan_speed_percentage DECIMAL(5, 2),
    fan_status BOOLEAN,
    
    -- Operational Status
    heater_status BOOLEAN,
    door_status BOOLEAN,
    
    -- Power Metrics
    solar_voltage DECIMAL(5, 2),
    battery_level INTEGER,
    battery_voltage DECIMAL(5, 2),
    power_consumption_w DECIMAL(7, 2),
    charging_status TEXT,
    
    -- Metadata
    active_preset_id UUID,
    data_quality_score DECIMAL(3, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_sensor_readings_dryer_timestamp` - Fast dryer + time queries
- `idx_sensor_readings_timestamp` - Time-based queries
- `idx_sensor_readings_dryer_created` - Recent readings per dryer

### **2. operational_events Table**

Tracks operational status changes:

```sql
CREATE TABLE operational_events (
    id UUID PRIMARY KEY,
    dryer_id UUID REFERENCES dryers(id),
    event_type TEXT NOT NULL, -- 'heater_on', 'heater_off', etc.
    timestamp TIMESTAMPTZ NOT NULL,
    previous_state BOOLEAN,
    new_state BOOLEAN,
    triggered_by TEXT, -- 'manual', 'automatic', 'preset', 'alert'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Event Types:**
- `heater_on` / `heater_off`
- `fan_on` / `fan_off`
- `door_open` / `door_close`

### **3. aggregated_sensor_data Table**

Long-term aggregated data storage:

```sql
CREATE TABLE aggregated_sensor_data (
    id UUID PRIMARY KEY,
    dryer_id UUID REFERENCES dryers(id),
    aggregation_period TEXT, -- 'hourly', 'daily', 'weekly', 'monthly'
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    
    -- Temperature Aggregates
    chamber_temp_avg DECIMAL(5, 2),
    chamber_temp_min DECIMAL(5, 2),
    chamber_temp_max DECIMAL(5, 2),
    
    -- Humidity Aggregates
    internal_humidity_avg DECIMAL(5, 2),
    internal_humidity_min DECIMAL(5, 2),
    internal_humidity_max DECIMAL(5, 2),
    
    -- Fan & Power Aggregates
    fan_speed_avg DECIMAL(5, 2),
    fan_runtime_hours DECIMAL(10, 2),
    power_consumption_total_kwh DECIMAL(10, 3),
    
    -- Operational Aggregates
    heater_runtime_hours DECIMAL(10, 2),
    door_open_count INTEGER,
    total_readings_count INTEGER
);
```

### **4. data_retention_policies Table**

Configurable retention policies:

```sql
CREATE TABLE data_retention_policies (
    id UUID PRIMARY KEY,
    policy_name TEXT UNIQUE,
    data_type TEXT, -- 'sensor_readings', 'operational_events', etc.
    retention_days INTEGER, -- -1 for indefinite
    is_active BOOLEAN,
    description TEXT
);
```

---

## 🔌 API Endpoints

### **POST /api/sensor-data**

Receive sensor data from IoT devices.

**Request Body:**
```json
{
  "dryer_id": "DRY-001",
  "timestamp": "2024-01-28T12:00:00Z",
  "chamber_temp": 45.5,
  "ambient_temp": 28.3,
  "heater_temp": 65.2,
  "internal_humidity": 35.8,
  "external_humidity": 65.2,
  "fan_speed_rpm": 1200,
  "fan_speed_percentage": 75.0,
  "fan_status": true,
  "heater_status": true,
  "door_status": false,
  "solar_voltage": 18.5,
  "battery_level": 85,
  "battery_voltage": 12.6,
  "power_consumption_w": 150.5,
  "charging_status": "charging"
}
```

**Response:**
```json
{
  "success": true,
  "reading_id": "uuid",
  "timestamp": "2024-01-28T12:00:00Z"
}
```

### **GET /api/sensor-data**

Retrieve sensor data for a dryer.

**Query Parameters:**
- `dryer_id` (required) - Dryer identifier
- `limit` (optional) - Number of readings (default: 100)
- `start_date` (optional) - Filter from date
- `end_date` (optional) - Filter to date

**Response:**
```json
{
  "dryer_id": "DRY-001",
  "count": 100,
  "readings": [...]
}
```

### **POST /api/operational-events**

Record operational status changes.

**Request Body:**
```json
{
  "dryer_id": "DRY-001",
  "event_type": "heater_on",
  "timestamp": "2024-01-28T12:00:00Z",
  "previous_state": false,
  "new_state": true,
  "triggered_by": "automatic",
  "notes": "Temperature threshold reached"
}
```

### **GET /api/operational-events**

Retrieve operational events.

**Query Parameters:**
- `dryer_id` (required)
- `event_type` (optional)
- `limit` (optional)
- `start_date` (optional)
- `end_date` (optional)

---

## 🎨 UI Components

### **RealtimeSensorData Component**

Real-time sensor data display with auto-refresh.

**Features:**
- ✅ Auto-refresh every 30 seconds (configurable)
- ✅ Connection status indicator (Online/Recent/Offline)
- ✅ Temperature sensors display
- ✅ Humidity sensors display
- ✅ Operational status badges
- ✅ Power metrics with battery progress bar
- ✅ Last updated timestamp

**Usage:**
```tsx
import { RealtimeSensorData } from '@/components/RealtimeSensorData';

<RealtimeSensorData 
  dryerId="dryer-uuid"
  autoRefresh={true}
  refreshInterval={30000}
/>
```

---

## 🔒 Security & Permissions

### **Row Level Security Policies**

#### **Sensor Readings**
- ✅ Super admins & admins can view all readings
- ✅ Regional managers can view readings from their region
- ✅ Field technicians can view readings from assigned dryers
- ✅ IoT devices can insert readings (service role)

#### **Operational Events**
- ✅ Same viewing permissions as sensor readings
- ✅ IoT devices can insert events (service role)

#### **Aggregated Data**
- ✅ Same viewing permissions as sensor readings
- ✅ System can create aggregations (service role)

#### **Retention Policies**
- ✅ Admins can view policies
- ✅ Super admins can manage policies

---

## ⚙️ Data Retention & Cleanup

### **Automatic Cleanup Function**

```sql
SELECT * FROM cleanup_old_data();
```

**Returns:**
- Number of deleted sensor readings
- Number of deleted operational events

**Execution:**
- Run via cron job or scheduled task
- Recommended: Daily at off-peak hours
- Uses retention policies from `data_retention_policies` table

### **Data Aggregation Function**

```sql
SELECT aggregate_hourly_data('dryer-uuid', '2024-01-28 12:00:00');
```

**Process:**
1. Aggregates sensor readings for specified hour
2. Calculates min, max, average values
3. Stores in `aggregated_sensor_data` table
4. Upserts if aggregation already exists

**Recommended Schedule:**
- Run hourly for previous hour
- Run daily for previous day aggregations
- Run monthly for previous month aggregations

---

## 📱 IoT Device Integration

### **Data Transmission Format**

IoT devices should send data via HTTP POST to:
```
POST https://your-domain.com/api/sensor-data
```

**Headers:**
```
Content-Type: application/json
```

**Minimum Required Fields:**
```json
{
  "dryer_id": "DRY-001"
}
```

**All Optional Fields:**
All sensor fields are optional. Send only available data.

### **Transmission Frequency**

**Recommended:**
- Normal operation: Every 5 minutes
- Active drying: Every 1-2 minutes
- Idle: Every 15-30 minutes

**Benefits:**
- Reduces data transmission costs
- Conserves battery power
- Provides adequate monitoring resolution

### **Error Handling**

**HTTP Status Codes:**
- `201` - Success
- `400` - Bad request (missing dryer_id)
- `404` - Dryer not found
- `500` - Server error

**Retry Logic:**
- Retry on 5xx errors
- Exponential backoff
- Store locally if offline
- Batch send when connection restored

---

## 📊 Data Views

### **latest_sensor_readings**

Latest reading for each dryer:
```sql
SELECT * FROM latest_sensor_readings;
```

### **dryer_realtime_status**

Comprehensive real-time status:
```sql
SELECT * FROM dryer_realtime_status WHERE dryer_id = 'DRY-001';
```

**Includes:**
- All latest sensor values
- Connection status (online/recent/offline)
- Dryer operational status

---

## 🧪 Testing Checklist

### **Data Ingestion**
- [ ] Send sensor data via API
- [ ] Verify data stored in database
- [ ] Check timestamp accuracy
- [ ] Test with missing optional fields
- [ ] Test with invalid dryer_id
- [ ] Verify last_communication updated

### **Data Retrieval**
- [ ] Fetch latest readings
- [ ] Filter by date range
- [ ] Test pagination with limit
- [ ] Verify RLS policies work
- [ ] Check different user roles

### **Real-Time Display**
- [ ] Component shows latest data
- [ ] Auto-refresh works
- [ ] Connection status updates
- [ ] All sensors display correctly
- [ ] Battery progress bar works

### **Data Retention**
- [ ] Run cleanup function
- [ ] Verify old data deleted
- [ ] Check retention policies applied
- [ ] Aggregated data preserved

### **Aggregation**
- [ ] Run hourly aggregation
- [ ] Verify calculations correct
- [ ] Check min/max values
- [ ] Verify power consumption totals

---

## 📈 Performance Optimization

### **Database Indexes**
- ✅ Dryer + timestamp composite index
- ✅ Timestamp-only index for time queries
- ✅ Event type index for filtering

### **Query Optimization**
- Use indexed columns in WHERE clauses
- Limit result sets appropriately
- Use aggregated data for historical queries
- Partition tables if volume exceeds millions of rows

### **Caching Strategy**
- Cache latest readings (5-minute TTL)
- Cache aggregated data (1-hour TTL)
- Invalidate on new data insertion

---

## 🎯 Key Features Summary

✅ **Comprehensive Sensor Coverage**
- Temperature (3 sensors)
- Humidity (2 sensors)
- Fan speed (RPM & percentage)
- Operational status (heater, fan, door)
- Power metrics (solar, battery, consumption)

✅ **Timestamped Storage**
- All readings with precise timestamps
- Timezone-aware storage
- Automatic timestamp generation

✅ **Configurable Retention**
- Detailed data: 3 months
- Events: 1 year
- Aggregates: Up to indefinite
- Automatic cleanup function

✅ **Data Aggregation**
- Hourly, daily, monthly aggregates
- Min, max, average calculations
- Runtime tracking
- Power consumption totals

✅ **Real-Time Display**
- Auto-refreshing component
- Connection status monitoring
- Visual indicators
- Battery level progress bars

✅ **Role-Based Access**
- RLS policies enforced
- Regional filtering
- Assignment-based access
- Secure API endpoints

---

## 📁 Files Created

**Database:**
- `supabase/migrations/20240128_data_collection.sql` - Complete migration

**API Endpoints:**
- `app/api/sensor-data/route.ts` - Sensor data ingestion & retrieval
- `app/api/operational-events/route.ts` - Operational events tracking

**Components:**
- `src/components/RealtimeSensorData.tsx` - Real-time data display

**Documentation:**
- `developer/DATA_COLLECTION_SYSTEM.md` - This documentation

---

## ✅ System Ready

The data collection system is fully implemented and ready for solar dryer integration:

1. ✅ Run the Supabase migration
2. ✅ Configure IoT devices to send data
3. ✅ View real-time data in dashboard
4. ✅ Set up automated aggregation jobs
5. ✅ Schedule cleanup tasks

All features from **section 6.3 Data Collection Requirements** have been successfully implemented! 🎉
