# IoT Device Integration Guide - Solar Dryer Communication

## 🎯 Overview

Your solar dryer can send sensor data to the platform using simple HTTP POST requests. The platform provides REST API endpoints that accept JSON data.

---

## 🔌 API Endpoint

### **Send Sensor Data**

**Endpoint**: `POST /api/sensor-data`  
**URL**: `http://your-domain.com/api/sensor-data`  
**Content-Type**: `application/json`

### **Required Field**
- `dryer_id` - Your unique dryer identifier (e.g., "DRY-001")

### **Optional Fields** (send any or all)
- `timestamp` - ISO 8601 timestamp (auto-generated if not provided)
- `chamber_temp` - Chamber temperature in °C
- `ambient_temp` - Ambient temperature in °C
- `heater_temp` - Heater temperature in °C
- `internal_humidity` - Internal humidity in %
- `external_humidity` - External humidity in %
- `fan_speed_rpm` - Fan speed in RPM
- `fan_speed_percentage` - Fan speed as percentage
- `fan_status` - Boolean (true/false)
- `heater_status` - Boolean (true/false)
- `door_status` - Boolean (true/false)
- `solar_voltage` - Solar panel voltage in V
- `battery_level` - Battery level in %
- `battery_voltage` - Battery voltage in V
- `power_consumption_w` - Power consumption in Watts
- `charging_status` - String ("charging", "discharging", "full")

---

## 📡 Communication Examples

### **1. Arduino/ESP32 (C++)**

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Platform API endpoint
const char* serverUrl = "http://your-domain.com/api/sensor-data";
const char* dryerId = "DRY-001";

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void loop() {
  // Read sensor values
  float chamberTemp = readChamberTemperature();
  float ambientTemp = readAmbientTemperature();
  int batteryLevel = readBatteryLevel();
  bool fanStatus = readFanStatus();
  
  // Send data to platform
  sendSensorData(chamberTemp, ambientTemp, batteryLevel, fanStatus);
  
  // Wait 5 minutes before next transmission
  delay(300000);
}

void sendSensorData(float chamberTemp, float ambientTemp, int batteryLevel, bool fanStatus) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    StaticJsonDocument<512> doc;
    doc["dryer_id"] = dryerId;
    doc["chamber_temp"] = chamberTemp;
    doc["ambient_temp"] = ambientTemp;
    doc["battery_level"] = batteryLevel;
    doc["fan_status"] = fanStatus;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Send POST request
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode == 201) {
      Serial.println("Data sent successfully");
    } else {
      Serial.print("Error sending data: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
  }
}

// Sensor reading functions (implement based on your hardware)
float readChamberTemperature() {
  // Read from your temperature sensor
  return 45.5;
}

float readAmbientTemperature() {
  // Read from your ambient sensor
  return 28.3;
}

int readBatteryLevel() {
  // Read battery level
  return 85;
}

bool readFanStatus() {
  // Read fan status
  return true;
}
```

### **2. Raspberry Pi (Python)**

```python
#!/usr/bin/env python3
import requests
import time
import json
from datetime import datetime

# Configuration
API_ENDPOINT = "http://your-domain.com/api/sensor-data"
DRYER_ID = "DRY-001"
TRANSMISSION_INTERVAL = 300  # 5 minutes

def read_sensors():
    """Read sensor values from your hardware"""
    # Replace with actual sensor reading code
    return {
        "chamber_temp": 45.5,
        "ambient_temp": 28.3,
        "heater_temp": 65.2,
        "internal_humidity": 35.8,
        "external_humidity": 65.2,
        "fan_speed_rpm": 1200,
        "fan_status": True,
        "heater_status": True,
        "door_status": False,
        "solar_voltage": 18.5,
        "battery_level": 85,
        "battery_voltage": 12.6,
        "power_consumption_w": 150.5,
        "charging_status": "charging"
    }

