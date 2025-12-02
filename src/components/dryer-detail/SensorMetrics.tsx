import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Droplets, Fan, Zap, Battery, Sun } from "lucide-react";

interface SensorMetricsProps {
  latestReading: {
    chamber_temp: number | null;
    ambient_temp: number | null;
    internal_humidity: number | null;
    external_humidity: number | null;
    fan_speed_rpm: number | null;
    fan_status: boolean | null;
    heater_status: boolean | null;
    heater_temp: number | null;
    battery_level: number | null;
    battery_voltage: number | null;
    solar_voltage: number | null;
    charging_status: string | null;
  } | null;
}

const SensorMetrics = ({ latestReading }: SensorMetricsProps) => {
  const metrics = [
    {
      title: "Chamber Temperature",
      value: latestReading?.chamber_temp ?? "--",
      unit: "°C",
      icon: Thermometer,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Internal Humidity",
      value: latestReading?.internal_humidity ?? "--",
      unit: "%",
      icon: Droplets,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Heater Temperature",
      value: latestReading?.heater_temp ?? "--",
      unit: "°C",
      icon: Zap,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Fan Speed",
      value: latestReading?.fan_speed_rpm ?? "--",
      unit: "RPM",
      icon: Fan,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof metric.value === "number"
                  ? metric.value.toFixed(1)
                  : metric.value}
                <span className="text-lg text-muted-foreground ml-1">
                  {metric.unit}
                </span>
              </div>
              {metric.title === "Fan Speed" && latestReading?.fan_status !== null && (
                <Badge
                  variant="secondary"
                  className={
                    latestReading.fan_status
                      ? "bg-status-active text-status-active-foreground mt-2"
                      : "bg-muted text-muted-foreground mt-2"
                  }
                >
                  {latestReading.fan_status ? "Running" : "Off"}
                </Badge>
              )}
              {metric.title === "Heater Temperature" && latestReading?.heater_status !== null && (
                <Badge
                  variant="secondary"
                  className={
                    latestReading.heater_status
                      ? "bg-status-active text-status-active-foreground mt-2"
                      : "bg-muted text-muted-foreground mt-2"
                  }
                >
                  {latestReading.heater_status ? "Active" : "Off"}
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SensorMetrics;
