// Alert Rules Engine
// Defines all alert types, thresholds, and conditions

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 
  | 'high_temperature'
  | 'low_battery'
  | 'offline'
  | 'temperature_threshold'
  | 'battery_low'
  | 'solar_fault'
  | 'fan_anomaly'
  | 'cycle_complete'
  | 'maintenance_due'
  | 'firmware_update'
  | 'sensor_failure'
  | 'heater_malfunction';

export interface AlertRule {
  type: AlertType;
  severity: AlertSeverity;
  threshold?: number;
  duration?: number; // in seconds
  message: string;
  description: string;
  checkFunction: (data: any) => boolean;
  priority: number; // 1 = highest
}

// Default alert thresholds (can be overridden per dryer)
export const DEFAULT_THRESHOLDS = {
  // Critical thresholds
  critical_temperature: 80, // °C
  critical_battery: 10, // %
  offline_critical: 3600, // 1 hour in seconds
  
  // Warning thresholds
  warning_temperature: 70, // °C
  warning_battery: 30, // %
  offline_warning: 900, // 15 minutes in seconds
  
  // Other thresholds
  solar_voltage_min: 12, // V
  fan_speed_min: 500, // RPM
  maintenance_interval: 90, // days
};

// Alert Rules Definition
export const ALERT_RULES: AlertRule[] = [
  // ==================== CRITICAL ALERTS ====================
  {
    type: 'high_temperature',
    severity: 'critical',
    threshold: DEFAULT_THRESHOLDS.critical_temperature,
    message: 'CRITICAL: Temperature exceeds safe limits',
    description: 'Chamber temperature above 80°C - Fire risk',
    priority: 1,
    checkFunction: (data) => {
      return data.chamber_temp > DEFAULT_THRESHOLDS.critical_temperature;
    },
  },
  {
    type: 'low_battery',
    severity: 'critical',
    threshold: DEFAULT_THRESHOLDS.critical_battery,
    message: 'CRITICAL: Battery critically low',
    description: 'Battery level below 10% - System may shut down',
    priority: 2,
    checkFunction: (data) => {
      return data.battery_level !== null && data.battery_level < DEFAULT_THRESHOLDS.critical_battery;
    },
  },
  {
    type: 'offline',
    severity: 'critical',
    duration: DEFAULT_THRESHOLDS.offline_critical,
    message: 'CRITICAL: Dryer offline for over 1 hour',
    description: 'No communication received in the last hour',
    priority: 3,
    checkFunction: (data) => {
      if (!data.last_communication) return true;
      const lastComm = new Date(data.last_communication);
      const now = new Date();
      const diffSeconds = (now.getTime() - lastComm.getTime()) / 1000;
      return diffSeconds > DEFAULT_THRESHOLDS.offline_critical;
    },
  },
  {
    type: 'sensor_failure',
    severity: 'critical',
    message: 'CRITICAL: Sensor failure detected',
    description: 'One or more sensors not responding',
    priority: 4,
    checkFunction: (data) => {
      // Check if all critical sensors are null
      const criticalSensorsNull = 
        data.chamber_temp === null && 
        data.chamber_humidity === null && 
        data.battery_level === null;
      return criticalSensorsNull;
    },
  },
  {
    type: 'heater_malfunction',
    severity: 'critical',
    message: 'CRITICAL: Heater malfunction detected',
    description: 'Heater is ON but temperature not increasing',
    priority: 5,
    checkFunction: (data) => {
      // Heater is ON but chamber temp is lower than ambient
      return data.heater_status === true && 
             data.chamber_temp !== null && 
             data.ambient_temp !== null &&
             data.chamber_temp < data.ambient_temp;
    },
  },

  // ==================== WARNING ALERTS ====================
  {
    type: 'temperature_threshold',
    severity: 'warning',
    threshold: DEFAULT_THRESHOLDS.warning_temperature,
    message: 'WARNING: Temperature above normal',
    description: 'Chamber temperature above 70°C',
    priority: 6,
    checkFunction: (data) => {
      return data.chamber_temp > DEFAULT_THRESHOLDS.warning_temperature &&
             data.chamber_temp <= DEFAULT_THRESHOLDS.critical_temperature;
    },
  },
  {
    type: 'battery_low',
    severity: 'warning',
    threshold: DEFAULT_THRESHOLDS.warning_battery,
    message: 'WARNING: Battery level low',
    description: 'Battery level below 30%',
    priority: 7,
    checkFunction: (data) => {
      return data.battery_level !== null && 
             data.battery_level < DEFAULT_THRESHOLDS.warning_battery &&
             data.battery_level >= DEFAULT_THRESHOLDS.critical_battery;
    },
  },
  {
    type: 'offline',
    severity: 'warning',
    duration: DEFAULT_THRESHOLDS.offline_warning,
    message: 'WARNING: Dryer offline',
    description: 'No communication for 15 minutes',
    priority: 8,
    checkFunction: (data) => {
      if (!data.last_communication) return false;
      const lastComm = new Date(data.last_communication);
      const now = new Date();
      const diffSeconds = (now.getTime() - lastComm.getTime()) / 1000;
      return diffSeconds > DEFAULT_THRESHOLDS.offline_warning &&
             diffSeconds <= DEFAULT_THRESHOLDS.offline_critical;
    },
  },
  {
    type: 'solar_fault',
    severity: 'warning',
    message: 'WARNING: Solar charging fault',
    description: 'Solar voltage low or charging not working',
    priority: 9,
    checkFunction: (data) => {
      // Solar voltage is low but battery is discharging
      return data.solar_voltage !== null &&
             data.solar_voltage < DEFAULT_THRESHOLDS.solar_voltage_min &&
             data.charging_status === 'discharging';
    },
  },
  {
    type: 'fan_anomaly',
    severity: 'warning',
    message: 'WARNING: Fan speed anomaly',
    description: 'Fan speed below expected range',
    priority: 10,
    checkFunction: (data) => {
      // Fan is ON but speed is too low
      return data.fan_status === true &&
             data.fan_speed_rpm !== null &&
             data.fan_speed_rpm < DEFAULT_THRESHOLDS.fan_speed_min;
    },
  },

  // ==================== INFORMATIONAL ALERTS ====================
  {
    type: 'cycle_complete',
    severity: 'info',
    message: 'INFO: Drying cycle completed',
    description: 'Preset duration reached',
    priority: 11,
    checkFunction: (data) => {
      // Check if preset duration has been reached
      if (!data.preset_start_time || !data.preset_duration_hours) return false;
      const startTime = new Date(data.preset_start_time);
      const now = new Date();
      const hoursElapsed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      return hoursElapsed >= data.preset_duration_hours;
    },
  },
  {
    type: 'maintenance_due',
    severity: 'info',
    message: 'INFO: Maintenance due soon',
    description: 'Scheduled maintenance approaching',
    priority: 12,
    checkFunction: (data) => {
      if (!data.deployment_date) return false;
      const deployed = new Date(data.deployment_date);
      const now = new Date();
      const daysActive = (now.getTime() - deployed.getTime()) / (1000 * 60 * 60 * 24);
      // Maintenance due every 90 days
      const daysSinceLastMaintenance = daysActive % DEFAULT_THRESHOLDS.maintenance_interval;
      return daysSinceLastMaintenance >= (DEFAULT_THRESHOLDS.maintenance_interval - 7); // 7 days before
    },
  },
  {
    type: 'firmware_update',
    severity: 'info',
    message: 'INFO: Firmware update available',
    description: 'New firmware version available for installation',
    priority: 13,
    checkFunction: (data) => {
      // This would check against a firmware version database
      // For now, return false (implement when firmware management is added)
      return false;
    },
  },
];

