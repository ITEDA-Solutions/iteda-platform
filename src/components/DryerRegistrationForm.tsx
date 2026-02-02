'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, MapPin, Cpu, Battery, User, MapPinned } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Region {
  id: string;
  name: string;
  code: string;
}

export function DryerRegistrationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [currentTab, setCurrentTab] = useState("basic");

  // Generate Dryer ID automatically
  const generateDryerId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DRY-${year}-${random}`;
  };

  // Basic Information
  const [basicData, setBasicData] = useState({
    dryerId: generateDryerId(),
    serialNumber: '',
    deploymentDate: new Date().toISOString().split('T')[0],
    status: 'idle' as 'active' | 'idle' | 'offline' | 'maintenance' | 'decommissioned',
  });

  // Installation Location
  const [locationData, setLocationData] = useState({
    latitude: '',
    longitude: '',
    address: '',
    regionId: '',
  });

  // Hardware Configuration
  const [hardwareData, setHardwareData] = useState({
    numTempSensors: '3',
    numHumiditySensors: '2',
    numFans: '1',
    numHeaters: '1',
    solarCapacityW: '',
    batteryCapacityAh: '',
  });

  // Owner Information
  const [ownerData, setOwnerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    farmBusinessName: '',
    idNumber: '',
  });

  // Load regions
  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('id, name, code')
        .order('name');

      if (error) throw error;
      if (data) setRegions(data);
    } catch (error: any) {
      console.error('Error loading regions:', error);
      toast.error('Failed to load regions');
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationData({
          ...locationData,
          latitude: position.coords.latitude.toFixed(8),
          longitude: position.coords.longitude.toFixed(8),
        });
        setIsLoading(false);
        toast.success('GPS coordinates captured successfully');
      },
      (error) => {
        setIsLoading(false);
        toast.error('Could not get current location. Please enter manually.');
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Create owner first
      const { data: ownerResult, error: ownerError } = await supabase
        .from('dryer_owners')
        .insert({
          name: ownerData.name,
          phone: ownerData.phone,
          email: ownerData.email || null,
          address: ownerData.address,
          farm_business_name: ownerData.farmBusinessName,
          id_number: ownerData.idNumber,
        })
        .select()
        .single();

      if (ownerError) throw new Error(`Owner creation failed: ${ownerError.message}`);

      // 2. Create dryer with all information
      const { data: dryerResult, error: dryerError } = await supabase
        .from('dryers')
        .insert({
          dryer_id: basicData.dryerId,
          serial_number: basicData.serialNumber,
          deployment_date: new Date(basicData.deploymentDate).toISOString(),
          status: basicData.status,
          
          // Location
          location_latitude: locationData.latitude ? parseFloat(locationData.latitude) : null,
          location_longitude: locationData.longitude ? parseFloat(locationData.longitude) : null,
          location_address: locationData.address,
          region_id: locationData.regionId || null,
          
          // Hardware
          num_temp_sensors: parseInt(hardwareData.numTempSensors),
          num_humidity_sensors: parseInt(hardwareData.numHumiditySensors),
          num_fans: parseInt(hardwareData.numFans),
          num_heaters: parseInt(hardwareData.numHeaters),
          solar_capacity_w: hardwareData.solarCapacityW ? parseInt(hardwareData.solarCapacityW) : null,
          battery_capacity_ah: hardwareData.batteryCapacityAh ? parseInt(hardwareData.batteryCapacityAh) : null,
          
          // Owner reference
          farmer_id: ownerResult.id,
          
          // Initial values
          total_runtime_hours: 0,
          active_alerts_count: 0,
        })
        .select()
        .single();

      if (dryerError) throw new Error(`Dryer creation failed: ${dryerError.message}`);

      toast.success(`Dryer ${basicData.dryerId} registered successfully!`);
      
      // Reset form
      setBasicData({
        dryerId: generateDryerId(),
        serialNumber: '',
        deploymentDate: new Date().toISOString().split('T')[0],
        status: 'idle',
      });
      setLocationData({ latitude: '', longitude: '', address: '', regionId: '' });
      setHardwareData({
        numTempSensors: '3',
        numHumiditySensors: '2',
        numFans: '1',
        numHeaters: '1',
        solarCapacityW: '',
        batteryCapacityAh: '',
      });
      setOwnerData({
        name: '',
        phone: '',
        email: '',
        address: '',
        farmBusinessName: '',
        idNumber: '',
      });
      setCurrentTab("basic");

    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register dryer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="hardware">Hardware</TabsTrigger>
          <TabsTrigger value="owner">Owner</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Basic Dryer Information
              </CardTitle>
              <CardDescription>
                Enter the basic identification and deployment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dryerId">
                    Dryer ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dryerId"
                    value={basicData.dryerId}
                    onChange={(e) => setBasicData({ ...basicData, dryerId: e.target.value })}
                    placeholder="DRY-2024-001"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-generated: DRY-YYYY-###
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serialNumber">
                    Serial Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="serialNumber"
                    value={basicData.serialNumber}
                    onChange={(e) => setBasicData({ ...basicData, serialNumber: e.target.value })}
                    placeholder="SN123456789"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    From hardware unit
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deploymentDate">
                    Deployment Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="deploymentDate"
                    type="date"
                    value={basicData.deploymentDate}
                    onChange={(e) => setBasicData({ ...basicData, deploymentDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Initial Status</Label>
                  <Select
                    value={basicData.status}
                    onValueChange={(value: any) => setBasicData({ ...basicData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idle">Idle - Powered, not drying</SelectItem>
                      <SelectItem value="active">Active - Currently drying</SelectItem>
                      <SelectItem value="offline">Offline - No communication</SelectItem>
                      <SelectItem value="maintenance">Maintenance - Under service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPinned className="h-5 w-5" />
                    Installation Location
                  </CardTitle>
                  <CardDescription>
                    GPS coordinates and physical address
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={isLoading}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Get GPS
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    value={locationData.latitude}
                    onChange={(e) => setLocationData({ ...locationData, latitude: e.target.value })}
                    placeholder="-1.286389"
                    type="number"
                    step="0.00000001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    value={locationData.longitude}
                    onChange={(e) => setLocationData({ ...locationData, longitude: e.target.value })}
                    placeholder="36.817223"
                    type="number"
                    step="0.00000001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Physical Address</Label>
                <Textarea
                  id="address"
                  value={locationData.address}
                  onChange={(e) => setLocationData({ ...locationData, address: e.target.value })}
                  placeholder="Plot 123, Kiambu Road, Nairobi"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region/County</Label>
                <Select
                  value={locationData.regionId}
                  onValueChange={(value) => setLocationData({ ...locationData, regionId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hardware Configuration Tab */}
        <TabsContent value="hardware" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Battery className="h-5 w-5" />
                Hardware Configuration
              </CardTitle>
              <CardDescription>
                Sensor counts, solar capacity, and battery specifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numTempSensors">
                    Temperature Sensors <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="numTempSensors"
                    type="number"
                    min="1"
                    value={hardwareData.numTempSensors}
                    onChange={(e) => setHardwareData({ ...hardwareData, numTempSensors: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numHumiditySensors">
                    Humidity Sensors <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="numHumiditySensors"
                    type="number"
                    min="1"
                    value={hardwareData.numHumiditySensors}
                    onChange={(e) => setHardwareData({ ...hardwareData, numHumiditySensors: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numFans">
                    Number of Fans <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="numFans"
                    type="number"
                    min="1"
                    value={hardwareData.numFans}
                    onChange={(e) => setHardwareData({ ...hardwareData, numFans: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numHeaters">
                    Number of Heaters <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="numHeaters"
                    type="number"
                    min="0"
                    value={hardwareData.numHeaters}
                    onChange={(e) => setHardwareData({ ...hardwareData, numHeaters: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="solarCapacity">Solar Panel Capacity (W)</Label>
                  <Input
                    id="solarCapacity"
                    type="number"
                    min="0"
                    value={hardwareData.solarCapacityW}
                    onChange={(e) => setHardwareData({ ...hardwareData, solarCapacityW: e.target.value })}
                    placeholder="100"
                  />
                  <p className="text-xs text-muted-foreground">Watts</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batteryCapacity">Battery Capacity (Ah)</Label>
                  <Input
                    id="batteryCapacity"
                    type="number"
                    min="0"
                    value={hardwareData.batteryCapacityAh}
                    onChange={(e) => setHardwareData({ ...hardwareData, batteryCapacityAh: e.target.value })}
                    placeholder="100"
                  />
                  <p className="text-xs text-muted-foreground">Amp-hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Owner Information Tab */}
        <TabsContent value="owner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Owner Information
              </CardTitle>
              <CardDescription>
                Details about the dryer owner/operator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ownerName">
                  Owner Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ownerName"
                  value={ownerData.name}
                  onChange={(e) => setOwnerData({ ...ownerData, name: e.target.value })}
                  placeholder="John Kamau"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerPhone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="ownerPhone"
                    type="tel"
                    value={ownerData.phone}
                    onChange={(e) => setOwnerData({ ...ownerData, phone: e.target.value })}
                    placeholder="+254700000000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerEmail">Email</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={ownerData.email}
                    onChange={(e) => setOwnerData({ ...ownerData, email: e.target.value })}
                    placeholder="owner@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerAddress">Physical Address</Label>
                <Textarea
                  id="ownerAddress"
                  value={ownerData.address}
                  onChange={(e) => setOwnerData({ ...ownerData, address: e.target.value })}
                  placeholder="Owner's residential or business address"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="farmBusinessName">Farm/Business Name</Label>
                  <Input
                    id="farmBusinessName"
                    value={ownerData.farmBusinessName}
                    onChange={(e) => setOwnerData({ ...ownerData, farmBusinessName: e.target.value })}
                    placeholder="Green Valley Farm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID/Registration Number</Label>
                  <Input
                    id="idNumber"
                    value={ownerData.idNumber}
                    onChange={(e) => setOwnerData({ ...ownerData, idNumber: e.target.value })}
                    placeholder="12345678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div className="space-x-2">
          {currentTab !== "basic" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const tabs = ["basic", "location", "hardware", "owner"];
                const currentIndex = tabs.indexOf(currentTab);
                if (currentIndex > 0) setCurrentTab(tabs[currentIndex - 1]);
              }}
            >
              Previous
            </Button>
          )}
        </div>

        <div className="space-x-2">
          {currentTab !== "owner" ? (
            <Button
              type="button"
              onClick={() => {
                const tabs = ["basic", "location", "hardware", "owner"];
                const currentIndex = tabs.indexOf(currentTab);
                if (currentIndex < tabs.length - 1) setCurrentTab(tabs[currentIndex + 1]);
              }}
            >
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Dryer
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
