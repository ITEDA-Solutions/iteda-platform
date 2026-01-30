# 🔧 ESP32 Configuration Guide - Step by Step

## Where to Input Your Settings

When you open the ESP32 firmware code, you'll see a section at the top that looks like this:

---

## 📝 Step 1: Find the Configuration Section

Look for these lines near the top of your `.ino` file (around line 20-30):

```cpp
// ============ CONFIGURATION ============
// WiFi Settings
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Platform API Settings
const char* API_ENDPOINT = "http://your-domain.com/api/sensor-data";
const char* DRYER_ID = "DRY-001";  // Your unique dryer identifier
```

---

## ✏️ Step 2: Replace with Your Actual Values

### **Example 1: Home WiFi**

**Before:**
```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
```

**After (with your WiFi name and password):**
```cpp
const char* WIFI_SSID = "MyHomeWiFi";
const char* WIFI_PASSWORD = "mypassword123";
```

### **Example 2: Office WiFi**

**Before:**
```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
```

**After:**
```cpp
const char* WIFI_SSID = "ITEDA_Office_WiFi";
const char* WIFI_PASSWORD = "SecurePass2024!";
```

---

## 🌐 Step 3: Set Your Platform API Endpoint

### **If Testing Locally (Development)**

**Before:**
```cpp
const char* API_ENDPOINT = "http://your-domain.com/api/sensor-data";
```

**After:**
```cpp
const char* API_ENDPOINT = "http://192.168.1.100:3000/api/sensor-data";
```
*Replace `192.168.1.100` with your computer's local IP address*

### **If Deployed Online (Production)**

**Before:**
```cpp
const char* API_ENDPOINT = "http://your-domain.com/api/sensor-data";
```

**After:**
```cpp
const char* API_ENDPOINT = "https://iteda-platform.com/api/sensor-data";
```
*Replace with your actual domain name*

---

## 🏷️ Step 4: Set Your Dryer ID

Each dryer needs a unique identifier. This is how the platform knows which dryer is sending data.

**Before:**
```cpp
const char* DRYER_ID = "DRY-001";
```

**After (examples):**
```cpp
// For your first dryer:
const char* DRYER_ID = "DRY-001";

// For your second dryer:
const char* DRYER_ID = "DRY-002";

// Or use a more descriptive name:
const char* DRYER_ID = "NAIROBI-PILOT-01";
```

**Important:** This ID must match the dryer ID you registered in the platform database!

---

## 📋 Complete Example

Here's what your configuration section should look like after you fill it in:

```cpp
// ============ CONFIGURATION ============
// WiFi Settings
const char* WIFI_SSID = "MyHomeWiFi";           // ← Your WiFi name
const char* WIFI_PASSWORD = "mypassword123";    // ← Your WiFi password

// Platform API Settings
const char* API_ENDPOINT = "http://192.168.1.100:3000/api/sensor-data";  // ← Your platform URL
const char* DRYER_ID = "DRY-001";  // ← Your dryer's unique ID

// Pin Definitions (don't change these unless your wiring is different)
#define DHT_PIN 4           
#define HEATER_RELAY_PIN 5  
#define SD_CS_PIN 15        
```

---

## 🔍 How to Find Your Computer's IP Address

### **On Windows:**
1. Press `Windows + R`
2. Type `cmd` and press Enter
3. Type `ipconfig` and press Enter
4. Look for "IPv4 Address" (e.g., `192.168.1.100`)

### **On Mac:**
1. Open System Preferences
2. Click Network
3. Your IP address is shown (e.g., `192.168.1.100`)

### **On Linux:**
1. Open Terminal
2. Type `ip addr` or `ifconfig`
3. Look for your IP address (e.g., `192.168.1.100`)

---

## 🎯 Step-by-Step Configuration Process

### **Step 1: Open Arduino IDE**
- Launch Arduino IDE on your computer

### **Step 2: Open the Firmware File**
- File → Open
- Navigate to your firmware file (e.g., `solar_dryer_phase1.ino`)

### **Step 3: Find Configuration Section**
- Scroll to the top of the code
- Look for `// ============ CONFIGURATION ============`

### **Step 4: Edit WiFi Settings**
```cpp
const char* WIFI_SSID = "YourActualWiFiName";      // ← Type your WiFi name here
const char* WIFI_PASSWORD = "YourActualPassword";   // ← Type your password here
```

### **Step 5: Edit Platform Settings**
```cpp
const char* API_ENDPOINT = "http://YOUR_IP:3000/api/sensor-data";  // ← Your computer's IP
const char* DRYER_ID = "DRY-001";  // ← Your dryer ID
```

