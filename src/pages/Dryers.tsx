'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  MapPin,
  Battery,
  Signal,
} from "lucide-react";
import DryerStatusBadge from "@/components/dashboard/DryerStatusBadge";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type DryerStatus = "active" | "idle" | "offline" | "maintenance" | "decommissioned";

const Dryers = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [selectedDryers, setSelectedDryers] = useState<Set<string>>(new Set());

  // Fetch dryers with filters
  const { data: dryers, isLoading: loadingDryers } = useQuery({
    queryKey: ["dryers", statusFilter, regionFilter, searchQuery],
    queryFn: async () => {
      // Fetch dryers without joins to avoid FK relationship issues
      let query = supabase
        .from("dryers")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all" && (statusFilter === "active" || statusFilter === "idle" || statusFilter === "offline" || statusFilter === "maintenance" || statusFilter === "decommissioned")) {
        query = query.eq("status", statusFilter);
      }

      if (regionFilter !== "all") {
        query = query.eq("region_id", regionFilter);
      }

      const { data: dryersData, error } = await query;
      if (error) throw error;

      if (!dryersData || dryersData.length === 0) return [];

      // Get unique IDs for related data
      const ownerIds = [...new Set(dryersData.map(d => d.owner_id).filter(Boolean))];
      const regionIds = [...new Set(dryersData.map(d => d.region_id).filter(Boolean))];
      const presetIds = [...new Set(dryersData.map(d => d.current_preset_id).filter(Boolean))];

      // Fetch related data in parallel
      const [ownersResult, regionsResult, presetsResult] = await Promise.all([
        ownerIds.length > 0
          ? supabase.from("dryer_owners").select("*").in("id", ownerIds)
          : { data: [], error: null },
        regionIds.length > 0
          ? supabase.from("regions").select("*").in("id", regionIds)
          : { data: [], error: null },
        presetIds.length > 0
          ? supabase.from("presets").select("*").in("id", presetIds)
          : { data: [], error: null },
      ]);

      // Create lookup maps
      const ownersMap = new Map((ownersResult.data || []).map(o => [o.id, o]));
      const regionsMap = new Map((regionsResult.data || []).map(r => [r.id, r]));
      const presetsMap = new Map((presetsResult.data || []).map(p => [p.id, p]));

      // Combine data
      const enrichedDryers = dryersData.map(dryer => ({
        ...dryer,
        owner: dryer.owner_id ? ownersMap.get(dryer.owner_id) || null : null,
        region: dryer.region_id ? regionsMap.get(dryer.region_id) || null : null,
        current_preset: dryer.current_preset_id ? presetsMap.get(dryer.current_preset_id) || null : null,
      }));

      // Client-side search filtering
      if (searchQuery) {
        return enrichedDryers.filter(
          (dryer) =>
            dryer.dryer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dryer.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dryer.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      return enrichedDryers;
    },
  });

  // Fetch regions for filter
  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked && dryers) {
      setSelectedDryers(new Set(dryers.map((d) => d.id)));
    } else {
      setSelectedDryers(new Set());
    }
  };

  const handleSelectDryer = (dryerId: string, checked: boolean) => {
    const newSelected = new Set(selectedDryers);
    if (checked) {
      newSelected.add(dryerId);
    } else {
      newSelected.delete(dryerId);
    }
    setSelectedDryers(newSelected);
  };

  const handleBatchExport = () => {
    if (selectedDryers.size === 0) {
      toast.error("Please select dryers to export");
      return;
    }
    toast.success(`Exporting data for ${selectedDryers.size} dryers...`);
    // TODO: Implement export functionality
  };

  const handleBatchDelete = async () => {
    if (selectedDryers.size === 0) {
      toast.error("Please select dryers to delete");
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedDryers.size} dryers?`)) {
      return;
    }

    toast.info("Batch delete functionality coming soon");
    // TODO: Implement batch delete with proper permissions
  };

  const getBatteryColor = (level: number | null) => {
    if (!level) return "text-muted-foreground";
    if (level < 20) return "text-destructive";
    if (level < 50) return "text-warning";
    return "text-success";
  };

  const getSignalColor = (strength: number | null) => {
    if (!strength) return "text-muted-foreground";
    if (strength < 30) return "text-destructive";
    if (strength < 70) return "text-warning";
    return "text-success";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Dryers Management</h1>
              <p className="text-sm text-muted-foreground">
                View and manage all deployed dryers
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search dryers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="decommissioned">Decommissioned</SelectItem>
                </SelectContent>
              </Select>

              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions?.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setRegionFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Batch Actions */}
        {selectedDryers.size > 0 && (
          <Card className="mb-6 border-primary">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {selectedDryers.size} dryer(s) selected
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleBatchExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </Button>
                  <Button variant="destructive" onClick={handleBatchDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dryers Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                All Dryers ({dryers?.length || 0})
              </CardTitle>
              <Button onClick={() => router.push("/register-dryer")}>
                Register New Dryer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingDryers ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : dryers && dryers.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            dryers.length > 0 &&
                            selectedDryers.size === dryers.length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Dryer ID</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Battery</TableHead>
                      <TableHead>Signal</TableHead>
                      <TableHead>Last Comm</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dryers.map((dryer) => (
                      <TableRow
                        key={dryer.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button, input[type="checkbox"]')) {
                            return;
                          }
                          router.push(`/dashboard/dryer/${dryer.id}`);
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedDryers.has(dryer.id)}
                            onCheckedChange={(checked) =>
                              handleSelectDryer(dryer.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {dryer.dryer_id}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {dryer.serial_number}
                        </TableCell>
                        <TableCell>
                          <DryerStatusBadge status={dryer.status as DryerStatus} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {dryer.region?.name || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>{dryer.owner?.name || "Unassigned"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Battery
                              className={`h-4 w-4 ${getBatteryColor(
                                dryer.battery_level
                              )}`}
                            />
                            <span className="text-sm">
                              {dryer.battery_level || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Signal
                              className={`h-4 w-4 ${getSignalColor(
                                dryer.signal_strength
                              )}`}
                            />
                            <span className="text-sm">
                              {dryer.signal_strength || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {dryer.last_communication
                            ? formatDistanceToNow(
                                new Date(dryer.last_communication),
                                { addSuffix: true }
                              )
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/register-dryer?edit=${dryer.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No dryers found matching your filters
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setRegionFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dryers;
