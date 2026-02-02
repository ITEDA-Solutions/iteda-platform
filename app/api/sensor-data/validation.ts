// Sensor data validation middleware
// Validates all incoming sensor readings against defined ranges

export interface SensorRange {
  min: number;
  max: number;
  unit: string;
  description: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Define acceptable ranges for all sensor types
export const SENSOR_RANGES: Record<string, SensorRange> = {
  chamber_temp: {
    min: -20,
    max: 100,
    unit: '°C',
    description: 'Drying chamber temperature',
  },
  ambient_temp: {
    min: -20,
    max: 60,
    unit: '°C',
    description: 'Ambient temperature',
  },
  heater_temp: {
    min: 0,
    max: 150,
    unit: '°C',
    description: 'Heater element temperature',
  },
  chamber_humidity: {
    min: 0,
    max: 100,
    unit: '%',
    description: 'Internal chamber humidity',
  },
  ambient_humidity: {
    min: 0,
    max: 100,
    unit: '%',
    description: 'External ambient humidity',
  },
  battery_level: {
    min: 0,
    max: 100,
    unit: '%',
    description: 'Battery level percentage',
  },
  battery_voltage: {
    min: 0,
    max: 15,
    unit: 'V',
    description: 'Battery voltage',
  },
  solar_voltage: {
    min: 0,
    max: 25,
    unit: 'V',
    description: 'Solar panel voltage',
  },
  fan_speed: {
    min: 0,
    max: 2000,
    unit: 'RPM',
    description: 'Fan speed',
  },
  power_consumption: {
    min: 0,
    max: 5000,
    unit: 'W',
    description: 'Power consumption',
  },
};

// Validate a single sensor value
export function validateSensorValue(
  sensorName: string,
  value: number | null | undefined
): { isValid: boolean; error?: string; warning?: string } {
  // Null/undefined values are acceptable (sensor might be offline)
  if (value === null || value === undefined) {
    return { isValid: true };
  }

  const range = SENSOR_RANGES[sensorName];
  if (!range) {
    return {
      isValid: false,
      error: `Unknown sensor type: ${sensorName}`,
    };
  }

  // Check if value is a valid number
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      isValid: false,
      error: `Invalid value for ${range.description}: must be a number`,
    };
  }

  // Check if value is within acceptable range
  if (value < range.min || value > range.max) {
    return {
      isValid: false,
      error: `${range.description} out of range: ${value}${range.unit} (acceptable: ${range.min}-${range.max}${range.unit})`,
    };
  }

  // Warning thresholds (80% of max or 20% of min)
  const warningMax = range.max * 0.8;
  const warningMin = range.min + (range.max - range.min) * 0.2;

  if (value > warningMax || value < warningMin) {
    return {
      isValid: true,
      warning: `${range.description} approaching limits: ${value}${range.unit}`,
    };
  }

  return { isValid: true };
}