def send_sensor_data(sensor_data):
    """Send sensor data to the platform"""
    payload = {
        "dryer_id": DRYER_ID,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        **sensor_data
    }
    
    try:
        response = requests.post(
            API_ENDPOINT,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 201:
            result = response.json()
            print(f"✓ Data sent successfully at {result['timestamp']}")
            print(f"  Reading ID: {result['reading_id']}")
            return True
        else:
            print(f"✗ Error: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Connection error: {e}")
        return False

def main():
    """Main loop for continuous data transmission"""
    print(f"IoT Sensor Data Transmission Started")
    print(f"Dryer ID: {DRYER_ID}")
    print(f"API Endpoint: {API_ENDPOINT}")
    print(f"Transmission Interval: {TRANSMISSION_INTERVAL} seconds")
    print("-" * 60)
    
    while True:
        try:
            # Read sensor data
            sensor_data = read_sensors()
            
            # Send to platform
            success = send_sensor_data(sensor_data)
            
            if success:
                print(f"  Chamber Temp: {sensor_data['chamber_temp']}°C")
                print(f"  Battery Level: {sensor_data['battery_level']}%")
                print(f"  Fan Status: {'ON' if sensor_data['fan_status'] else 'OFF'}")
            
            print(f"\nNext transmission in {TRANSMISSION_INTERVAL} seconds...")
            print("-" * 60)
            
            # Wait for next transmission
            time.sleep(TRANSMISSION_INTERVAL)
            
        except KeyboardInterrupt:
            print("\n\nTransmission stopped by user")
            break
        except Exception as e:
            print(f"✗ Unexpected error: {e}")
            time.sleep(60)  # Wait 1 minute before retrying

if __name__ == "__main__":
    main()
```

### **3. NodeMCU/ESP8266 (MicroPython)**

```python
import urequests
import ujson
import time
import network
from machine import Pin, ADC

# WiFi Configuration
SSID = "YOUR_WIFI_SSID"
PASSWORD = "YOUR_WIFI_PASSWORD"

# Platform Configuration
API_ENDPOINT = "http://your-domain.com/api/sensor-data"
DRYER_ID = "DRY-001"

def connect_wifi():
    """Connect to WiFi"""
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    
    if not wlan.isconnected():
        print("Connecting to WiFi...")
        wlan.connect(SSID, PASSWORD)
        
        while not wlan.isconnected():
            time.sleep(1)
    
    print("Connected to WiFi")
    print("IP:", wlan.ifconfig()[0])

def read_sensors():
    """Read sensor values"""
    # Example: Read from ADC pins
    # Replace with your actual sensor reading code
    
    return {
        "chamber_temp": 45.5,
        "ambient_temp": 28.3,
        "battery_level": 85,
        "fan_status": True,
        "heater_status": True
    }

def send_data(sensor_data):
    """Send data to platform"""
    payload = {
        "dryer_id": DRYER_ID,
        **sensor_data
    }
    
    try:
        response = urequests.post(
            API_ENDPOINT,
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            print("✓ Data sent successfully")
            return True
        else:
            print(f"✗ Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Error: {e}")
        return False
    finally:
        if response:
            response.close()

def main():
    """Main program"""
    connect_wifi()
    
    while True:
        try:
            # Read sensors
            data = read_sensors()
            
            # Send to platform
            send_data(data)
            
            # Wait 5 minutes
            time.sleep(300)
            
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(60)

if __name__ == "__main__":
    main()
```

### **4. Simple cURL Test**

```bash
curl -X POST http://your-domain.com/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "dryer_id": "DRY-001",
    "chamber_temp": 45.5,
    "ambient_temp": 28.3,
    "heater_temp": 65.2,
    "internal_humidity": 35.8,
    "external_humidity": 65.2,
    "fan_speed_rpm": 1200,
    "fan_status": true,
    "heater_status": true,
    "door_status": false,
    "solar_voltage": 18.5,
    "battery_level": 85,
    "battery_voltage": 12.6,
    "power_consumption_w": 150.5,
    "charging_status": "charging"
  }'
```

---

## 📊 Response Format

### **Success Response (201 Created)**

```json
{
  "success": true,
  "reading_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-28T12:00:00Z"
}
```

### **Error Responses**

**400 Bad Request** - Missing dryer_id
```json
{
  "error": "dryer_id is required"
}
```

**404 Not Found** - Dryer not registered
```json
{
  "error": "Dryer not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to store sensor data",
  "details": "Error message"
}
```

---

## 🔄 Recommended Transmission Strategy

### **Transmission Frequency**

**Normal Operation**: Every 5 minutes
- Balances data freshness with power consumption
- Reduces network traffic
- Adequate for monitoring

**Active Drying**: Every 1-2 minutes
- More frequent updates during critical operations
- Better temperature/humidity tracking

**Idle Mode**: Every 15-30 minutes
- Conserves power when not in use
- Still maintains connectivity monitoring

### **Retry Logic**

```python
def send_with_retry(data, max_retries=3):
    """Send data with exponential backoff retry"""
    for attempt in range(max_retries):
        try:
            response = requests.post(API_ENDPOINT, json=data, timeout=10)
            if response.status_code == 201:
                return True
        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                time.sleep(wait_time)
            else:
                print(f"Failed after {max_retries} attempts")
                return False
```

### **Offline Data Storage**

Store data locally when offline, then batch send when connection restored:

```python
import json
import os

OFFLINE_STORAGE = "offline_data.json"

def store_offline(data):
    """Store data locally when offline"""
    if os.path.exists(OFFLINE_STORAGE):
        with open(OFFLINE_STORAGE, 'r') as f:
            offline_data = json.load(f)
    else:
        offline_data = []
    
    offline_data.append(data)
    
    with open(OFFLINE_STORAGE, 'w') as f:
        json.dump(offline_data, f)

def send_offline_data():
    """Send stored offline data when connection restored"""
    if not os.path.exists(OFFLINE_STORAGE):
        return
    
    with open(OFFLINE_STORAGE, 'r') as f:
        offline_data = json.load(f)
    
    for data in offline_data:
        if send_sensor_data(data):
            offline_data.remove(data)
    
    # Update offline storage
    if offline_data:
        with open(OFFLINE_STORAGE, 'w') as f:
            json.dump(offline_data, f)
    else:
        os.remove(OFFLINE_STORAGE)
```

---

## 🔒 Security Considerations

### **1. Use HTTPS in Production**

```python
API_ENDPOINT = "https://your-domain.com/api/sensor-data"  # Use HTTPS
```

### **2. API Key Authentication (Future Enhancement)**

If you want to add API key authentication:

```python
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "your-device-api-key"
}

