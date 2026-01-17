'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CalendarIcon, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const formSchema = z.object({
  serialNumber: z.string().min(1, "Serial number is required"),
  deploymentDate: z.date({
    required_error: "Deployment date is required",
  }),
  locationLatitude: z.string().optional(),
  locationLongitude: z.string().optional(),
  locationAddress: z.string().min(1, "Location address is required"),
  regionId: z.string().min(1, "Region is required"),
  farmerId: z.string().optional(),
  numTempSensors: z.number().min(1).max(10),
  numHumiditySensors: z.number().min(1).max(10),
  numFans: z.number().min(1).max(5),
  numHeaters: z.number().min(1).max(5),
  solarCapacityW: z.number().min(0),
  batteryCapacityAh: z.number().min(0),
  currentPresetId: z.string().optional(),
});

const RegisterDryer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [showFarmerDialog, setShowFarmerDialog] = useState(false);
  const [newFarmer, setNewFarmer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    farmName: "",
    idNumber: "",
  });
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numTempSensors: 3,
      numHumiditySensors: 2,
      numFans: 1,
      numHeaters: 1,
      solarCapacityW: 300,
      batteryCapacityAh: 100,
    },
  });

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const [regionsRes, ownersRes, presetsRes] = await Promise.all([
        supabase.from("regions").select("*").order("name").execute(),
        supabase.from("farmers").select("*").order("name").execute(),
        supabase.from("presets").select("*").eq("is_active", true).order("preset_id").execute(),
      ]);

      if (regionsRes.error) throw regionsRes.error;
      if (ownersRes.error) throw ownersRes.error;
      if (presetsRes.error) throw presetsRes.error;

      setRegions(regionsRes.data || []);
      setFarmers(ownersRes.data || []);
      setPresets(presetsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error loading form data",
        description: (error as any).message,
        variant: "destructive",
      });
    }
  };

  const generateDryerId = async () => {
    const year = new Date().getFullYear();
    const { data, error } = await supabase
      .from("dryers")
      .select("dryer_id")
      .like("dryer_id", `DRY-${year}-%`)
      .order("dryer_id", { ascending: false })
      .limit(1)
      .execute();

    if (error) {
      console.error("Error generating dryer ID:", error);
      return `DRY-${year}-001`;
    }

    if (!data || data.length === 0) {
      return `DRY-${year}-001`;
    }

    const lastId = data[0].dryer_id;
    const lastNumber = parseInt(lastId.split("-")[2]);
    const newNumber = (lastNumber + 1).toString().padStart(3, "0");
    return `DRY-${year}-${newNumber}`;
  };

  const handleCreateFarmer = async () => {
    if (!newFarmer.name) {
      toast({
        title: "Error",
        description: "Farmer name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("farmers")
        .insert({
          name: newFarmer.name,
          phone: newFarmer.phone || null,
          email: newFarmer.email || null,
          address: newFarmer.address || null,
          farm_business_name: newFarmer.farmName || null,
          id_number: newFarmer.idNumber || null,
        })
        .select()
        .single()
        .execute();

      if (error) throw error;

      setFarmers([...farmers, data]);
      form.setValue("farmerId", data.id);
      setShowFarmerDialog(false);
      setNewFarmer({ name: "", phone: "", email: "", address: "", farmName: "", idNumber: "" });
      toast({
        title: "Farmer created",
        description: "New dryer farmer has been added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error creating farmer",
        description: (error as any).message,
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      const dryerId = await generateDryerId();

      const { error } = await supabase.from("dryers").insert({
        dryer_id: dryerId,
        serial_number: values.serialNumber,
        deployment_date: values.deploymentDate.toISOString(),
        location_latitude: values.locationLatitude ? parseFloat(values.locationLatitude) : null,
        location_longitude: values.locationLongitude ? parseFloat(values.locationLongitude) : null,
        location_address: values.locationAddress,
        region_id: values.regionId,
        farmer_id: values.farmerId || null,
        num_temp_sensors: values.numTempSensors,
        num_humidity_sensors: values.numHumiditySensors,
        num_fans: values.numFans,
        num_heaters: values.numHeaters,
        solar_capacity_w: values.solarCapacityW,
        battery_capacity_ah: values.batteryCapacityAh,
        current_preset_id: values.currentPresetId || null,
        status: "idle",
      }).execute();

      if (error) throw error;

      toast({
        title: "Dryer registered successfully",
        description: `Dryer ID: ${dryerId}`,
      });

      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error registering dryer",
        description: (error as any).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Register New Dryer</h1>
          <p className="text-sm text-muted-foreground">
            Add a new dryer to the monitoring system
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Serial number and deployment details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="SN-20240001" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique hardware serial number from the device
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deploymentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Deployment Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="regionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regions.map((region) => (
                            <SelectItem key={region.id} value={region.id}>
                              {region.name} ({region.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Location Information</CardTitle>
                <CardDescription>Physical installation location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="locationAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical Address *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter full address"
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="locationLatitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., -1.286389" {...field} />
                        </FormControl>
                        <FormDescription>Decimal degrees</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="locationLongitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 36.817223" {...field} />
                        </FormControl>
                        <FormDescription>Decimal degrees</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hardware Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Hardware Configuration</CardTitle>
                <CardDescription>Sensor and component specifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="numTempSensors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperature Sensors</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numHumiditySensors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Humidity Sensors</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numFans"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Fans</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numHeaters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Heaters</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="solarCapacityW"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Solar Capacity (W)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="batteryCapacityAh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Battery Capacity (Ah)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Farmer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Farmer Information</CardTitle>
                <CardDescription>Dryer farmer details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="farmerId"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Farmer (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select farmer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {farmers.map((farmer) => (
                              <SelectItem key={farmer.id} value={farmer.id}>
                                {farmer.name} {farmer.farm_business_name ? `(${farmer.farm_business_name})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Dialog open={showFarmerDialog} onOpenChange={setShowFarmerDialog}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" className="mt-8">
                        <Plus className="h-4 w-4 mr-2" />
                        New Farmer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Farmer</DialogTitle>
                        <DialogDescription>
                          Create a new dryer farmer profile
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Name *</Label>
                          <Input
                            value={newFarmer.name}
                            onChange={(e) => setNewFarmer({ ...newFarmer, name: e.target.value })}
                            placeholder="Farmer name"
                          />
                        </div>
                        <div>
                          <Label>Farm/Business Name</Label>
                          <Input
                            value={newFarmer.farmName}
                            onChange={(e) => setNewFarmer({ ...newFarmer, farmName: e.target.value })}
                            placeholder="Farm or business name"
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={newFarmer.phone}
                            onChange={(e) => setNewFarmer({ ...newFarmer, phone: e.target.value })}
                            placeholder="+254..."
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={newFarmer.email}
                            onChange={(e) => setNewFarmer({ ...newFarmer, email: e.target.value })}
                            placeholder="farmer@example.com"
                          />
                        </div>
                        <div>
                          <Label>Address</Label>
                          <Textarea
                            value={newFarmer.address}
                            onChange={(e) => setNewFarmer({ ...newFarmer, address: e.target.value })}
                            placeholder="Physical address"
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>ID Number</Label>
                          <Input
                            value={newFarmer.idNumber}
                            onChange={(e) => setNewFarmer({ ...newFarmer, idNumber: e.target.value })}
                            placeholder="ID or registration number"
                          />
                        </div>
                        <Button onClick={handleCreateFarmer} className="w-full">
                          Create Farmer
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Initial Preset */}
            <Card>
              <CardHeader>
                <CardTitle>Initial Configuration</CardTitle>
                <CardDescription>Select starting preset (optional)</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="currentPresetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Preset (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select preset" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {presets.map((preset) => (
                            <SelectItem key={preset.id} value={preset.id}>
                              {preset.preset_id} - {preset.crop_type} ({preset.region})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Preset can be changed later from the dryer details
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register Dryer
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};

export default RegisterDryer;
