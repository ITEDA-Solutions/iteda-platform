# IoT Platform - Prioritized Implementation Plan

**Date:** February 2, 2026  
**Platform:** smartDryers.itedasolutions.com  
**Timeline:** 12-16 weeks for complete implementation

---

## Quick Wins (Week 1) - Immediate Impact

These features can be implemented quickly and provide immediate value:

### 1. Enhanced Dryer Display (2 days)
**Priority:** HIGH  
**Effort:** 2 days  
**Impact:** HIGH

**Tasks:**
- Add last communication timestamp to DryersList
- Display battery level with gauge
- Show alert count badges
- Add deployment duration calculation
- Display current preset name

**Files to modify:**
- `src/components/DryersList.tsx`
- `app/api/data/dryers/route.ts`

### 2. Alert Count Badges (1 day)
**Priority:** HIGH  
**Effort:** 1 day  
**Impact:** MEDIUM

**Tasks:**
- Add alert count to dryer cards
- Color-code by severity
- Make clickable to filter alerts

**Files to modify:**
- `src/components/DryersList.tsx`
- `src/components/MainDashboard.tsx`

### 3. Data Validation Middleware (2 days)
**Priority:** HIGH  
**Effort:** 2 days  
**Impact:** HIGH

**Tasks:**
- Add range checks for temperature (-20°C to 100°C)
- Add range checks for humidity (0% to 100%)
- Add range checks for battery (0% to 100%)
- Reject invalid sensor readings
- Log validation failures

**Files to create:**
- `app/api/sensor-data/validation.ts`

**Files to modify:**
- `app/api/sensor-data/route.ts`

---

## Phase 1: Critical Features (Weeks 1-6)

### Sprint 1: Dryer Registration & Management (Week 1-2)

#### 1.1 Auto-Generated Dryer ID (1 day)
**Priority:** HIGH  
**Files to create:**
- `src/lib/dryer-id-generator.ts`

```typescript
// Generate format: DRY-2026-001
export function generateDryerId(year: number, sequence: number): string {
  return `DRY-${year}-${sequence.toString().padStart(3, '0')}`;
}
```

#### 1.2 Hardware Configuration Schema (2 days)
**Priority:** HIGH  
**Database migration needed:**

```sql
CREATE TABLE dryer_hardware_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dryer_id UUID REFERENCES dryers(id) ON DELETE CASCADE,
  num_temp_sensors INTEGER DEFAULT 3,
  num_humidity_sensors INTEGER DEFAULT 2,
  num_fans INTEGER DEFAULT 1,
  num_heaters INTEGER DEFAULT 1,
  solar_panel_capacity_w INTEGER,
  battery_capacity_ah INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 1.3 Dryer Registration Form (3 days)
**Priority:** HIGH  
**Files to create:**
- `src/components/DryerRegistrationForm.tsx`
- `app/api/dryers/register/route.ts`

**Features:**
- Auto-generate dryer ID
- Serial number input
- Deployment date picker
- GPS coordinates (map picker)
- Physical address
- Region dropdown
- Hardware configuration inputs
- Owner selection/creation
- Preset assignment

#### 1.4 Individual Dryer Detail Page (4 days)
**Priority:** HIGH  
**Files to create:**
- `app/dashboard/dryers/[id]/page.tsx`
- `src/components/DryerDetailView.tsx`
- `src/components/DryerMetricsCards.tsx`
- `src/components/DryerOwnerPanel.tsx`

**Sections:**
- Real-time metrics (top cards)
- Preset information
- Owner information
- Quick actions
- Recent sensor readings table

### Sprint 2: Data Collection & Validation (Week 3-4)

#### 2.1 Enhanced Sensor Data Validation (3 days)
**Priority:** HIGH  
**Files to create:**
- `src/lib/sensor-validation.ts`
- `app/api/sensor-data/validation-rules.ts`

**Validation rules:**
```typescript
export const SENSOR_RANGES = {
  chamber_temp: { min: -20, max: 100, unit: '°C' },
  ambient_temp: { min: -20, max: 60, unit: '°C' },
  heater_temp: { min: 0, max: 150, unit: '°C' },
  chamber_humidity: { min: 0, max: 100, unit: '%' },
  ambient_humidity: { min: 0, max: 100, unit: '%' },
  battery_level: { min: 0, max: 100, unit: '%' },
  battery_voltage: { min: 0, max: 15, unit: 'V' },
  solar_voltage: { min: 0, max: 25, unit: 'V' },
  fan_speed: { min: 0, max: 2000, unit: 'RPM' },
};
```

#### 2.2 Preset Tracking Enhancement (2 days)
**Priority:** HIGH  
**Database migration:**

```sql
ALTER TABLE dryers ADD COLUMN preset_start_time TIMESTAMP;
ALTER TABLE dryers ADD COLUMN preset_estimated_completion TIMESTAMP;

