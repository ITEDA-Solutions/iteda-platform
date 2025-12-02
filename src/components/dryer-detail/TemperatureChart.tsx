import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface TemperatureChartProps {
  data: Array<{
    timestamp: string;
    chamber_temp: number | null;
    ambient_temp: number | null;
    heater_temp: number | null;
  }>;
}

const TemperatureChart = ({ data }: TemperatureChartProps) => {
  const chartData = data.map((reading) => ({
    time: format(new Date(reading.timestamp), "HH:mm"),
    chamber: reading.chamber_temp ?? 0,
    ambient: reading.ambient_temp ?? 0,
    heater: reading.heater_temp ?? 0,
  }));

  const chartConfig = {
    chamber: {
      label: "Chamber",
      color: "hsl(var(--chart-1))",
    },
    ambient: {
      label: "Ambient",
      color: "hsl(var(--chart-5))",
    },
    heater: {
      label: "Heater",
      color: "hsl(var(--chart-3))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Temperature Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="time"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                label={{ value: "Temperature (°C)", angle: -90, position: "insideLeft" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="chamber"
                stroke="var(--color-chamber)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ambient"
                stroke="var(--color-ambient)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="heater"
                stroke="var(--color-heater)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default TemperatureChart;
