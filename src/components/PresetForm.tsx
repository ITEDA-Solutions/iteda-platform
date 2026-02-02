'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PresetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset?: any;
  onSuccess: () => void;
}

const CROP_TYPES = [
  'Maize',
  'Chili',
  'Beans',
  'Coffee',
  'Cassava',
  'Tomatoes',
  'Onions',
  'Fish',
  'Meat',
  'Other'
];

const REGIONS = [
  'Rift Valley',
  'Central',
  'Coast',
  'Western',
  'Eastern',
  'North Eastern',
  'Nyanza',
  'Nairobi'
];

export function PresetForm({ open, onOpenChange, preset, onSuccess }: PresetFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    crop_type: preset?.crop_type || '',
    region: preset?.region || '',
    target_temp_c: preset?.target_temp_c || '',
    target_humidity_pct: preset?.target_humidity_pct || '',
    fan_speed_rpm: preset?.fan_speed_rpm || '',
    duration_hours: preset?.duration_hours || '',
    min_temp_threshold: preset?.min_temp_threshold || '',
    max_temp_threshold: preset?.max_temp_threshold || '',
    description: preset?.description || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = preset ? `/api/presets/${preset.id}` : '/api/presets';
      const method = preset ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save preset');
      }

      toast.success(preset ? 'Preset updated successfully!' : 'Preset created successfully!');
      onSuccess();
      onOpenChange(false);
      
      // Reset form if creating new
      if (!preset) {
        setFormData({
          crop_type: '',
          region: '',
          target_temp_c: '',
          target_humidity_pct: '',
          fan_speed_rpm: '',
          duration_hours: '',
          min_temp_threshold: '',
          max_temp_threshold: '',
          description: '',
        });
      }
    } catch (error: any) {
      console.error('Error saving preset:', error);
      toast.error(error.message || 'Failed to save preset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{preset ? 'Edit Preset' : 'Create New Preset'}</DialogTitle>
          <DialogDescription>
            {preset ? 'Update the preset configuration' : 'Configure a new drying preset for a specific crop and region'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="crop_type">Crop Type *</Label>
              <Select
                value={formData.crop_type}
                onValueChange={(value) => setFormData({ ...formData, crop_type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select crop type" />
                </SelectTrigger>
                <SelectContent>
                  {CROP_TYPES.map((crop) => (
                    <SelectItem key={crop} value={crop}>
                      {crop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region *</Label>
              <Select
                value={formData.region}
                onValueChange={(value) => setFormData({ ...formData, region: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_temp_c">Target Temperature (°C) *</Label>
              <Input
                id="target_temp_c"
                type="number"
                step="0.1"
                value={formData.target_temp_c}
                onChange={(e) => setFormData({ ...formData, target_temp_c: e.target.value })}
                placeholder="e.g., 55"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_humidity_pct">Target Humidity (%) *</Label>
              <Input
                id="target_humidity_pct"
                type="number"
                step="0.1"
                value={formData.target_humidity_pct}
                onChange={(e) => setFormData({ ...formData, target_humidity_pct: e.target.value })}
                placeholder="e.g., 15"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fan_speed_rpm">Fan Speed (RPM) *</Label>
              <Input
                id="fan_speed_rpm"
                type="number"
                value={formData.fan_speed_rpm}
                onChange={(e) => setFormData({ ...formData, fan_speed_rpm: e.target.value })}
                placeholder="e.g., 1200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_hours">Duration (Hours) *</Label>
              <Input
                id="duration_hours"
                type="number"
                step="0.5"
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                placeholder="e.g., 8"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_temp_threshold">Min Temp Threshold (°C)</Label>
              <Input
                id="min_temp_threshold"
                type="number"
                step="0.1"
                value={formData.min_temp_threshold}
                onChange={(e) => setFormData({ ...formData, min_temp_threshold: e.target.value })}
                placeholder="e.g., 45"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_temp_threshold">Max Temp Threshold (°C)</Label>
              <Input
                id="max_temp_threshold"
                type="number"
                step="0.1"
                value={formData.max_temp_threshold}
                onChange={(e) => setFormData({ ...formData, max_temp_threshold: e.target.value })}
                placeholder="e.g., 65"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description or notes about this preset"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : preset ? 'Update Preset' : 'Create Preset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
