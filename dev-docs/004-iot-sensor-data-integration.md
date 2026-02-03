# IoT Sensor Data Integration Guide

This document guides developers on integrating microcontrollers/IoT devices with the ITEDA Platform to send sensor data from solar dryers.

## Overview

The platform exposes a REST API endpoint that accepts sensor readings from IoT devices. Data is validated, stored in Supabase, and displayed on dashboards in real-time.

**Endpoint:** `POST /api/sensor-data`

**Authentication:** Uses Supabase service role key (bypasses RLS for IoT device writes)

---

## Quick Start - Testing with cURL

### Basic Sensor Data Submission

```bash
curl -X POST http://localhost:3000/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "dryer_id": "DRYER-001",
    "chamber_temp": 45.5,
    "ambient_temp": 28.3,
    "internal_humidity": 35.2,
    "battery_level": 85,
    "heater_status": true,
    "fan_status": true
  }'
```

### Full Payload Example

```bash
curl -X POST http://localhost:3000/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "dryer_id": "DRYER-001",
    "timestamp": "2025-01-28T10:30:00Z",
    "chamber_temp": 55.5,
    "ambient_temp": 28.3,
    "heater_temp": 72.0,
    "internal_humidity": 35.2,
    "external_humidity": 65.0,
    "fan_speed_rpm": 1200,
    "fan_speed_percentage": 75.0,
    "fan_status": true,
    "heater_status": true,
    "door_status": false,
    "solar_voltage": 18.5,
    "battery_level": 85,
    "battery_voltage": 12.8,
    "power_consumption_w": 45.5,
    "charging_status": "charging"
  }'
```

### Expected Response (Success)

```json
{
  "success": true,
  "reading_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

---

## API Specification

### Endpoint Details

| Property | Value |
|----------|-------|
| URL | `/api/sensor-data` |
| Method | `POST` |
| Content-Type | `application/json` |
| Response Format | JSON |

### Request Payload Schema

| Field | Type | Required | Range | Description |
|-------|------|----------|-------|-------------|
| `dryer_id` | string | **Yes** | - | Unique dryer identifier (e.g., "DRYER-001") |
| `timestamp` | ISO8601 | No | - | Reading timestamp (defaults to server time) |
| `chamber_temp` | number | No | -20 to 100 | Drying chamber temperature (°C) |
| `ambient_temp` | number | No | -20 to 60 | Ambient/external temperature (°C) |
| `heater_temp` | number | No | 0 to 150 | Heater element temperature (°C) |
| `internal_humidity` | number | No | 0 to 100 | Internal chamber humidity (%) |
| `external_humidity` | number | No | 0 to 100 | External ambient humidity (%) |
| `fan_speed_rpm` | integer | No | 0 to 3000 | Fan speed in RPM |
| `fan_speed_percentage` | number | No | 0 to 100 | Fan speed as percentage |
| `fan_status` | boolean | No | - | Fan on/off status |
| `heater_status` | boolean | No | - | Heater on/off status |
| `door_status` | boolean | No | - | Door open (true) / closed (false) |
| `solar_voltage` | number | No | 0 to 30 | Solar panel voltage (V) |
| `battery_level` | integer | No | 0 to 100 | Battery charge percentage |
| `battery_voltage` | number | No | 8 to 16 | Battery voltage (V) |
| `power_consumption_w` | number | No | 0 to 5000 | Current power consumption (W) |
| `charging_status` | string | No | - | "charging", "discharging", "float", "offline" |
| `active_preset_id` | UUID | No | - | Currently active drying preset |

### Response Codes

| Code | Description |
|------|-------------|
| 201 | Success - sensor data stored |
| 400 | Validation error - invalid data or out-of-range values |
| 404 | Dryer not found (dryer_id doesn't exist in database) |
| 500 | Server error |

### Error Response Format

```json
{
  "error": "Sensor data validation failed",
  "details": [
    "chamber_temp out of range: 150 (expected -20-100)"
  ],
  "warnings": [
    "Battery voltage does not match battery level - possible calibration issue"
  ]
}
```

---

## Existing Utilities Reference

The platform provides validation and utility functions that IoT integration should align with.

### Validation Module

**Location:** `app/api/sensor-data/validation.ts`

Key exports:
- `validateSensorReading(data)` - Validates complete sensor payload
- `validateSensorValue(sensorName, value)` - Validates individual sensor value
- `calculateChargingStatus(solarVoltage, batteryVoltage, batteryLevel)` - Calculates charging status
- `detectAnomalies(currentReading, previousReadings)` - Detects suspicious patterns
- `logValidationFailure(dryerId, data, result)` - Logs validation failures

### Sensor Ranges

```typescript
const SENSOR_RANGES = {
  chamber_temp: { min: -20, max: 100, unit: '°C' },
  ambient_temp: { min: -20, max: 60, unit: '°C' },
  heater_temp: { min: 0, max: 150, unit: '°C' },
  chamber_humidity: { min: 0, max: 100, unit: '%' },
  ambient_humidity: { min: 0, max: 100, unit: '%' },
  battery_level: { min: 0, max: 100, unit: '%' },
  battery_voltage: { min: 0, max: 15, unit: 'V' },
  solar_voltage: { min: 0, max: 25, unit: 'V' },
  fan_speed: { min: 0, max: 2000, unit: 'RPM' },
  power_consumption: { min: 0, max: 5000, unit: 'W' },
};
```

### Supabase Client

**Location:** `src/lib/supabase-db.ts`

```typescript
import { getSupabaseAdmin } from '@/lib/supabase-db';