CREATE TABLE preset_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dryer_id UUID REFERENCES dryers(id),
  preset_id UUID REFERENCES presets(id),
  start_time TIMESTAMP NOT NULL,
  estimated_completion TIMESTAMP,
  actual_completion TIMESTAMP,
  progress_percentage INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2.3 State Change Tracking (2 days)
**Priority:** MEDIUM  
**Database migration:**

```sql
CREATE TABLE device_state_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dryer_id UUID REFERENCES dryers(id),
  component VARCHAR(50), -- 'heater', 'fan', 'door'
  previous_state VARCHAR(20),
  new_state VARCHAR(20),
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_state_changes_dryer_time ON device_state_changes(dryer_id, timestamp DESC);
```

#### 2.4 Charging Status Calculation (1 day)
**Priority:** MEDIUM  
**Files to create:**
- `src/lib/power-calculations.ts`

```typescript
export function calculateChargingStatus(
  solarVoltage: number,
  batteryVoltage: number,
  batteryLevel: number
): 'charging' | 'discharging' | 'float' | 'offline' {
  // Logic to determine charging status
}
```

### Sprint 3: Alerts & Notifications (Week 5-6)

#### 3.1 Alert Generation Logic (4 days)
**Priority:** HIGH  
**Files to create:**
- `src/lib/alert-generator.ts`
- `app/api/alerts/generate/route.ts`
- `src/lib/alert-rules.ts`

**Alert rules to implement:**
```typescript
export const ALERT_RULES = {
  critical: {
    high_temperature: { threshold: 80, message: 'Fire risk - Temperature exceeds 80°C' },
    battery_critical: { threshold: 10, message: 'Battery critically low' },
    offline_long: { duration: 3600, message: 'Dryer offline for over 1 hour' },
  },
  warning: {
    temperature_high: { threshold: 70, message: 'Temperature above normal' },
    battery_low: { threshold: 30, message: 'Battery low' },
    offline_short: { duration: 900, message: 'Dryer offline for 15 minutes' },
  },
  info: {
    cycle_complete: { message: 'Drying cycle completed' },
    maintenance_due: { message: 'Maintenance due soon' },
  },
};
```

#### 3.2 Alert Acknowledgment System (2 days)
**Priority:** HIGH  
**Files to create:**
- `app/api/alerts/[id]/acknowledge/route.ts`
- `src/components/AlertActions.tsx`

**Features:**
- Acknowledge button
- Add notes/comments
- Assign to technician
- Mark as resolved
- Dismiss false positive

#### 3.3 Email Notification System (3 days)
**Priority:** HIGH  
**Files to create:**
- `src/lib/email-service.ts`
- `src/lib/email-templates.ts`
- `app/api/alerts/notify/route.ts`

**Email templates:**
- Critical alert notification
- Warning alert notification
- Daily summary
- Weekly report

**Integration:**
- Use Resend or SendGrid
- Configure SMTP settings
- Store email preferences per user

#### 3.4 Alert Configuration UI (2 days)
**Priority:** HIGH  
**Files to create:**
- `app/dashboard/settings/alerts/page.tsx`
- `src/components/AlertConfigForm.tsx`

