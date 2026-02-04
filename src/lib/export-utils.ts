// Utility functions for exporting data to CSV and PDF

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatDryerDataForExport(dryers: any[]) {
  return dryers.map(dryer => ({
    'Dryer ID': dryer.dryer_id || dryer.dryerId,
    'Serial Number': dryer.serial_number || dryer.serialNumber,
    'Status': dryer.status,
    'Region': dryer.region?.name || dryer.regionName || 'N/A',
    'Battery Level': dryer.battery_level ? `${dryer.battery_level}%` : 'N/A',
    'Signal Strength': dryer.signal_strength ? `${dryer.signal_strength}%` : 'N/A',
    'Active Alerts': dryer.active_alerts_count || 0,
    'Location': dryer.location_address || dryer.locationAddress || 'N/A',
    'Deployment Date': dryer.deployment_date || dryer.deploymentDate || 'N/A',
    'Last Communication': dryer.last_communication || 'N/A',
    'Runtime Hours': dryer.total_runtime_hours || 0,
  }));
}

export function formatAlertDataForExport(alerts: any[]) {
  return alerts.map(alert => ({
    'Alert ID': alert.id,
    'Dryer ID': alert.dryer?.dryer_id || 'N/A',
    'Type': alert.type,
    'Severity': alert.severity,
    'Status': alert.status,
    'Message': alert.message,
    'Current Value': alert.current_value || 'N/A',
    'Threshold Value': alert.threshold_value || 'N/A',
    'Created At': new Date(alert.created_at).toLocaleString(),
    'Acknowledged At': alert.acknowledged_at ? new Date(alert.acknowledged_at).toLocaleString() : 'N/A',
    'Resolved At': alert.resolved_at ? new Date(alert.resolved_at).toLocaleString() : 'N/A',
  }));
}

export function formatPresetDataForExport(presets: any[]) {
  return presets.map(preset => ({
    'Preset ID': preset.preset_id,
    'Crop Type': preset.crop_type,
    'Region': preset.region,
    'Target Temperature (°C)': preset.target_temp_c,
    'Target Humidity (%)': preset.target_humidity_pct,
    'Fan Speed (RPM)': preset.fan_speed_rpm,
    'Duration (Hours)': preset.duration_hours,
    'Min Temp Threshold': preset.min_temp_threshold || 'N/A',
    'Max Temp Threshold': preset.max_temp_threshold || 'N/A',
    'Status': preset.is_active ? 'Active' : 'Inactive',
    'Description': preset.description || 'N/A',
  }));
}

export function formatStaffDataForExport(staff: any[]) {
  return staff.map(member => ({
    'Name': member.profile?.full_name || member.full_name || 'N/A',
    'Email': member.profile?.email || member.email,
    'Role': member.role?.role || member.role || 'N/A',
    'Region': member.role?.region || 'N/A',
    'Phone': member.profile?.phone || 'N/A',
    'Joined': member.profile?.created_at ? new Date(member.profile.created_at).toLocaleDateString() : 'N/A',
  }));
}

export function formatSensorDataForExport(readings: any[]) {
  return readings.map(reading => ({
    'Dryer ID': reading.dryer?.dryer_id || 'N/A',
    'Timestamp': new Date(reading.timestamp).toLocaleString(),
    'Temperature (°C)': reading.temperature_c || 'N/A',
    'Humidity (%)': reading.humidity_pct || 'N/A',
    'Battery Voltage (V)': reading.battery_voltage || 'N/A',
    'Battery Level (%)': reading.battery_level || 'N/A',
    'Solar Voltage (V)': reading.solar_voltage || 'N/A',
    'Fan Speed (RPM)': reading.fan_speed || 'N/A',
    'Heater Status': reading.heater_on ? 'ON' : 'OFF',
  }));
}
