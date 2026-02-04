'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wind, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Building2,
  Activity,
  Signal,
  Battery,
  AlertCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DryerInfo {
  id: string;
  dryer_id: string;
  serial_number: string;
  status: 'active' | 'inactive' | 'maintenance' | 'offline' | 'decommissioned';
  deployment_date: string;
  deployment_duration_days?: number;
  location_latitude?: number;
  location_longitude?: number;
  location_address?: string;
  region_name?: string;
  last_communication?: string;
  communication_status?: string;
  total_runtime_hours?: number;
  battery_level?: number;
  battery_voltage?: number;
  signal_strength?: number;
  active_alerts_count?: number;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  owner_address?: string;
  farm_business_name?: string;
  assigned_technician_name?: string;
  current_crop_type?: string;
}

interface DryerInfoCardProps {
  dryer: DryerInfo;
}

export function DryerInfoCard({ dryer }: DryerInfoCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'decommissioned':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCommunicationStatusColor = (status?: string) => {
    switch (status) {
      case 'Online':
        return 'bg-green-500';
      case 'Recent':
        return 'bg-blue-500';
      case 'Today':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  const formatDuration = (days?: number) => {
    if (!days) return 'N/A';
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const remainingDays = Math.floor(days % 30);

    const parts = [];
    if (years > 0) parts.push(`${years}y`);
    if (months > 0) parts.push(`${months}m`);
    if (remainingDays > 0) parts.push(`${remainingDays}d`);

    return parts.join(' ') || '0d';
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Wind className="h-6 w-6 text-primary" />
                {dryer.dryer_id}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Serial: {dryer.serial_number}
              </p>
            </div>
            <Badge className={getStatusColor(dryer.status)}>
              {dryer.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Last Communication */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>Last Communication</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${getCommunicationStatusColor(dryer.communication_status)}`} />
                <p className="text-sm font-medium">
                  {dryer.last_communication 
                    ? formatDistanceToNow(new Date(dryer.last_communication), { addSuffix: true })
                    : 'Never'}
                </p>
              </div>
            </div>

            {/* Runtime Hours */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Total Runtime</span>
              </div>
              <p className="text-sm font-medium">
                {dryer.total_runtime_hours?.toFixed(1) || '0.0'} hours
              </p>
            </div>

            {/* Deployment Duration */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Deployed For</span>
              </div>
              <p className="text-sm font-medium">
                {formatDuration(dryer.deployment_duration_days)}
              </p>
            </div>

            {/* Active Alerts */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Active Alerts</span>
              </div>
              <p className={`text-sm font-medium ${dryer.active_alerts_count && dryer.active_alerts_count > 0 ? 'text-red-600' : ''}`}>
                {dryer.active_alerts_count || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dryer.region_name && (
              <div>
                <p className="text-sm text-muted-foreground">Region</p>
                <p className="text-sm font-medium">{dryer.region_name}</p>
              </div>
            )}
            
            {dryer.location_address && (
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="text-sm font-medium">{dryer.location_address}</p>
              </div>
            )}

            {(dryer.location_latitude && dryer.location_longitude) && (
              <div>
                <p className="text-sm text-muted-foreground">GPS Coordinates</p>
                <p className="text-sm font-medium font-mono">
                  {dryer.location_latitude.toFixed(6)}, {dryer.location_longitude.toFixed(6)}
                </p>
                <a
                  href={`https://www.google.com/maps?q=${dryer.location_latitude},${dryer.location_longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View on Google Maps →
                </a>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Deployment Date</p>
              <p className="text-sm font-medium">
                {new Date(dryer.deployment_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Owner Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Owner Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dryer.owner_name && (
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{dryer.owner_name}</p>
              </div>
            )}

            {dryer.farm_business_name && (
              <div>
                <p className="text-sm text-muted-foreground">Farm/Business</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {dryer.farm_business_name}
                </p>
              </div>
            )}

            {dryer.owner_phone && (
              <div>
                <p className="text-sm text-muted-foreground">Contact Phone</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${dryer.owner_phone}`} className="hover:underline">
                    {dryer.owner_phone}
                  </a>
                </p>
              </div>
            )}

            {dryer.owner_email && (
              <div>
                <p className="text-sm text-muted-foreground">Contact Email</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${dryer.owner_email}`} className="hover:underline">
                    {dryer.owner_email}
                  </a>
                </p>
              </div>
            )}

            {dryer.owner_address && (
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="text-sm font-medium">{dryer.owner_address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dryer.battery_level !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Battery Level</p>
                <div className="flex items-center gap-2">
                  <Battery className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{dryer.battery_level}%</span>
                      {dryer.battery_voltage && (
                        <span className="text-xs text-muted-foreground">{dryer.battery_voltage}V</span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          dryer.battery_level > 60 ? 'bg-green-500' :
                          dryer.battery_level > 30 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${dryer.battery_level}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {dryer.signal_strength !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Signal Strength</p>
                <div className="flex items-center gap-2">
                  <Signal className="h-4 w-4" />
                  <span className="text-sm font-medium">{dryer.signal_strength}%</span>
                </div>
              </div>
            )}

            {dryer.current_crop_type && (
              <div>
                <p className="text-sm text-muted-foreground">Current Crop</p>
                <p className="text-sm font-medium">{dryer.current_crop_type}</p>
              </div>
            )}

            {dryer.assigned_technician_name && (
              <div>
                <p className="text-sm text-muted-foreground">Assigned Technician</p>
                <p className="text-sm font-medium">{dryer.assigned_technician_name}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
