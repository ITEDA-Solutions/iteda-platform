import { pgTable, uuid, text, timestamp, integer, decimal, boolean, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const appRoleEnum = pgEnum('app_role', ['super_admin', 'admin', 'regional_manager', 'field_technician']);
export const dryerStatusEnum = pgEnum('dryer_status', ['active', 'idle', 'offline', 'maintenance', 'decommissioned']);
export const alertSeverityEnum = pgEnum('alert_severity', ['critical', 'warning', 'info']);
export const alertStatusEnum = pgEnum('alert_status', ['active', 'acknowledged', 'resolved', 'dismissed']);

// Staff table (users with authentication)
export const users = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // hashed password
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Profiles table
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  fullName: text('full_name'),
  phone: text('phone'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Staff roles table
export const staffRoles = pgTable('staff_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  role: appRoleEnum('role').notNull(),
  region: text('region'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueStaffRole: uniqueIndex('unique_staff_role').on(table.staffId, table.role),
}));

// Regions table
export const regions = pgTable('regions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Dryer assignments table (for field technicians)
export const dryerAssignments = pgTable('dryer_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  technicianId: uuid('technician_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  dryerId: uuid('dryer_id').references(() => dryers.id, { onDelete: 'cascade' }).notNull(),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  assignedBy: uuid('assigned_by').references(() => profiles.id),
  notes: text('notes'),
}, (table) => ({
  uniqueAssignment: uniqueIndex('unique_technician_dryer').on(table.technicianId, table.dryerId),
  technicianIdx: index('idx_assignments_technician').on(table.technicianId),
  dryerIdx: index('idx_assignments_dryer').on(table.dryerId),
}));

// Farmers table (dryer owners)
export const farmers = pgTable('farmers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  farmBusinessName: text('farm_business_name'),
  idNumber: text('id_number'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Presets table
export const presets = pgTable('presets', {
  id: uuid('id').primaryKey().defaultRandom(),
  presetId: text('preset_id').notNull().unique(),
  cropType: text('crop_type').notNull(),
  region: text('region').notNull(),
  targetTempC: integer('target_temp_c').notNull(),
  targetHumidityPct: integer('target_humidity_pct').notNull(),
  fanSpeedRpm: integer('fan_speed_rpm').notNull(),
  durationHours: decimal('duration_hours', { precision: 4, scale: 2 }).notNull(),
  minTempThreshold: integer('min_temp_threshold'),
  maxTempThreshold: integer('max_temp_threshold'),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Dryers table
export const dryers = pgTable('dryers', {
  id: uuid('id').primaryKey().defaultRandom(),
  dryerId: text('dryer_id').notNull().unique(),
  serialNumber: text('serial_number').notNull().unique(),
  status: dryerStatusEnum('status').notNull().default('idle'),
  deploymentDate: timestamp('deployment_date').notNull(),
  locationLatitude: decimal('location_latitude', { precision: 10, scale: 8 }),
  locationLongitude: decimal('location_longitude', { precision: 11, scale: 8 }),
  locationAddress: text('location_address'),
  regionId: uuid('region_id').references(() => regions.id),
  farmerId: uuid('farmer_id').references(() => farmers.id),

  // Hardware configuration
  numTempSensors: integer('num_temp_sensors').default(3),
  numHumiditySensors: integer('num_humidity_sensors').default(2),
  numFans: integer('num_fans').default(1),
  numHeaters: integer('num_heaters').default(1),
  solarCapacityW: integer('solar_capacity_w'),
  batteryCapacityAh: integer('battery_capacity_ah'),

  // Current operational data
  currentPresetId: uuid('current_preset_id').references(() => presets.id),
  lastCommunication: timestamp('last_communication'),
  totalRuntimeHours: decimal('total_runtime_hours', { precision: 10, scale: 2 }).default('0'),
  batteryLevel: integer('battery_level'),
  batteryVoltage: decimal('battery_voltage', { precision: 5, scale: 2 }),
  signalStrength: integer('signal_strength'),
  activeAlertsCount: integer('active_alerts_count').default(0),

  assignedTechnicianId: uuid('assigned_technician_id').references(() => profiles.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Sensor readings table
export const sensorReadings = pgTable('sensor_readings', {
  id: uuid('id').primaryKey().defaultRandom(),
  dryerId: uuid('dryer_id').references(() => dryers.id, { onDelete: 'cascade' }).notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),

  // Temperature readings (°C)
  chamberTemp: decimal('chamber_temp', { precision: 5, scale: 2 }),
  ambientTemp: decimal('ambient_temp', { precision: 5, scale: 2 }),
  heaterTemp: decimal('heater_temp', { precision: 5, scale: 2 }),

  // Humidity readings (%)
  internalHumidity: decimal('internal_humidity', { precision: 5, scale: 2 }),
  externalHumidity: decimal('external_humidity', { precision: 5, scale: 2 }),

  // Fan data
  fanSpeedRpm: integer('fan_speed_rpm'),
  fanStatus: boolean('fan_status'),

  // Operational status
  heaterStatus: boolean('heater_status'),
  doorStatus: boolean('door_status'),

  // Power metrics
  solarVoltage: decimal('solar_voltage', { precision: 5, scale: 2 }),
  batteryLevel: integer('battery_level'),
  batteryVoltage: decimal('battery_voltage', { precision: 5, scale: 2 }),
  powerConsumptionW: decimal('power_consumption_w', { precision: 7, scale: 2 }),
  chargingStatus: text('charging_status'),

  // Preset info
  activePresetId: uuid('active_preset_id').references(() => presets.id),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  dryerTimestampIdx: index('idx_sensor_readings_dryer_timestamp').on(table.dryerId, table.timestamp.desc()),
  timestampIdx: index('idx_sensor_readings_timestamp').on(table.timestamp.desc()),
}));

// Alerts table
export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  dryerId: uuid('dryer_id').references(() => dryers.id, { onDelete: 'cascade' }).notNull(),
  severity: alertSeverityEnum('severity').notNull(),
  status: alertStatusEnum('status').notNull().default('active'),
  type: text('type').notNull(),
  message: text('message').notNull(),
  thresholdValue: decimal('threshold_value', { precision: 10, scale: 2 }),
  currentValue: decimal('current_value', { precision: 10, scale: 2 }),
  acknowledgedBy: uuid('acknowledged_by').references(() => profiles.id),
  acknowledgedAt: timestamp('acknowledged_at'),
  resolvedAt: timestamp('resolved_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  dryerStatusIdx: index('idx_alerts_dryer_status').on(table.dryerId, table.status),
  createdIdx: index('idx_alerts_created').on(table.createdAt.desc()),
}));

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.id],
    references: [users.id],
  }),
  staffRoles: many(staffRoles),
  assignedDryers: many(dryers),
  acknowledgedAlerts: many(alerts),
}));

