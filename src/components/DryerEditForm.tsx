'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { authFetch } from '@/hooks/useAuthFetch';

interface DryerEditFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dryer: any;
  onSuccess: () => void;
}

export function DryerEditForm({ open, onOpenChange, dryer, onSuccess }: DryerEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    status: dryer?.status || 'idle',
    location_address: dryer?.location_address || '',
    location_latitude: dryer?.location_latitude || '',
    location_longitude: dryer?.location_longitude || '',
    installation_notes: dryer?.installation_notes || '',
    solar_panel_wattage: dryer?.solar_panel_wattage || '',
    battery_capacity_ah: dryer?.battery_capacity_ah || '',
    heater_power_w: dryer?.heater_power_w || '',
    fan_power_w: dryer?.fan_power_w || '',
    chamber_capacity_kg: dryer?.chamber_capacity_kg || '',
  });

  useEffect(() => {
    if (open && dryer) {
      loadRegions();
      setFormData({
        status: dryer.status || 'idle',
        location_address: dryer.location_address || '',
        location_latitude: dryer.location_latitude || '',
        location_longitude: dryer.location_longitude || '',
        installation_notes: dryer.installation_notes || '',
        solar_panel_wattage: dryer.solar_panel_wattage || '',
        battery_capacity_ah: dryer.battery_capacity_ah || '',
        heater_power_w: dryer.heater_power_w || '',
        fan_power_w: dryer.fan_power_w || '',
        chamber_capacity_kg: dryer.chamber_capacity_kg || '',
      });
    }
  }, [open, dryer]);

  const loadRegions = async () => {
    try {
      const response = await fetch('/api/data/regions');
      const result = await response.json();
      if (result.regions) {
        setRegions(result.regions);
      }
    } catch (error) {
      console.error('Error loading regions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await authFetch(`/api/dryers/${dryer.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      if (error) {
        throw new Error(error.message || 'Failed to update dryer');
      }

      toast.success('Dryer updated successfully!');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating dryer:', error);
      toast.error(error.message || 'Failed to update dryer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Dryer: {dryer?.dryer_id}</DialogTitle>
          <DialogDescription>
            Update dryer information, location, and hardware specifications
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="hardware">Hardware</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="idle">Idle</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="installation_notes">Installation Notes</Label>
                <Textarea
                  id="installation_notes"
                  value={formData.installation_notes}
                  onChange={(e) => setFormData({ ...formData, installation_notes: e.target.value })}
                  placeholder="Any notes about the installation"
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="location_address">Address</Label>
                <Textarea
                  id="location_address"
                  value={formData.location_address}
                  onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                  placeholder="Full address"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location_latitude">Latitude</Label>
                  <Input
                    id="location_latitude"
                    type="number"
                    step="any"
                    value={formData.location_latitude}
                    onChange={(e) => setFormData({ ...formData, location_latitude: e.target.value })}
                    placeholder="e.g., -1.2921"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_longitude">Longitude</Label>
                  <Input
                    id="location_longitude"
                    type="number"
                    step="any"
                    value={formData.location_longitude}
                    onChange={(e) => setFormData({ ...formData, location_longitude: e.target.value })}
                    placeholder="e.g., 36.8219"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hardware" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="solar_panel_wattage">Solar Panel Wattage (W)</Label>
                  <Input
                    id="solar_panel_wattage"
                    type="number"
                    value={formData.solar_panel_wattage}
                    onChange={(e) => setFormData({ ...formData, solar_panel_wattage: e.target.value })}
                    placeholder="e.g., 300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="battery_capacity_ah">Battery Capacity (Ah)</Label>
                  <Input
                    id="battery_capacity_ah"
                    type="number"
                    value={formData.battery_capacity_ah}
                    onChange={(e) => setFormData({ ...formData, battery_capacity_ah: e.target.value })}
                    placeholder="e.g., 100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="heater_power_w">Heater Power (W)</Label>
                  <Input
                    id="heater_power_w"
                    type="number"
                    value={formData.heater_power_w}
                    onChange={(e) => setFormData({ ...formData, heater_power_w: e.target.value })}
                    placeholder="e.g., 500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fan_power_w">Fan Power (W)</Label>
                  <Input
                    id="fan_power_w"
                    type="number"
                    value={formData.fan_power_w}
                    onChange={(e) => setFormData({ ...formData, fan_power_w: e.target.value })}
                    placeholder="e.g., 50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chamber_capacity_kg">Chamber Capacity (kg)</Label>
                <Input
                  id="chamber_capacity_kg"
                  type="number"
                  value={formData.chamber_capacity_kg}
                  onChange={(e) => setFormData({ ...formData, chamber_capacity_kg: e.target.value })}
                  placeholder="e.g., 50"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Dryer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
