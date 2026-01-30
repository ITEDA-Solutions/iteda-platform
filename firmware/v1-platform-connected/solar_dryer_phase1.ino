/*
 * ITEDA Solar Dryer - Phase 1 Platform Integration
 * Firmware v1-platform-connected
 * 
 * Features:
 * - DHT22 temperature & humidity reading
 * - Local SD card logging (backup)
 * - WiFi connectivity
 * - HTTP POST to platform every 5 minutes
 * - Heater relay control
 * - Serial debug output
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <SD.h>
#include <SPI.h>
#include <ArduinoJson.h>

// ============ CONFIGURATION ============
// WiFi Settings
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Platform API Settings
const char* API_ENDPOINT = "http://your-domain.com/api/sensor-data";
const char* DRYER_ID = "DRY-001";  // Your unique dryer identifier

// Pin Definitions
#define DHT_PIN 4           // DHT22 data pin
#define HEATER_RELAY_PIN 5  // Relay control pin
#define SD_CS_PIN 15        // SD card chip select

// Sensor Settings
#define DHT_TYPE DHT22
#define READING_INTERVAL 60000    // 60 seconds for SD card logging
#define UPLOAD_INTERVAL 300000    // 5 minutes for platform upload

// Temperature Control
#define TARGET_TEMP 45.0
#define TEMP_TOLERANCE 5.0
#define MIN_TEMP (TARGET_TEMP - TEMP_TOLERANCE)
#define MAX_TEMP (TARGET_TEMP + TEMP_TOLERANCE)

// ============ GLOBAL OBJECTS ============
DHT dht(DHT_PIN, DHT_TYPE);
HTTPClient http;

// ============ GLOBAL VARIABLES ============
unsigned long lastReadingTime = 0;
unsigned long lastUploadTime = 0;
bool heaterState = false;
float currentTemp = 0.0;
float currentHumidity = 0.0;

// Data buffer for offline storage
struct SensorData {
  unsigned long timestamp;
  float temperature;
  float humidity;
  bool heaterOn;
};

#define BUFFER_SIZE 50
SensorData dataBuffer[BUFFER_SIZE];
int bufferIndex = 0;

// ============ SETUP ============
void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=================================");
  Serial.println("ITEDA Solar Dryer - Phase 1");
  Serial.println("Platform Integration v1.0");
  Serial.println("=================================\n");

  // Initialize pins
  pinMode(HEATER_RELAY_PIN, OUTPUT);
  digitalWrite(HEATER_RELAY_PIN, LOW);
  
  // Initialize DHT22
  Serial.println("Initializing DHT22 sensor...");
  dht.begin();
  delay(2000);
  
  // Initialize SD card
  Serial.println("Initializing SD card...");
  if (!SD.begin(SD_CS_PIN)) {
    Serial.println("⚠️  SD card initialization failed!");
    Serial.println("   Continuing without SD card backup...");
  } else {
    Serial.println("✓ SD card initialized");
    
    // Create log file header if new
    File logFile = SD.open("/sensor_log.csv", FILE_WRITE);
    if (logFile) {
      if (logFile.size() == 0) {
        logFile.println("Timestamp,Temperature(C),Humidity(%),HeaterState");
      }
      logFile.close();
    }
  }
  
  // Connect to WiFi
  connectWiFi();
  
  Serial.println("\n✓ Setup complete!");
  Serial.println("Starting data collection...\n");
}

// ============ MAIN LOOP ============
void loop() {
  unsigned long currentTime = millis();
  
  // Read sensors every 60 seconds
  if (currentTime - lastReadingTime >= READING_INTERVAL) {
    lastReadingTime = currentTime;
    
    // Read DHT22
    readSensors();
    
    // Control heater based on temperature
    controlHeater();
    
    // Log to SD card
    logToSD();
    
    // Store in buffer for upload
    storeInBuffer();
    
    // Print to serial
    printStatus();
  }
  
  // Upload to platform every 5 minutes
  if (currentTime - lastUploadTime >= UPLOAD_INTERVAL) {
    lastUploadTime = currentTime;
    
    // Check WiFi connection
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("⚠️  WiFi disconnected. Reconnecting...");
      connectWiFi();
    }
    
    // Upload current reading
    if (WiFi.status() == WL_CONNECTED) {
      uploadToPlatform();
      
      // Try to upload buffered data if any
      uploadBufferedData();
    }
  }
  
  delay(100);
}

// ============ WIFI CONNECTION ============
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n⚠️  WiFi connection failed!");
    Serial.println("   Will retry on next upload cycle...");
  }
}

// ============ SENSOR READING ============
void readSensors() {
  currentTemp = dht.readTemperature();
  currentHumidity = dht.readHumidity();
  
  // Check if readings are valid
  if (isnan(currentTemp) || isnan(currentHumidity)) {
    Serial.println("⚠️  Failed to read from DHT sensor!");
    return;
  }
}

// ============ HEATER CONTROL ============
void controlHeater() {
  // Simple ON/OFF control logic
  if (currentTemp < MIN_TEMP && !heaterState) {
    // Turn heater ON
    digitalWrite(HEATER_RELAY_PIN, HIGH);
    heaterState = true;
    Serial.println("🔥 Heater turned ON");
  } 
  else if (currentTemp > MAX_TEMP && heaterState) {
    // Turn heater OFF
    digitalWrite(HEATER_RELAY_PIN, LOW);
    heaterState = false;
    Serial.println("❄️  Heater turned OFF");
  }
}

// ============ SD CARD LOGGING ============
void logToSD() {
  File logFile = SD.open("/sensor_log.csv", FILE_APPEND);
  if (logFile) {
    // Format: Timestamp,Temperature,Humidity,HeaterState
    logFile.print(millis() / 1000);  // Timestamp in seconds
    logFile.print(",");
    logFile.print(currentTemp, 2);
    logFile.print(",");
    logFile.print(currentHumidity, 2);
    logFile.print(",");
    logFile.println(heaterState ? "ON" : "OFF");
    logFile.close();
  }
}

// ============ BUFFER STORAGE ============
void storeInBuffer() {
  dataBuffer[bufferIndex].timestamp = millis();
  dataBuffer[bufferIndex].temperature = currentTemp;
  dataBuffer[bufferIndex].humidity = currentHumidity;
  dataBuffer[bufferIndex].heaterOn = heaterState;
  
  bufferIndex = (bufferIndex + 1) % BUFFER_SIZE;
}

// ============ PLATFORM UPLOAD ============
void uploadToPlatform() {
  Serial.println("\n📤 Uploading to platform...");
  
  // Create JSON payload
  StaticJsonDocument<512> doc;
  doc["dryer_id"] = DRYER_ID;
  doc["chamber_temp"] = currentTemp;
  doc["ambient_temp"] = currentTemp;  // Using same for now
  doc["internal_humidity"] = currentHumidity;
  doc["heater_status"] = heaterState;
  doc["fan_status"] = false;  // No fan in Phase 1
  doc["door_status"] = false;  // Assume closed
  
  // Add battery info (you can read from voltage divider)
  // For now, using placeholder values
  doc["battery_level"] = 85;
  doc["solar_voltage"] = 18.5;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send HTTP POST
  http.begin(API_ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode == 201) {
    Serial.println("✓ Data uploaded successfully!");
    
    // Parse response
    String response = http.getString();
    Serial.print("   Response: ");
    Serial.println(response);
  } else {
    Serial.print("⚠️  Upload failed! HTTP code: ");
    Serial.println(httpResponseCode);
    Serial.print("   Response: ");
    Serial.println(http.getString());
  }
  
  http.end();
}

// ============ BUFFERED DATA UPLOAD ============
void uploadBufferedData() {
  // This function can upload old buffered data
  // when connection is restored
  // Implementation depends on your needs
  Serial.println("   Checking for buffered data...");
  // TODO: Implement buffered upload if needed
}

// ============ STATUS PRINTING ============
void printStatus() {
  Serial.println("\n--- Sensor Reading ---");
  Serial.print("Temperature: ");
  Serial.print(currentTemp, 2);
  Serial.println(" °C");
  
  Serial.print("Humidity: ");
  Serial.print(currentHumidity, 2);
  Serial.println(" %");
  
  Serial.print("Heater: ");
  Serial.println(heaterState ? "ON 🔥" : "OFF ❄️");
  
  Serial.print("Target Range: ");
  Serial.print(MIN_TEMP, 1);
  Serial.print(" - ");
  Serial.print(MAX_TEMP, 1);
  Serial.println(" °C");
  
  Serial.print("WiFi: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? "Connected ✓" : "Disconnected ⚠️");
  
  Serial.println("---------------------\n");
}