**Features:**
- Enable/disable alert types
- Custom thresholds per dryer
- Email recipient management
- Escalation rules

---

## Phase 2: Enhanced Features (Weeks 7-12)

### Sprint 4: Data Export (Week 7-8)

#### 4.1 CSV Export Functionality (3 days)
**Priority:** HIGH  
**Files to create:**
- `app/api/export/csv/route.ts`
- `src/lib/csv-generator.ts`
- `src/components/ExportDialog.tsx`

**Features:**
- Select dryer(s)
- Date range picker
- Field selector (checkboxes)
- Download CSV
- Filename: `dryer-{id}_{start}_to_{end}.csv`

#### 4.2 PDF Report Generation (4 days)
**Priority:** HIGH  
**Files to create:**
- `app/api/export/pdf/route.ts`
- `src/lib/pdf-generator.ts`
- `src/templates/report-templates.tsx`

**Libraries:**
- Use `@react-pdf/renderer` or `puppeteer`

**Report types:**
- Daily summary
- Weekly performance
- Maintenance report
- Custom date range

#### 4.3 Export UI with Permissions (2 days)
**Priority:** HIGH  
**Files to create:**
- `app/dashboard/export/page.tsx`
- `src/components/ExportCenter.tsx`

**Features:**
- Role-based export options
- Export history
- Download management
- Progress indicators

### Sprint 5: Visualizations (Week 9-10)

#### 5.1 Interactive Map View (4 days)
**Priority:** HIGH  
**Files to create:**
- `src/components/DryerMap.tsx`
- `app/dashboard/map/page.tsx`

**Libraries:**
- Use `react-leaflet`

**Features:**
- Color-coded markers by status
- Click marker for quick info
- Zoom to region
- Filter by status
- Cluster markers when zoomed out

#### 5.2 Time-Series Graphs (4 days)
**Priority:** HIGH  
**Files to create:**
- `src/components/charts/TemperatureChart.tsx`
- `src/components/charts/HumidityChart.tsx`
- `src/components/charts/PowerChart.tsx`
- `src/components/charts/FanSpeedChart.tsx`

**Libraries:**
- Use `recharts`

**Features:**
- Time range selector (6h, 24h, 7d, 30d)
- Zoom and pan
- Tooltip with details
- Export chart as image
- Real-time updates

#### 5.3 Operational Timeline (3 days)
**Priority:** MEDIUM  
**Files to create:**
- `src/components/OperationalTimeline.tsx`

**Features:**
- Heater ON/OFF periods
- Fan ON/OFF periods
- Door open events
- Preset changes
- Zoomable, scrollable

### Sprint 6: Preset & Assignment Management (Week 11-12)

#### 6.1 Preset CRUD Operations (4 days)
**Priority:** HIGH  
**Files to create:**
- `app/api/presets/route.ts` (POST, PUT, DELETE)
- `src/components/PresetForm.tsx`
- `src/components/PresetEditDialog.tsx`
- `src/components/PresetDeleteDialog.tsx`

**Features:**
- Create new preset
- Edit existing preset
- Delete preset (with validation)
- Version control
- Audit trail

#### 6.2 Assign Preset to Dryer (2 days)
**Priority:** HIGH  
**Files to create:**
- `app/api/dryers/[id]/preset/route.ts`
- `src/components/AssignPresetDialog.tsx`

**Features:**
- Select preset dropdown
- Confirmation dialog
- Audit logging
- Notification to technician

#### 6.3 Region Assignment Interface (3 days)
**Priority:** HIGH  
**Files to create:**
- `app/dashboard/regions/page.tsx`
- `src/components/RegionManagement.tsx`
- `src/components/AssignRegionDialog.tsx`

**Features:**
- View all regions
- Assign users to regions
- Assign dryers to regions
- Region statistics

