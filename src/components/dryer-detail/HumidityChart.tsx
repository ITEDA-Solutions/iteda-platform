import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface HumidityChartProps {
  data: Array<{
    timestamp: string;
    internal_humidity: number | null;
    external_humidity: number | null;
  }>;
}

const HumidityChart = ({ data }: HumidityChartProps) => {
  const chartData = data.map((reading) => ({
    time: format(new Date(reading.timestamp), "HH:mm"),
    internal: reading.internal_humidity ?? 0,
    external: reading.external_humidity ?? 0,
  }));

  const chartConfig = {
    internal: {
      label: "Internal",
      color: "hsl(var(--chart-2))",
    },
    external: {
      label: "External",
      color: "hsl(var(--chart-4))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Humidity Trends</CardTitle>
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
                label={{ value: "Humidity (%)", angle: -90, position: "insideLeft" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="internal"
                stroke="var(--color-internal)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="external"
                stroke="var(--color-external)"
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

export default HumidityChart;