// Get service-role client (bypasses RLS)
const supabase = getSupabaseAdmin();
```

---

## Database Schema

### sensor_readings Table

```sql
CREATE TABLE sensor_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dryer_id UUID NOT NULL REFERENCES dryers(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

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
    active_preset_id UUID REFERENCES presets(id),
    data_quality_score DECIMAL(3, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### dryers Table (Required Fields)

For a dryer to receive sensor data, it must exist in the `dryers` table:

```sql
-- Minimum required fields for dryer registration
INSERT INTO dryers (dryer_id, serial_number, deployment_date, status)
VALUES ('DRYER-001', 'SN-2025-001', NOW(), 'active');
```

---

## Microcontroller Implementation

### ESP32 Example (Arduino)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "https://your-domain.com/api/sensor-data";
const char* dryerId = "DRYER-001";

void sendSensorData(float chamberTemp, float ambientTemp,
                    float humidity, int batteryLevel,
                    bool heaterOn, bool fanOn) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  // Build JSON payload
  StaticJsonDocument<512> doc;
  doc["dryer_id"] = dryerId;
  doc["chamber_temp"] = chamberTemp;
  doc["ambient_temp"] = ambientTemp;
  doc["internal_humidity"] = humidity;
  doc["battery_level"] = batteryLevel;
  doc["heater_status"] = heaterOn;
  doc["fan_status"] = fanOn;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode == 201) {
    Serial.println("Data sent successfully");
    String response = http.getString();
    Serial.println(response);
  } else {
    Serial.print("Error sending data: ");
    Serial.println(httpResponseCode);
    String response = http.getString();
    Serial.println(response);
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void loop() {
  // Read your actual sensor values here
  float chamberTemp = readChamberTemperature();
  float ambientTemp = readAmbientTemperature();
  float humidity = readHumidity();
  int batteryLevel = readBatteryLevel();
  bool heaterOn = isHeaterOn();
  bool fanOn = isFanOn();

  sendSensorData(chamberTemp, ambientTemp, humidity,
                 batteryLevel, heaterOn, fanOn);

  // Send data every 5 minutes
  delay(300000);
}
```

### Raspberry Pi / Python Example

```python
import requests
import json
from datetime import datetime

API_URL = "https://your-domain.com/api/sensor-data"
DRYER_ID = "DRYER-001"

def send_sensor_data(chamber_temp, ambient_temp, humidity,
                     battery_level, heater_on, fan_on):
    payload = {
        "dryer_id": DRYER_ID,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "chamber_temp": chamber_temp,
        "ambient_temp": ambient_temp,
        "internal_humidity": humidity,
        "battery_level": battery_level,
        "heater_status": heater_on,
        "fan_status": fan_on
    }

    try:
        response = requests.post(
            API_URL,
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=30
        )

        if response.status_code == 201:
            print(f"Data sent successfully: {response.json()}")
            return True
        else:
            print(f"Error: {response.status_code} - {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"Network error: {e}")
        return False

# Usage
if __name__ == "__main__":
    # Replace with actual sensor readings
    send_sensor_data(
        chamber_temp=45.5,
        ambient_temp=28.0,
        humidity=35.0,
        battery_level=85,
        heater_on=True,
        fan_on=True
    )
```

---

## Data Flow

```
┌──────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│  IoT Device      │────▶│  /api/sensor-data │────▶│  Supabase DB    │
│  (ESP32/Pi/etc)  │     │  (Next.js API)    │     │  sensor_readings│
└──────────────────┘     └───────────────────┘     └─────────────────┘
                                  │                         │
                                  │                         │
                                  ▼                         ▼
                         ┌───────────────────┐     ┌─────────────────┐
                         │  Validation       │     │  Dashboard UI   │
                         │  - Range checks   │     │  - Real-time    │
                         │  - Logical checks │     │  - Charts       │
                         │  - Anomaly detect │     │  - Alerts       │
                         └───────────────────┘     └─────────────────┘
```

---

## Best Practices

### 1. Data Transmission Frequency
- **Recommended:** Every 5 minutes during active drying
- **Idle mode:** Every 15-30 minutes
- **Alert conditions:** Immediate transmission

### 2. Error Handling
- Implement retry logic with exponential backoff
- Store failed transmissions locally for later retry
- Log all transmission failures

### 3. Data Quality
- Always validate sensor readings before sending
- Include timestamp for accurate time-series data
- Send `null` for unavailable sensor values (don't send 0)

### 4. Network Resilience
- Buffer readings during network outages
- Send buffered data in batches when connection restored
- Implement connection health checks

### 5. Security Considerations
- Use HTTPS for all API calls
- Consider implementing device authentication tokens (future enhancement)
- Don't hardcode credentials in firmware

---

## Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `dryer_id is required` | Missing dryer_id field | Include dryer_id in payload |
| `Dryer not found` (404) | Dryer not registered | Register dryer in database first |
| `out of range` | Sensor value exceeds limits | Check sensor calibration |
| `validation failed` | Invalid data format | Check data types and ranges |

### Testing Tips

1. **Verify dryer exists:**
```bash
curl http://localhost:3000/api/dryers
```

2. **Check sensor data was stored:**
```bash
curl "http://localhost:3000/api/sensor-data?dryer_id=DRYER-001&limit=5"
```

3. **View data on dashboard:**
Navigate to `/dashboard` in browser after sending test data.

---

## Future Enhancements

The following features may be implemented:

1. **Auto-registration:** Endpoint to auto-register unknown dryers
2. **Device authentication:** API keys or JWT tokens per device
3. **Batch uploads:** Send multiple readings in single request
4. **WebSocket support:** Real-time bidirectional communication
5. **Offline sync:** Protocol for syncing buffered data

---

## Support

For questions or issues:
- Check existing dev-docs in `/dev-docs/` folder
- Review API implementation in `app/api/sensor-data/route.ts`
- Validation logic in `app/api/sensor-data/validation.ts`
