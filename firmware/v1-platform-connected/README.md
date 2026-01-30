# Solar Dryer Phase 1 Firmware

## 📁 Files in This Folder

- `solar_dryer_phase1.ino` - Main Arduino firmware file

## 🚀 How to Use

### 1. Open the File
1. Open Arduino IDE
2. File → Open
3. Navigate to this folder
4. Open `solar_dryer_phase1.ino`

### 2. Configure Your Settings
At the top of the file (lines 22-27), change these 4 values:

```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";           // ← Your WiFi name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";   // ← Your WiFi password
const char* API_ENDPOINT = "http://your-domain.com/api/sensor-data";  // ← Your platform URL
const char* DRYER_ID = "DRY-001";  // ← Your dryer ID
```

### 3. Install Required Libraries
In Arduino IDE:
- Sketch → Include Library → Manage Libraries
- Install these libraries:
  - **DHT sensor library** by Adafruit
  - **ArduinoJson** by Benoit Blanchon
  - **SD** (built-in, no need to install)

### 4. Upload to ESP32
1. Connect ESP32 via USB
2. Tools → Board → ESP32 Dev Module
3. Tools → Port → Select your ESP32's port
4. Click Upload (→) button

### 5. Monitor Output
1. Tools → Serial Monitor
2. Set baud rate to **115200**
3. Watch for connection status and data uploads

## 📊 What This Firmware Does

- ✅ Reads DHT22 sensor every 60 seconds
- ✅ Controls heater to maintain 45°C ±5°C
- ✅ Logs data to SD card (CSV format)
- ✅ Uploads to platform every 5 minutes
- ✅ Auto-reconnects if WiFi drops
- ✅ Buffers data when offline

## 🔌 Pin Connections

```
ESP32 → Component
GPIO 4  → DHT22 Data
GPIO 5  → Relay IN (Heater)
GPIO 15 → SD Card CS
GPIO 18 → SD Card SCK
GPIO 19 → SD Card MISO
GPIO 23 → SD Card MOSI
3.3V    → DHT22 VCC, SD VCC
GND     → All GND pins
```

## 📝 Configuration Example

```cpp
// Example configuration
const char* WIFI_SSID = "ITEDA_Lab";
const char* WIFI_PASSWORD = "Solar2024!";
const char* API_ENDPOINT = "http://192.168.0.105:3000/api/sensor-data";
const char* DRYER_ID = "NAIROBI-01";
```

## ✅ Success Indicators

When working correctly, Serial Monitor will show:
```
✓ WiFi connected!
IP Address: 192.168.x.x
✓ Data uploaded successfully!
Temperature: 45.50 °C
Heater: ON 🔥
```

## 🆘 Troubleshooting

**WiFi won't connect?**
- Check SSID and password are correct
- Make sure ESP32 is in range
- Verify WiFi is 2.4GHz (ESP32 doesn't support 5GHz)

**DHT22 returns NaN?**
- Check wiring
- Add 10kΩ pull-up resistor
- Wait 2 seconds after power-on

**Upload fails?**
- Check API endpoint URL
- Verify platform is running
- Check firewall settings

## 📚 More Help

See these guides:
- `developer/CONFIGURATION_GUIDE.md` - Detailed setup instructions
- `developer/PHASE1_DRYER_INTEGRATION.md` - Complete integration guide
- `developer/IOT_INTEGRATION_GUIDE.md` - General IoT communication guide