response = requests.post(API_ENDPOINT, json=data, headers=headers)
```

### **3. Certificate Validation**

For ESP32/Arduino with HTTPS:

```cpp
#include <WiFiClientSecure.h>

WiFiClientSecure client;
client.setInsecure();  // For testing only
// In production, use: client.setCACert(root_ca);
```

---

## 🧪 Testing Your Integration

### **1. Test with Simulator**

Use the provided Python simulator:

```bash
cd /home/esther-zawadi/Downloads/iteda-platform
python3 scripts/iot/send-sensor-data.py
```

Edit the script to set your dryer ID:
```python
DRYER_ID = "DRY-001"  # Change to your dryer ID
```

### **2. Verify Data Reception**

Check database for received data:

```bash
PGPASSWORD=Zawadi psql -U postgres -d smart_dry_monitor -c \
  "SELECT timestamp, chamber_temp, battery_level FROM sensor_readings 
   WHERE dryer_id = (SELECT id FROM dryers WHERE dryer_id = 'DRY-001') 
   ORDER BY timestamp DESC LIMIT 5;"
```

### **3. Check Alerts Generated**

```bash
PGPASSWORD=Zawadi psql -U postgres -d smart_dry_monitor -c \
  "SELECT alert_type, priority, title, current_value FROM alerts 
   WHERE dryer_id = (SELECT id FROM dryers WHERE dryer_id = 'DRY-001') 
   ORDER BY triggered_at DESC LIMIT 5;"
```

### **4. View in Dashboard**

Navigate to: `http://localhost:3000/dashboard`

You should see:
- Updated dryer statistics
- Real-time sensor data
- Generated alerts (if thresholds exceeded)

---

## 📡 Network Requirements

### **Minimum Requirements**
- **Bandwidth**: ~1 KB per transmission
- **Latency**: <5 seconds acceptable
- **Connection**: WiFi, 3G/4G, or Ethernet
- **Uptime**: Not critical (offline buffering supported)

### **Recommended Setup**
- **WiFi**: 2.4 GHz (better range for outdoor installations)
- **Fallback**: 4G module for areas with poor WiFi
- **Power**: Solar + battery backup for continuous operation

---

## 🔧 Hardware Recommendations

### **Microcontroller Options**

**ESP32** (Recommended)
- Built-in WiFi & Bluetooth
- Low power consumption
- Arduino compatible
- ~$5-10

**Raspberry Pi Zero W**
- Full Linux OS
- WiFi built-in
- Python support
- ~$15

**Arduino + WiFi Shield**
- Reliable and simple
- Good for beginners
- ~$30-40

### **Sensors**

**Temperature**: DS18B20, DHT22, BME280  
**Humidity**: DHT22, BME280, SHT31  
**Voltage**: Voltage divider + ADC  
**Current**: INA219, ACS712  

---

## ✅ Quick Start Checklist

- [ ] Register your dryer in the platform (get dryer_id)
- [ ] Set up your microcontroller with WiFi
- [ ] Install required libraries
- [ ] Copy example code for your platform
- [ ] Update configuration (WiFi, API endpoint, dryer_id)
- [ ] Implement sensor reading functions
- [ ] Test with simulator first
- [ ] Deploy to actual hardware
- [ ] Verify data in dashboard
- [ ] Set up alert thresholds

---

## 📞 Support

If you encounter issues:

1. Check WiFi connection
2. Verify dryer is registered in database
3. Test with cURL first
4. Check API endpoint URL
5. Review server logs for errors

Your dryer is ready to communicate with the platform! 🎉