### **Step 6: Save the File**
- File → Save (or Ctrl+S)

### **Step 7: Upload to ESP32**
- Connect ESP32 via USB cable
- Tools → Board → ESP32 Dev Module
- Tools → Port → Select your ESP32's port
- Click Upload button (→)

### **Step 8: Verify Connection**
- Tools → Serial Monitor
- Set baud rate to `115200`
- You should see:
  ```
  Connecting to WiFi: YourWiFiName
  ✓ WiFi connected!
  IP Address: 192.168.1.xxx
  ✓ Data uploaded successfully!
  ```

---

## 🛠️ Configuration Template

Copy this template and fill in your values:

```cpp
// ============ CONFIGURATION ============
// WiFi Settings
const char* WIFI_SSID = "_________________";     // ← Fill in your WiFi name
const char* WIFI_PASSWORD = "_________________"; // ← Fill in your WiFi password

// Platform API Settings
const char* API_ENDPOINT = "http://_________________:3000/api/sensor-data";  // ← Fill in your IP
const char* DRYER_ID = "_________________";  // ← Fill in your dryer ID (e.g., DRY-001)
```

---

## ✅ Verification Checklist

After configuring, check these:

- [ ] WiFi SSID is correct (case-sensitive!)
- [ ] WiFi password is correct (case-sensitive!)
- [ ] API endpoint has `http://` at the start
- [ ] API endpoint ends with `/api/sensor-data`
- [ ] Dryer ID matches what you registered in platform
- [ ] Dryer ID is unique (no two dryers have same ID)
- [ ] IP address is your computer's actual IP
- [ ] Port number is correct (usually 3000)

---

## 🚨 Common Mistakes to Avoid

### ❌ **Wrong:**
```cpp
const char* WIFI_SSID = YOUR_WIFI_SSID;  // Missing quotes!
```

### ✅ **Correct:**
```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";  // Has quotes
```

---

### ❌ **Wrong:**
```cpp
const char* API_ENDPOINT = "your-domain.com/api/sensor-data";  // Missing http://
```

### ✅ **Correct:**
```cpp
const char* API_ENDPOINT = "http://your-domain.com/api/sensor-data";  // Has http://
```

---

### ❌ **Wrong:**
```cpp
const char* DRYER_ID = DRY-001;  // Missing quotes and has dash
```

### ✅ **Correct:**
```cpp
const char* DRYER_ID = "DRY-001";  // Has quotes around the whole thing
```

---

## 📱 Real-World Example

Let's say:
- Your WiFi name is: `ITEDA_Lab`
- Your WiFi password is: `Solar2024!`
- Your computer's IP is: `192.168.0.105`
- Your dryer ID is: `NAIROBI-01`

**Your configuration would be:**

```cpp
// ============ CONFIGURATION ============
// WiFi Settings
const char* WIFI_SSID = "ITEDA_Lab";
const char* WIFI_PASSWORD = "Solar2024!";

// Platform API Settings
const char* API_ENDPOINT = "http://192.168.0.105:3000/api/sensor-data";
const char* DRYER_ID = "NAIROBI-01";
```

---

## 🔐 Security Note

**Never share your configuration file with WiFi passwords publicly!**

Consider creating a separate `config.h` file:

### **config.h** (keep this private)
```cpp
#ifndef CONFIG_H
#define CONFIG_H

const char* WIFI_SSID = "ITEDA_Lab";
const char* WIFI_PASSWORD = "Solar2024!";
const char* API_ENDPOINT = "http://192.168.0.105:3000/api/sensor-data";
const char* DRYER_ID = "NAIROBI-01";

#endif
```

### **Main .ino file**
```cpp
#include "config.h"  // Load settings from config.h

void setup() {
  // Your code uses WIFI_SSID, WIFI_PASSWORD, etc.
}
```

Then add `config.h` to your `.gitignore` file so it doesn't get uploaded to GitHub.

---

## 🎓 Summary

**You need to change 4 things:**

1. **WIFI_SSID** → Your WiFi network name
2. **WIFI_PASSWORD** → Your WiFi password
3. **API_ENDPOINT** → Your platform URL (with your IP address)
4. **DRYER_ID** → Your dryer's unique identifier

**That's it!** Once you change these 4 lines and upload the code, your ESP32 will connect to WiFi and start sending data to your platform. 🎉

---

## 🆘 Need Help?

If you're stuck, check:
1. Is your WiFi name spelled exactly right? (case-sensitive)
2. Is your WiFi password correct?
3. Is your computer and ESP32 on the same network?
4. Did you start the platform server (`npm run dev`)?
5. Check Serial Monitor for error messages

The Serial Monitor will tell you exactly what's wrong!
