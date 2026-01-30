'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DryerRegistrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface OwnerData {
  name: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  farm_business_name: string;
}

interface DryerData {
  dryer_id: string;
  serial_number: string;
  deployment_date: string;
  location_latitude: string;
  location_longitude: string;
  location_address: string;
  region_id: string;
  status: string;
}

export function DryerRegistrationForm({ open, onOpenChange, onSuccess }: DryerRegistrationFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);

  // Owner information
  const [ownerData, setOwnerData] = useState<OwnerData>({
    name: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    farm_business_name: '',
  });

  // Dryer information
  const [dryerData, setDryerData] = useState<DryerData>({
    dryer_id: '',
    serial_number: '',
    deployment_date: new Date().toISOString().split('T')[0],
    location_latitude: '',
    location_longitude: '',
    location_address: '',
    region_id: '',
    status: 'inactive',
  });

  // Load regions when dialog opens
  useState(() => {
    if (open) {
      loadRegions();
    }
  });

  const loadRegions = async () => {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .order('name');

    if (!error && data) {
      setRegions(data);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDryerData({
            ...dryerData,
            location_latitude: position.coords.latitude.toFixed(8),
            location_longitude: position.coords.longitude.toFixed(8),
          });
          setIsLoading(false);
          toast({
            title: "Location captured",
            description: "GPS coordinates have been set.",
          });
        },
        (error) => {
          setIsLoading(false);
          toast({
            title: "Location error",
            description: "Could not get current location. Please enter manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Not supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, create the owner
      const { data: ownerResult, error: ownerError } = await supabase
        .from('owners')
        .insert([ownerData])
        .select()
        .single();

      if (ownerError) throw ownerError;

      // Then, create the dryer with owner reference
      const { data: dryerResult, error: dryerError } = await supabase
        .from('dryers')
        .insert([{
          ...dryerData,
          owner_id: ownerResult.id,
          deployment_date: new Date(dryerData.deployment_date).toISOString(),
          location_latitude: dryerData.location_latitude ? parseFloat(dryerData.location_latitude) : null,
          location_longitude: dryerData.location_longitude ? parseFloat(dryerData.location_longitude) : null,
        }])
        .select()
        .single();

      if (dryerError) throw dryerError;

      toast({
        title: "Dryer registered successfully",
        description: `Dryer ${dryerData.dryer_id} has been registered.`,
      });

      // Reset form
      setOwnerData({
        name: '',
        contact_phone: '',
        contact_email: '',
        address: '',
        farm_business_name: '',
      });
      setDryerData({
        dryer_id: '',
        serial_number: '',
        deployment_date: new Date().toISOString().split('T')[0],
        location_latitude: '',
        location_longitude: '',
        location_address: '',
        region_id: '',
        status: 'inactive',
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Dryer</DialogTitle>
          <DialogDescription>
            Enter the dryer details and owner information to register a new dryer unit.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dryer Registration Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dryer Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dryer_id">Dryer ID *</Label>
                <Input
                  id="dryer_id"
                  value={dryerData.dryer_id}
                  onChange={(e) => setDryerData({ ...dryerData, dryer_id: e.target.value })}
                  placeholder="DRY-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial_number">Serial Number *</Label>
                <Input
                  id="serial_number"
                  value={dryerData.serial_number}
                  onChange={(e) => setDryerData({ ...dryerData, serial_number: e.target.value })}
                  placeholder="SN123456789"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deployment_date">Deployment Date *</Label>
                <Input
                  id="deployment_date"
                  type="date"
                  value={dryerData.deployment_date}
                  onChange={(e) => setDryerData({ ...dryerData, deployment_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select
                  value={dryerData.region_id}
                  onValueChange={(value) => setDryerData({ ...dryerData, region_id: value })}
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
            </div>
          </div>

          {/* Installation Location Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Installation Location</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                disabled={isLoading}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Get Current Location
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  value={dryerData.location_latitude}
                  onChange={(e) => setDryerData({ ...dryerData, location_latitude: e.target.value })}
                  placeholder="0.0000000"
                  type="number"
                  step="0.00000001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  value={dryerData.location_longitude}
                  onChange={(e) => setDryerData({ ...dryerData, location_longitude: e.target.value })}
                  placeholder="0.0000000"
                  type="number"
                  step="0.00000001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_address">Address</Label>
              <Textarea
                id="location_address"
                value={dryerData.location_address}
                onChange={(e) => setDryerData({ ...dryerData, location_address: e.target.value })}
                placeholder="Physical address or location description"
                rows={2}
              />
            </div>
          </div>

          {/* Owner Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Owner Information</h3>

            <div className="space-y-2">
              <Label htmlFor="owner_name">Owner Name *</Label>
              <Input
                id="owner_name"
                value={ownerData.name}
                onChange={(e) => setOwnerData({ ...ownerData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={ownerData.contact_phone}
                  onChange={(e) => setOwnerData({ ...ownerData, contact_phone: e.target.value })}
                  placeholder="+254700000000"
                  type="tel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  value={ownerData.contact_email}
                  onChange={(e) => setOwnerData({ ...ownerData, contact_email: e.target.value })}
                  placeholder="owner@example.com"
                  type="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_address">Address</Label>
              <Textarea
                id="owner_address"
                value={ownerData.address}
                onChange={(e) => setOwnerData({ ...ownerData, address: e.target.value })}
                placeholder="Owner's physical address"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="farm_business_name">Farm/Business Name</Label>
              <Input
                id="farm_business_name"
                value={ownerData.farm_business_name}
                onChange={(e) => setOwnerData({ ...ownerData, farm_business_name: e.target.value })}
                placeholder="Green Valley Farm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Dryer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
