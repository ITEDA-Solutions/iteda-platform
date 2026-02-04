'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PresetForm } from './PresetForm';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface Preset {
  id: string;
  preset_id: string;
  crop_type: string;
  region: string;
  target_temp_c: number;
  target_humidity_pct: number;
  fan_speed_rpm: number;
  duration_hours: number;
  is_active: boolean;
  description: string | null;
}

export default function PresetsList() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const { toast } = useToast();

  const fetchPresets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data/presets');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPresets(data.presets || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load presets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const getCounts = () => {
    return {
      total: presets.length,
      active: presets.filter(p => p.is_active).length,
      inactive: presets.filter(p => !p.is_active).length,
    };
  };

  const counts = getCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Presets</h2>
          <p className="text-muted-foreground">
            Manage dryer operation presets
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchPresets} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => { setSelectedPreset(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Preset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Presets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{counts.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{counts.inactive}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dryer Presets</CardTitle>
          <CardDescription>
            Configure and manage operation presets for different crops and regions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading presets...
            </div>
          ) : presets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No presets found. Create your first preset to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preset ID</TableHead>
                    <TableHead>Crop Type</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Target Temp</TableHead>
                    <TableHead>Target Humidity</TableHead>
                    <TableHead>Fan Speed</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presets.map((preset) => (
                    <TableRow key={preset.id}>
                      <TableCell className="font-medium">{preset.preset_id}</TableCell>
                      <TableCell>{preset.crop_type}</TableCell>
                      <TableCell>{preset.region}</TableCell>
                      <TableCell>{preset.target_temp_c}°C</TableCell>
                      <TableCell>{preset.target_humidity_pct}%</TableCell>
                      <TableCell>{preset.fan_speed_rpm} RPM</TableCell>
                      <TableCell>{preset.duration_hours}h</TableCell>
                      <TableCell>
                        <Badge variant={preset.is_active ? 'default' : 'secondary'}>
                          {preset.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => { setSelectedPreset(preset); setFormOpen(true); }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => { setSelectedPreset(preset); setDeleteOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PresetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        preset={selectedPreset}
        onSuccess={fetchPresets}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Preset"
        description="Are you sure you want to delete this preset? This action cannot be undone."
        itemName={selectedPreset ? `${selectedPreset.crop_type} - ${selectedPreset.region}` : ''}
        onConfirm={async () => {
          if (!selectedPreset) return;
          
          const response = await fetch(`/api/presets/${selectedPreset.id}`, {
            method: 'DELETE',
          });
          
          const result = await response.json();
          
          if (!response.ok) {
            throw new Error(result.error || 'Failed to delete preset');
          }
          
          toast({
            title: 'Success',
            description: 'Preset deleted successfully',
          });
          
          fetchPresets();
        }}
      />
    </div>
  );
}