// Validate entire sensor reading object
export function validateSensorReading(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!data.dryer_id) {
    errors.push('dryer_id is required');
  }

  // Validate each sensor field
  const sensorFields = [
    'chamber_temp',
    'ambient_temp',
    'heater_temp',
    'chamber_humidity',
    'ambient_humidity',
    'battery_level',
    'battery_voltage',
    'solar_voltage',
    'fan_speed',
    'power_consumption',
  ];

  for (const field of sensorFields) {
    if (field in data) {
      const result = validateSensorValue(field, data[field]);
      if (!result.isValid && result.error) {
        errors.push(result.error);
      }
      if (result.warning) {
        warnings.push(result.warning);
      }
    }
  }

  // Logical validations
  if (data.chamber_temp !== null && data.ambient_temp !== null) {
    // Chamber temp should typically be higher than ambient when drying
    if (data.heater_status && data.chamber_temp < data.ambient_temp) {
      warnings.push(
        'Chamber temperature is lower than ambient while heater is ON - possible sensor issue'
      );
    }
  }

  if (data.battery_level !== null && data.battery_voltage !== null) {
    // Battery voltage should correlate with battery level
    // Typical 12V battery: 12.7V = 100%, 12.0V = 50%, 11.5V = 0%
    const expectedVoltage = 11.5 + (data.battery_level / 100) * 1.2;
    if (Math.abs(data.battery_voltage - expectedVoltage) > 1.0) {
      warnings.push(
        'Battery voltage does not match battery level - possible calibration issue'
      );
    }
  }

  if (data.solar_voltage !== null && data.solar_voltage > 0) {
    // If solar voltage is present, we should be charging
    if (data.charging_status === 'discharging') {
      warnings.push(
        'Solar voltage detected but battery is discharging - possible charging circuit issue'
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Detect suspicious patterns
export function detectAnomalies(
  currentReading: any,
  previousReadings: any[]
): string[] {
  const anomalies: string[] = [];

  if (previousReadings.length === 0) {
    return anomalies;
  }

  const lastReading = previousReadings[0];

  // Sudden temperature spikes (>20°C change in 5 minutes)
  if (
    currentReading.chamber_temp !== null &&
    lastReading.chamber_temp !== null
  ) {
    const tempDiff = Math.abs(
      currentReading.chamber_temp - lastReading.chamber_temp
    );
    if (tempDiff > 20) {
      anomalies.push(
        `Sudden temperature spike detected: ${tempDiff.toFixed(1)}°C change`
      );
    }
  }

  // Battery level dropping too fast (>10% in 5 minutes)
  if (
    currentReading.battery_level !== null &&
    lastReading.battery_level !== null
  ) {
    const batteryDiff = lastReading.battery_level - currentReading.battery_level;
    if (batteryDiff > 10) {
      anomalies.push(
        `Rapid battery drain detected: ${batteryDiff}% in 5 minutes`
      );
    }
  }

  // Humidity changes too rapidly (>20% in 5 minutes)
  if (
    currentReading.chamber_humidity !== null &&
    lastReading.chamber_humidity !== null
  ) {
    const humidityDiff = Math.abs(
      currentReading.chamber_humidity - lastReading.chamber_humidity
    );
    if (humidityDiff > 20) {
      anomalies.push(
        `Rapid humidity change detected: ${humidityDiff.toFixed(1)}%`
      );
    }
  }

  // Signal strength dropped significantly (>30%)
  if (
    currentReading.signal_strength !== null &&
    lastReading.signal_strength !== null
  ) {
    const signalDiff =
      lastReading.signal_strength - currentReading.signal_strength;
    if (signalDiff > 30) {
      anomalies.push(
        `Significant signal degradation: ${signalDiff}% drop`
      );
    }
  }

  return anomalies;
}

// Log validation failure for debugging
export function logValidationFailure(
  dryerId: string,
  data: any,
  result: ValidationResult
): void {
  const timestamp = new Date().toISOString();
  console.error('[VALIDATION FAILURE]', {
    timestamp,
    dryer_id: dryerId,
    errors: result.errors,
    warnings: result.warnings,
    data: JSON.stringify(data),
  });
}

// Calculate charging status based on voltages
export function calculateChargingStatus(
  solarVoltage: number | null,
  batteryVoltage: number | null,
  batteryLevel: number | null
): 'charging' | 'discharging' | 'float' | 'offline' {
  if (solarVoltage === null || batteryVoltage === null) {
    return 'offline';
  }

  // If solar voltage is significantly higher than battery voltage, we're charging
  if (solarVoltage > batteryVoltage + 0.5) {
    return 'charging';
  }

  // If battery is full (>95%) and solar is present, we're in float mode
  if (batteryLevel !== null && batteryLevel > 95 && solarVoltage > 12) {
    return 'float';
  }

  // If solar voltage is low or absent, we're discharging
  if (solarVoltage < 12) {
    return 'discharging';
  }

  return 'float';
}
