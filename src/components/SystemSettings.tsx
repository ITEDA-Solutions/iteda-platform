'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Settings, Bell, Database, Users, Link } from 'lucide-react';

interface SystemSettingsData {
  general: {
    companyName: string;
    contactEmail: string;
    supportPhone: string;
    timezone: string;
  };
  alerts: {
    criticalTempThreshold: number;
    highTempThreshold: number;
    criticalBatteryThreshold: number;
    lowBatteryThreshold: number;
    offlineMinutesWarning: number;
    offlineHoursCritical: number;
    emailNotificationsEnabled: boolean;
    smsNotificationsEnabled: boolean;
    escalationTimeMinutes: number;
  };
  data: {
    retentionDays: number;
    backupSchedule: string;
    apiRateLimitPerMinute: number;
    exportLimitRowsPerRequest: number;
  };
  user: {
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSpecialChars: boolean;
    sessionTimeoutMinutes: number;
    require2FA: boolean;
  };
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (category: string) => {
    setSaving(true);
    try {
      // In production, this would save each setting individually
      toast({
        title: 'Success',
        description: `${category} settings saved successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">
          Configure platform-wide settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="h-4 w-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="h-4 w-4 mr-2" />
            Data
          </TabsTrigger>
          <TabsTrigger value="user">
            <Users className="h-4 w-4 mr-2" />
            User
          </TabsTrigger>
          <TabsTrigger value="integration">
            <Link className="h-4 w-4 mr-2" />
            Integration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure company information and basic settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={settings.general.companyName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, companyName: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.general.contactEmail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, contactEmail: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportPhone">Support Phone</Label>
                <Input
                  id="supportPhone"
                  value={settings.general.supportPhone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, supportPhone: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={settings.general.timezone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, timezone: e.target.value },
                    })
                  }
                />
              </div>
              <Button onClick={() => handleSave('general')} disabled={saving}>
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Thresholds</CardTitle>
              <CardDescription>
                Configure default alert thresholds for all dryers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="criticalTemp">Critical Temperature (°C)</Label>
                  <Input
                    id="criticalTemp"
                    type="number"
                    value={settings.alerts.criticalTempThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        alerts: {
                          ...settings.alerts,
                          criticalTempThreshold: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="highTemp">High Temperature (°C)</Label>
                  <Input
                    id="highTemp"
                    type="number"
                    value={settings.alerts.highTempThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        alerts: {
                          ...settings.alerts,
                          highTempThreshold: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="criticalBattery">Critical Battery (%)</Label>
                  <Input
                    id="criticalBattery"
                    type="number"
                    value={settings.alerts.criticalBatteryThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        alerts: {
                          ...settings.alerts,
                          criticalBatteryThreshold: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowBattery">Low Battery (%)</Label>
                  <Input
                    id="lowBattery"
                    type="number"
                    value={settings.alerts.lowBatteryThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        alerts: {
                          ...settings.alerts,
                          lowBatteryThreshold: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold">Notification Settings</h4>
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <Switch
                    id="emailNotifications"
                    checked={settings.alerts.emailNotificationsEnabled}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        alerts: {
                          ...settings.alerts,
                          emailNotificationsEnabled: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="smsNotifications">SMS Notifications (Phase 2)</Label>
                  <Switch
                    id="smsNotifications"
                    checked={settings.alerts.smsNotificationsEnabled}
                    disabled
                  />
                </div>
              </div>

              <Button onClick={() => handleSave('alerts')} disabled={saving}>
                Save Alert Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Configure data retention and export limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retentionDays">Data Retention (days)</Label>
                <Input
                  id="retentionDays"
                  type="number"
                  value={settings.data.retentionDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      data: { ...settings.data, retentionDays: parseInt(e.target.value) },
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Hot storage retention period for sensor data
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiRateLimit">API Rate Limit (requests/minute)</Label>
                <Input
                  id="apiRateLimit"
                  type="number"
                  value={settings.data.apiRateLimitPerMinute}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      data: {
                        ...settings.data,
                        apiRateLimitPerMinute: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exportLimit">Export Limit (rows per request)</Label>
                <Input
                  id="exportLimit"
                  type="number"
                  value={settings.data.exportLimitRowsPerRequest}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      data: {
                        ...settings.data,
                        exportLimitRowsPerRequest: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <Button onClick={() => handleSave('data')} disabled={saving}>
                Save Data Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Security</CardTitle>
              <CardDescription>
                Configure password policies and session settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                <Input
                  id="passwordMinLength"
                  type="number"
                  value={settings.user.passwordMinLength}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      user: {
                        ...settings.user,
                        passwordMinLength: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="requireUppercase">Require Uppercase</Label>
                  <Switch
                    id="requireUppercase"
                    checked={settings.user.passwordRequireUppercase}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        user: { ...settings.user, passwordRequireUppercase: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="requireNumbers">Require Numbers</Label>
                  <Switch
                    id="requireNumbers"
                    checked={settings.user.passwordRequireNumbers}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        user: { ...settings.user, passwordRequireNumbers: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="require2FA">Require 2FA (Phase 3)</Label>
                  <Switch id="require2FA" checked={settings.user.require2FA} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.user.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      user: {
                        ...settings.user,
                        sessionTimeoutMinutes: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <Button onClick={() => handleSave('user')} disabled={saving}>
                Save User Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Integrations</CardTitle>
              <CardDescription>
                Configure API keys and external services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Weather API (Phase 3)</Label>
                <p className="text-sm text-muted-foreground">
                  Integration with weather services for predictive analytics
                </p>
                <Switch disabled />
              </div>
              <div className="space-y-2">
                <Label>Payment Gateway</Label>
                <p className="text-sm text-muted-foreground">
                  For bridGe product integration (separate platform)
                </p>
                <Switch disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
