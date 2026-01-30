'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Download, Loader2 } from "lucide-react";

interface DataExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dryerId?: string;
}

export function DataExportDialog({ open, onOpenChange, dryerId }: DataExportDialogProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'sensor_data' | 'alerts'>('sensor_data');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDryerId, setSelectedDryerId] = useState(dryerId || '');

  const handleExport = async () => {
    if (!selectedDryerId && exportType === 'sensor_data') {
      toast({
        title: "Dryer ID required",
        description: "Please enter a dryer ID",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      let url = '';
      const params = new URLSearchParams();

      if (exportType === 'sensor_data') {
        url = '/api/export/sensor-data';
        params.append('dryer_id', selectedDryerId);
        params.append('format', 'csv');
      } else {
        url = '/api/export/alerts';
        if (selectedDryerId) {
          params.append('dryer_id', selectedDryerId);
        }
      }

      if (startDate) {
        params.append('start_date', new Date(startDate).toISOString());
      }
      if (endDate) {
        params.append('end_date', new Date(endDate).toISOString());
      }

      const response = await fetch(`${url}?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download the file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `export-${exportType}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: "Your data has been exported",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Export sensor data or alerts to CSV format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="export_type">Export Type</Label>
            <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sensor_data">Sensor Data</SelectItem>
                <SelectItem value="alerts">Alerts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dryer_id">
              Dryer ID {exportType === 'sensor_data' && '*'}
            </Label>
            <Input
              id="dryer_id"
              value={selectedDryerId}
              onChange={(e) => setSelectedDryerId(e.target.value)}
              placeholder="DRY-001"
              disabled={!!dryerId}
            />
            {exportType === 'alerts' && (
              <p className="text-xs text-muted-foreground">
                Leave empty to export all alerts
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
