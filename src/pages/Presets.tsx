'use client'

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

interface PresetFormData {
  preset_id: string;
  crop_type: string;
  region: string;
  target_temp_c: number;
  target_humidity_pct: number;
  fan_speed_rpm: number;
  duration_hours: number;
  min_temp_threshold: number | null;
  max_temp_threshold: number | null;
  description: string | null;
  is_active: boolean;
}

const Presets = () => {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: presets, isLoading } = useQuery({
    queryKey: ["presets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createPreset = useMutation({
    mutationFn: async (data: PresetFormData) => {
      const { error } = await supabase.from("presets").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
      toast.success("Preset created successfully");
      setIsDialogOpen(false);
      setEditingPreset(null);
    },
    onError: () => {
      toast.error("Failed to create preset");
    },
  });

  const updatePreset = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PresetFormData> }) => {
      const { error } = await supabase.from("presets").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
      toast.success("Preset updated successfully");
      setIsDialogOpen(false);
      setEditingPreset(null);
    },
    onError: () => {
      toast.error("Failed to update preset");
    },
  });

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("presets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
      toast.success("Preset deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete preset");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: PresetFormData = {
      preset_id: formData.get("preset_id") as string,
      crop_type: formData.get("crop_type") as string,
      region: formData.get("region") as string,
      target_temp_c: Number(formData.get("target_temp_c")),
      target_humidity_pct: Number(formData.get("target_humidity_pct")),
      fan_speed_rpm: Number(formData.get("fan_speed_rpm")),
      duration_hours: Number(formData.get("duration_hours")),
      min_temp_threshold: formData.get("min_temp_threshold") ? Number(formData.get("min_temp_threshold")) : null,
      max_temp_threshold: formData.get("max_temp_threshold") ? Number(formData.get("max_temp_threshold")) : null,
      description: formData.get("description") as string || null,
      is_active: formData.get("is_active") === "on",
    };

    if (editingPreset) {
      updatePreset.mutate({ id: editingPreset.id, data });
    } else {
      createPreset.mutate(data);
    }
  };

  const filteredPresets = presets?.filter((preset) => {
    const matchesSearch = preset.crop_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preset.preset_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = !filterRegion || preset.region === filterRegion;
    return matchesSearch && matchesRegion;
  });

  const regions = [...new Set(presets?.map((p) => p.region) || [])];

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need administrator privileges to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Preset Management</h1>
          <p className="text-muted-foreground">Create and manage drying presets for different crops and regions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setEditingPreset(null)}>
              <Plus className="h-4 w-4" />
              New Preset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPreset ? "Edit Preset" : "Create New Preset"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preset_id">Preset ID</Label>
                  <Input id="preset_id" name="preset_id" required defaultValue={editingPreset?.preset_id} />
                </div>
                <div>
                  <Label htmlFor="crop_type">Crop Type</Label>
                  <Input id="crop_type" name="crop_type" required defaultValue={editingPreset?.crop_type} />
                </div>
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input id="region" name="region" required defaultValue={editingPreset?.region} />
                </div>
                <div>
                  <Label htmlFor="target_temp_c">Target Temperature (°C)</Label>
                  <Input id="target_temp_c" name="target_temp_c" type="number" required defaultValue={editingPreset?.target_temp_c} />
                </div>
                <div>
                  <Label htmlFor="target_humidity_pct">Target Humidity (%)</Label>
                  <Input id="target_humidity_pct" name="target_humidity_pct" type="number" required defaultValue={editingPreset?.target_humidity_pct} />
                </div>
                <div>
                  <Label htmlFor="fan_speed_rpm">Fan Speed (RPM)</Label>
                  <Input id="fan_speed_rpm" name="fan_speed_rpm" type="number" required defaultValue={editingPreset?.fan_speed_rpm} />
                </div>
                <div>
                  <Label htmlFor="duration_hours">Duration (hours)</Label>
                  <Input id="duration_hours" name="duration_hours" type="number" step="0.1" required defaultValue={editingPreset?.duration_hours} />
                </div>
                <div>
                  <Label htmlFor="min_temp_threshold">Min Temp Threshold (°C)</Label>
                  <Input id="min_temp_threshold" name="min_temp_threshold" type="number" defaultValue={editingPreset?.min_temp_threshold} />
                </div>
                <div>
                  <Label htmlFor="max_temp_threshold">Max Temp Threshold (°C)</Label>
                  <Input id="max_temp_threshold" name="max_temp_threshold" type="number" defaultValue={editingPreset?.max_temp_threshold} />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editingPreset?.description || ""} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="is_active" name="is_active" defaultChecked={editingPreset?.is_active ?? true} />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPreset ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <Input
              placeholder="Search by crop type or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <select
              className="px-3 py-2 border rounded-md bg-background"
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
            >
              <option value="">All Regions</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preset ID</TableHead>
                  <TableHead>Crop Type</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Target Temp</TableHead>
                  <TableHead>Humidity</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPresets?.map((preset) => (
                  <TableRow key={preset.id}>
                    <TableCell className="font-medium">{preset.preset_id}</TableCell>
                    <TableCell>{preset.crop_type}</TableCell>
                    <TableCell>{preset.region}</TableCell>
                    <TableCell>{preset.target_temp_c}°C</TableCell>
                    <TableCell>{preset.target_humidity_pct}%</TableCell>
                    <TableCell>{preset.duration_hours}h</TableCell>
                    <TableCell>
                      {preset.is_active ? (
                        <Badge className="bg-success/20 text-success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingPreset(preset);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this preset?")) {
                              deletePreset.mutate(preset.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Presets;
