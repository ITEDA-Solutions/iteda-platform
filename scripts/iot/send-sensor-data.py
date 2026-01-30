#!/usr/bin/env python3
"""
IoT Device Sensor Data Transmission Script
This script simulates sending sensor data from a solar dryer to the platform
"""

import requests
import json
import time
import random
from datetime import datetime

# Configuration
API_ENDPOINT = "http://localhost:3000/api/sensor-data"
DRYER_ID = "DRY-001"  # Change this to your dryer ID
TRANSMISSION_INTERVAL = 300  # 5 minutes in seconds

def generate_sensor_data():
    """Generate simulated sensor data"""
    return {
        "dryer_id": DRYER_ID,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        
        # Temperature sensors (°C)
        "chamber_temp": round(random.uniform(35.0, 65.0), 2),
        "ambient_temp": round(random.uniform(20.0, 35.0), 2),
        "heater_temp": round(random.uniform(50.0, 80.0), 2),
        
        # Humidity sensors (%)
        "internal_humidity": round(random.uniform(20.0, 60.0), 2),
        "external_humidity": round(random.uniform(40.0, 80.0), 2),
        
        # Fan data
        "fan_speed_rpm": random.randint(800, 1500),
        "fan_speed_percentage": round(random.uniform(60.0, 100.0), 2),
        "fan_status": random.choice([True, False]),
        
        # Operational status
        "heater_status": random.choice([True, False]),
        "door_status": random.choice([True, False]),
        
        # Power metrics
        "solar_voltage": round(random.uniform(16.0, 20.0), 2),
        "battery_level": random.randint(60, 100),
        "battery_voltage": round(random.uniform(11.5, 13.2), 2),
        "power_consumption_w": round(random.uniform(100.0, 250.0), 2),
        "charging_status": random.choice(["charging", "discharging", "full"]),
        
        # Metadata
        "data_quality_score": round(random.uniform(0.85, 1.0), 2)
    }

def send_sensor_data(data):
    """Send sensor data to the API endpoint"""
    try:
        headers = {"Content-Type": "application/json"}
        response = requests.post(API_ENDPOINT, json=data, headers=headers, timeout=10)
        
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
            # Generate sensor data
            sensor_data = generate_sensor_data()
            
            # Send to API
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
