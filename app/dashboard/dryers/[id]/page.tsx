'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Battery, 
  Signal, 
  MapPin, 
  User, 
  Settings, 
  Activity,
  Download,
  FileText,
  AlertTriangle,
  Clock,
  Thermometer,
  Droplets,
  Wind,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface DryerDetail {
  id: string
  dryer_id: string
  serial_number: string
  status: string
  deployment_date: string
  battery_level: number | null
  battery_voltage: number | null
  signal_strength: number | null
  last_communication: string | null
  location_address: string | null
  location_latitude: number | null
  location_longitude: number | null
  active_alerts_count: number
  total_runtime_hours: number | null
  num_temp_sensors: number
  num_humidity_sensors: number
  num_fans: number
  num_heaters: number
  solar_capacity_w: number | null
  battery_capacity_ah: number | null
  owner: { name: string; phone: string; email: string | null } | null
  region: { name: string; code: string } | null
  current_preset: { preset_id: string; crop_type: string; region: string } | null
}

export default function DryerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [dryer, setDryer] = useState<DryerDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchDryerDetails()
    }
  }, [params.id])

  const fetchDryerDetails = async () => {
    try {
      const response = await fetch(`/api/dryers/${params.id}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setDryer(data.dryer)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load dryer details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: 'default',
      idle: 'secondary',
      offline: 'destructive',
      maintenance: 'outline',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getDaysActive = (deploymentDate: string) => {
    const deployed = new Date(deploymentDate)
    const now = new Date()
    const diffMs = now.getTime() - deployed.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!dryer) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Dryer not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/dryers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{dryer.dryer_id}</h1>
            <p className="text-muted-foreground">Serial: {dryer.serial_number}</p>
          </div>
          {getStatusBadge(dryer.status)}
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Real-time Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Battery className="h-4 w-4" />
              Battery Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dryer.battery_level !== null ? `${dryer.battery_level}%` : 'N/A'}
            </div>
            {dryer.battery_voltage && (
              <p className="text-xs text-muted-foreground">{dryer.battery_voltage}V</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Signal className="h-4 w-4" />
              Signal Strength
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dryer.signal_strength !== null ? `${dryer.signal_strength}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Communication</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dryer.active_alerts_count}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Runtime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dryer.total_runtime_hours?.toFixed(1) || '0.0'}h
            </div>
            <p className="text-xs text-muted-foreground">
              {getDaysActive(dryer.deployment_date)} days active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hardware">Hardware</TabsTrigger>
          <TabsTrigger value="owner">Owner Info</TabsTrigger>
          <TabsTrigger value="preset">Preset</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">
                    {dryer.location_address || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Region</p>
                  <p className="text-sm text-muted-foreground">
                    {dryer.region?.name || 'Not assigned'}
                  </p>
                </div>
                {dryer.location_latitude && dryer.location_longitude && (
                  <div>
                    <p className="text-sm font-medium">GPS Coordinates</p>
                    <p className="text-sm text-muted-foreground">
                      {dryer.location_latitude.toFixed(6)}, {dryer.location_longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Current Status</p>
                  <div className="mt-1">{getStatusBadge(dryer.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium">Deployment Date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(dryer.deployment_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Communication</p>
                  <p className="text-sm text-muted-foreground">
                    {dryer.last_communication 
                      ? new Date(dryer.last_communication).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Hardware Tab */}
        <TabsContent value="hardware" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Hardware Configuration
              </CardTitle>
              <CardDescription>
                Sensor counts and power specifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    Temperature Sensors
                  </p>
                  <p className="text-2xl font-bold">{dryer.num_temp_sensors}</p>
                </div>
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Humidity Sensors
                  </p>
                  <p className="text-2xl font-bold">{dryer.num_humidity_sensors}</p>
                </div>
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Wind className="h-4 w-4" />
                    Fans
                  </p>
                  <p className="text-2xl font-bold">{dryer.num_fans}</p>
                </div>
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Heaters
                  </p>
                  <p className="text-2xl font-bold">{dryer.num_heaters}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Solar Capacity</p>
                  <p className="text-2xl font-bold">
                    {dryer.solar_capacity_w ? `${dryer.solar_capacity_w}W` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Battery Capacity</p>
                  <p className="text-2xl font-bold">
                    {dryer.battery_capacity_ah ? `${dryer.battery_capacity_ah}Ah` : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Owner Tab */}
        <TabsContent value="owner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Owner Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dryer.owner ? (
                <>
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-lg">{dryer.owner.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{dryer.owner.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {dryer.owner.email || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No owner information available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preset Tab */}
        <TabsContent value="preset" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Preset</CardTitle>
              <CardDescription>Current drying configuration</CardDescription>
            </CardHeader>
            <CardContent>
              {dryer.current_preset ? (
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Preset ID</p>
                    <p className="text-lg">{dryer.current_preset.preset_id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Crop Type</p>
                      <Badge>{dryer.current_preset.crop_type}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Region</p>
                      <Badge variant="outline">{dryer.current_preset.region}</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No preset assigned</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
