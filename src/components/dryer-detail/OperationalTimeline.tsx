import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Flame, Fan, Clock } from "lucide-react";

interface OperationalTimelineProps {
  data: Array<{
    timestamp: string;
    heater_status: boolean | null;
    fan_status: boolean | null;
    active_preset_id: string | null;
  }>;
}

const OperationalTimeline = ({ data }: OperationalTimelineProps) => {
  // Group consecutive readings with same status
  const timelineEvents = data.reduce((acc, reading, index) => {
    const prevReading = data[index - 1];
    
    // Heater status change
    if (!prevReading || prevReading.heater_status !== reading.heater_status) {
      acc.push({
        timestamp: reading.timestamp,
        type: "heater",
        status: reading.heater_status,
      });
    }
    
    // Fan status change
    if (!prevReading || prevReading.fan_status !== reading.fan_status) {
      acc.push({
        timestamp: reading.timestamp,
        type: "fan",
        status: reading.fan_status,
      });
    }
    
    return acc;
  }, [] as Array<{ timestamp: string; type: string; status: boolean | null }>);

  // Sort by timestamp descending (most recent first)
  const sortedEvents = timelineEvents.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Operational Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No operational events recorded
            </p>
          ) : (
            <div className="relative space-y-4">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
              
              {sortedEvents.slice(0, 20).map((event, index) => (
                <div key={index} className="relative flex items-start gap-4 pl-8">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-0 mt-1 h-8 w-8 rounded-full flex items-center justify-center ${
                      event.type === "heater"
                        ? "bg-chart-3/10"
                        : "bg-chart-4/10"
                    }`}
                  >
                    {event.type === "heater" ? (
                      <Flame
                        className={`h-4 w-4 ${
                          event.status ? "text-chart-3" : "text-muted-foreground"
                        }`}
                      />
                    ) : (
                      <Fan
                        className={`h-4 w-4 ${
                          event.status ? "text-chart-4" : "text-muted-foreground"
                        }`}
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {event.type === "heater" ? "Heater" : "Fan"}{" "}
                        {event.status ? "turned ON" : "turned OFF"}
                      </p>
                      <Badge
                        variant="secondary"
                        className={
                          event.status
                            ? "bg-status-active text-status-active-foreground"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {event.status ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.timestamp), "PPp")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OperationalTimeline;
