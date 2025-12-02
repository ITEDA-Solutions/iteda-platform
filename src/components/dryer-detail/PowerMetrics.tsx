import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Battery, Sun, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PowerMetricsProps {
  batteryLevel: number | null;
  batteryVoltage: number | null;
  solarVoltage: number | null;
  chargingStatus: string | null;
}

const PowerMetrics = ({
  batteryLevel,
  batteryVoltage,
  solarVoltage,
  chargingStatus,
}: PowerMetricsProps) => {
  const getBatteryColor = (level: number | null) => {
    if (!level) return "bg-muted";
    if (level < 20) return "bg-destructive";
    if (level < 50) return "bg-warning";
    return "bg-success";
  };

  const getChargingBadge = (status: string | null) => {
    if (!status) return null;
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes("charging")) {
      return (
        <Badge className="bg-success text-success-foreground">
          Charging
        </Badge>
      );
    }
    if (statusLower.includes("discharging")) {
      return (
        <Badge className="bg-warning text-warning-foreground">
          Discharging
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        {status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Power Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Battery Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Battery Level</span>
            </div>
            <span className="text-2xl font-bold">
              {batteryLevel ?? "--"}
              <span className="text-sm text-muted-foreground ml-1">%</span>
            </span>
          </div>
          <Progress
            value={batteryLevel ?? 0}
            className="h-3"
            indicatorClassName={getBatteryColor(batteryLevel)}
          />
          {batteryVoltage !== null && (
            <p className="text-xs text-muted-foreground">
              Voltage: {batteryVoltage.toFixed(2)}V
            </p>
          )}
        </div>

        {/* Solar Panel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Solar Panel</span>
            </div>
            <span className="text-2xl font-bold">
              {solarVoltage?.toFixed(2) ?? "--"}
              <span className="text-sm text-muted-foreground ml-1">V</span>
            </span>
          </div>
        </div>

        {/* Charging Status */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm font-medium">Status</span>
          {getChargingBadge(chargingStatus)}
        </div>
      </CardContent>
    </Card>
  );
};

export default PowerMetrics;