// Get alert rule by type
export function getAlertRule(type: AlertType): AlertRule | undefined {
  return ALERT_RULES.find(rule => rule.type === type);
}

// Get all rules for a specific severity
export function getRulesBySeverity(severity: AlertSeverity): AlertRule[] {
  return ALERT_RULES.filter(rule => rule.severity === severity);
}

// Get critical rules only
export function getCriticalRules(): AlertRule[] {
  return getRulesBySeverity('critical');
}

// Get warning rules only
export function getWarningRules(): AlertRule[] {
  return getRulesBySeverity('warning');
}

// Get info rules only
export function getInfoRules(): AlertRule[] {
  return getRulesBySeverity('info');
}

// Check if data triggers any alert rules
export function checkAlertRules(data: any, customThresholds?: Partial<typeof DEFAULT_THRESHOLDS>): {
  triggeredRules: AlertRule[];
  alerts: Array<{
    rule: AlertRule;
    currentValue?: number;
    threshold?: number;
  }>;
} {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...customThresholds };
  const triggeredRules: AlertRule[] = [];
  const alerts: Array<{ rule: AlertRule; currentValue?: number; threshold?: number }> = [];

  for (const rule of ALERT_RULES) {
    try {
      if (rule.checkFunction(data)) {
        triggeredRules.push(rule);
        
        // Extract current value and threshold for the alert
        let currentValue: number | undefined;
        let threshold: number | undefined;

        switch (rule.type) {
          case 'high_temperature':
          case 'temperature_threshold':
            currentValue = data.chamber_temp;
            threshold = rule.threshold;
            break;
          case 'low_battery':
          case 'battery_low':
            currentValue = data.battery_level;
            threshold = rule.threshold;
            break;
          case 'offline':
            if (data.last_communication) {
              const lastComm = new Date(data.last_communication);
              const now = new Date();
              currentValue = (now.getTime() - lastComm.getTime()) / 1000;
              threshold = rule.duration;
            }
            break;
        }

        alerts.push({ rule, currentValue, threshold });
      }
    } catch (error) {
      console.error(`Error checking rule ${rule.type}:`, error);
    }
  }

  return { triggeredRules, alerts };
}

// Format alert message with current values
export function formatAlertMessage(
  rule: AlertRule,
  currentValue?: number,
  threshold?: number
): string {
  let message = rule.message;

  if (currentValue !== undefined && threshold !== undefined) {
    switch (rule.type) {
      case 'high_temperature':
      case 'temperature_threshold':
        message += ` (Current: ${currentValue.toFixed(1)}°C, Threshold: ${threshold}°C)`;
        break;
      case 'low_battery':
      case 'battery_low':
        message += ` (Current: ${currentValue.toFixed(0)}%, Threshold: ${threshold}%)`;
        break;
      case 'offline':
        const minutes = Math.floor(currentValue / 60);
        message += ` (Offline for: ${minutes} minutes)`;
        break;
    }
  }

  return message;
}

// Get alert color for UI
export function getAlertColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return 'red';
    case 'warning':
      return 'yellow';
    case 'info':
      return 'blue';
    default:
      return 'gray';
  }
}

// Get alert icon for UI
export function getAlertIcon(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return '🚨';
    case 'warning':
      return '⚠️';
    case 'info':
      return 'ℹ️';
    default:
      return '📢';
  }
}