export const staffRolesRelations = relations(staffRoles, ({ one }) => ({
  staff: one(profiles, {
    fields: [staffRoles.staffId],
    references: [profiles.id],
  }),
}));

export const regionsRelations = relations(regions, ({ many }) => ({
  dryers: many(dryers),
}));

export const farmersRelations = relations(farmers, ({ many }) => ({
  dryers: many(dryers),
}));

export const presetsRelations = relations(presets, ({ many }) => ({
  dryers: many(dryers),
  sensorReadings: many(sensorReadings),
}));

export const dryersRelations = relations(dryers, ({ one, many }) => ({
  region: one(regions, {
    fields: [dryers.regionId],
    references: [regions.id],
  }),
  farmer: one(farmers, {
    fields: [dryers.farmerId],
    references: [farmers.id],
  }),
  currentPreset: one(presets, {
    fields: [dryers.currentPresetId],
    references: [presets.id],
  }),
  assignedTechnician: one(profiles, {
    fields: [dryers.assignedTechnicianId],
    references: [profiles.id],
  }),
  sensorReadings: many(sensorReadings),
  alerts: many(alerts),
}));

export const sensorReadingsRelations = relations(sensorReadings, ({ one }) => ({
  dryer: one(dryers, {
    fields: [sensorReadings.dryerId],
    references: [dryers.id],
  }),
  activePreset: one(presets, {
    fields: [sensorReadings.activePresetId],
    references: [presets.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  dryer: one(dryers, {
    fields: [alerts.dryerId],
    references: [dryers.id],
  }),
  acknowledgedBy: one(profiles, {
    fields: [alerts.acknowledgedBy],
    references: [profiles.id],
  }),
}));

export const dryerAssignmentsRelations = relations(dryerAssignments, ({ one }) => ({
  technician: one(profiles, {
    fields: [dryerAssignments.technicianId],
    references: [profiles.id],
  }),
  dryer: one(dryers, {
    fields: [dryerAssignments.dryerId],
    references: [dryers.id],
  }),
  assignedBy: one(profiles, {
    fields: [dryerAssignments.assignedBy],
    references: [profiles.id],
  }),
}));
