# IoT Sensor Data Integration Guide

REST API for sending sensor data from IoT devices to the ITEDA Platform.

## Endpoint

```
POST /api/sensor-data
Content-Type: application/json
```

## Quick Test (cURL)

```bash
curl -X POST http://localhost:3000/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "dryer_id": "DRY-2024-012",
    "chamber_temp": 45.5,
    "ambient_temp": 28.3,
    "internal_humidity": 35.2,
    "battery_level": 85,
    "heater_status": true,
    "fan_status": true
  }'
```

## Payload Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dryer_id` | string | **Yes** | Dryer identifier (must exist in database) |
| `timestamp` | ISO8601 | No | Defaults to server time |
| `chamber_temp` | number | No | Chamber temperature (°C) |
| `ambient_temp` | number | No | Ambient temperature (°C) |
| `heater_temp` | number | No | Heater temperature (°C) |
| `internal_humidity` | number | No | Internal humidity (%) |
| `external_humidity` | number | No | External humidity (%) |
| `fan_speed_rpm` | integer | No | Fan speed (RPM) |
| `fan_status` | boolean | No | Fan on/off |
| `heater_status` | boolean | No | Heater on/off |
| `door_status` | boolean | No | Door open/closed |
| `solar_voltage` | number | No | Solar panel voltage (V) |
| `battery_level` | integer | No | Battery percentage (0-100) |
| `battery_voltage` | number | No | Battery voltage (V) |
| `power_consumption_w` | number | No | Power consumption (W) |
| `charging_status` | string | No | "charging", "discharging", "float", "offline" |

## Responses

**Success (201):**
```json
{
  "success": true,
  "reading_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

**Error (400/404/500):**
```json
{
  "error": "Dryer not found"
}
```

## Retrieve Data

```bash
curl "http://localhost:3000/api/sensor-data?dryer_id=DRY-2024-012&limit=10"
```

## Notes

- Dryer must exist in database before sending data
- Only include fields you have sensor data for
- Use existing validation utilities in `app/api/sensor-data/validation.ts`
- Supabase client: `getSupabaseAdmin()` from `src/lib/supabase-db.ts`