#### 6.4 Dryer Assignment Interface (3 days)
**Priority:** HIGH  
**Files to create:**
- `app/dashboard/assignments/page.tsx`
- `src/components/DryerAssignments.tsx`
- `src/components/AssignTechnicianDialog.tsx`

**Features:**
- Assign technicians to dryers
- View all assignments
- Bulk assignment
- Assignment history

---

## Phase 3: System Features (Weeks 13-16)

### Sprint 7: System Settings (Week 13-14)

#### 7.1 System Settings Page (4 days)
**Priority:** MEDIUM  
**Files to create:**
- `app/dashboard/settings/page.tsx`
- `src/components/SystemSettings.tsx`
- `app/api/settings/route.ts`

**Database migration:**
```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50),
  key VARCHAR(100),
  value TEXT,
  data_type VARCHAR(20),
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 7.2 General Settings (2 days)
**Files to create:**
- `src/components/settings/GeneralSettings.tsx`

**Settings:**
- Company name
- Company logo upload
- Contact email
- Support phone
- Default timezone

#### 7.3 Alert Settings (2 days)
**Files to create:**
- `src/components/settings/AlertSettings.tsx`

**Settings:**
- Global alert thresholds
- Email server configuration
- Escalation rules
- Notification preferences

#### 7.4 Data & User Settings (2 days)
**Files to create:**
- `src/components/settings/DataSettings.tsx`
- `src/components/settings/UserSettings.tsx`

**Settings:**
- Data retention policy
- Backup schedule
- API rate limits
- Password policy
- Session timeout
- 2FA enforcement

### Sprint 8: Advanced Analytics (Week 15-16)

#### 8.1 Usage Pattern Analytics (3 days)
**Priority:** MEDIUM  
**Files to create:**
- `src/components/analytics/UsagePatterns.tsx`
- `app/api/analytics/usage/route.ts`

**Features:**
- Peak usage hours histogram
- Most used presets
- Seasonal trends
- Regional comparison

#### 8.2 Maintenance Analytics (3 days)
**Priority:** MEDIUM  
**Files to create:**
- `src/components/analytics/MaintenanceAnalytics.tsx`
- `app/api/analytics/maintenance/route.ts`

**Features:**
- Average time between maintenance
- Common failure modes
- Maintenance cost tracking
- Predictive indicators

#### 8.3 Fleet Performance Metrics (3 days)
**Priority:** MEDIUM  
**Files to create:**
- `src/components/analytics/FleetPerformance.tsx`
- `app/api/analytics/fleet/route.ts`

**Features:**
- Total drying hours
- Average chamber temperature
- Total energy generated
- Uptime percentage
- Efficiency metrics

#### 8.4 Recent Activity Feed (2 days)
**Priority:** MEDIUM  
**Files to create:**
- `src/components/ActivityFeed.tsx`
- `app/api/activity/route.ts`

**Database migration:**
```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dryer_id UUID REFERENCES dryers(id),
  user_id UUID REFERENCES profiles(id),
  activity_type VARCHAR(50),
  description TEXT,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_timestamp ON activity_log(timestamp DESC);
```

---

## Database Migrations Summary

### Priority 1 (Immediate)
1. `dryer_hardware_config` table
2. `preset_sessions` table
3. `device_state_changes` table
4. Add `preset_start_time` to dryers
5. Add `preset_estimated_completion` to dryers

### Priority 2 (Phase 1)
1. `alert_configuration` table
2. `alert_comments` table
3. `alert_assignments` table
4. `export_history` table

### Priority 3 (Phase 2)
1. `system_settings` table
2. `activity_log` table
3. `maintenance_records` table
4. `preset_versions` table

---

## API Endpoints Summary

### Dryers
- `POST /api/dryers/register` - Register new dryer
- `GET /api/dryers/[id]` - Get dryer details
- `PUT /api/dryers/[id]` - Update dryer
- `DELETE /api/dryers/[id]` - Delete dryer
- `POST /api/dryers/[id]/preset` - Assign preset
- `GET /api/dryers/[id]/history` - Get dryer history

### Alerts
- `POST /api/alerts/generate` - Generate alerts (cron job)
- `POST /api/alerts/[id]/acknowledge` - Acknowledge alert
- `POST /api/alerts/[id]/comment` - Add comment
- `POST /api/alerts/[id]/assign` - Assign to technician
- `PUT /api/alerts/[id]/resolve` - Resolve alert
- `GET /api/alerts/configuration` - Get alert config
- `PUT /api/alerts/configuration` - Update alert config

### Export
- `POST /api/export/csv` - Export CSV
- `POST /api/export/pdf` - Generate PDF report
- `GET /api/export/history` - Get export history

### Presets
- `POST /api/presets` - Create preset
- `PUT /api/presets/[id]` - Update preset
- `DELETE /api/presets/[id]` - Delete preset
- `GET /api/presets/[id]/versions` - Get preset versions

### Analytics
- `GET /api/analytics/usage` - Usage patterns
- `GET /api/analytics/maintenance` - Maintenance analytics
- `GET /api/analytics/fleet` - Fleet performance

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings
- `GET /api/settings/[category]` - Get category settings

### Assignments
- `POST /api/assignments` - Create assignment
- `GET /api/assignments/technician/[id]` - Get technician assignments
- `DELETE /api/assignments/[id]` - Remove assignment

---

## Testing Strategy

### Unit Tests
- Sensor data validation
- Alert generation logic
- Permission checks
- Data calculations

### Integration Tests
- API endpoints
- Database operations
- Email notifications
- Export functionality

### E2E Tests
- User registration flow
- Dryer registration flow
- Alert acknowledgment flow
- Data export flow

---

## Deployment Checklist

### Before Phase 1
- [ ] Set up staging environment
- [ ] Configure email service (Resend/SendGrid)
- [ ] Set up database backups
- [ ] Configure monitoring (Sentry)
- [ ] Set up CI/CD pipeline

### Before Phase 2
- [ ] Load testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation update

### Before Phase 3
- [ ] User acceptance testing
- [ ] Training materials
- [ ] Migration plan
- [ ] Rollback plan

---

## Success Metrics

### Phase 1
- All dryers registered with complete information
- 100% data validation coverage
- Alert generation working for all types
- Email notifications sent successfully

### Phase 2
- Users can export data in CSV/PDF
- Interactive map showing all dryers
- Time-series graphs displaying correctly
- Preset management fully functional

### Phase 3
- System settings configurable
- Advanced analytics providing insights
- Activity feed showing all events
- 95%+ uptime

---

## Resource Requirements

### Development Team
- 2 Full-stack developers
- 1 Frontend specialist
- 1 Backend specialist
- 1 QA engineer
- 1 DevOps engineer

### Infrastructure
- PostgreSQL database (production)
- Redis for caching
- Email service (Resend/SendGrid)
- File storage (S3 or similar)
- Monitoring (Sentry, DataDog)

### Budget Estimate
- Development: 12-16 weeks × team size
- Infrastructure: $500-1000/month
- Third-party services: $200-500/month
- Testing & QA: 20% of development time

---

## Risk Mitigation

### Technical Risks
- **Data validation complexity:** Start with basic rules, iterate
- **Real-time updates:** Use polling initially, WebSockets later
- **Map performance:** Implement clustering and lazy loading
- **PDF generation:** Use cloud service if performance issues

### Business Risks
- **Scope creep:** Stick to prioritized roadmap
- **User adoption:** Provide training and documentation
- **Data migration:** Test thoroughly in staging
- **Downtime:** Plan maintenance windows

---

## Next Steps

1. **Review and approve** this implementation plan
2. **Set up development environment** for team
3. **Create database migrations** for Phase 1
4. **Start Sprint 1** with dryer registration
5. **Weekly progress reviews** with stakeholders
6. **Bi-weekly demos** to gather feedback

---

**Document Version:** 1.0  
**Last Updated:** February 2, 2026  
**Next Review:** Start of each sprint
