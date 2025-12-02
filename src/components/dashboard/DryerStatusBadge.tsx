import { Badge } from "@/components/ui/badge";

type DryerStatus = "active" | "idle" | "offline" | "maintenance" | "decommissioned";

interface DryerStatusBadgeProps {
  status: DryerStatus;
}

const DryerStatusBadge = ({ status }: DryerStatusBadgeProps) => {
  const statusConfig = {
    active: {
      label: "Active",
      className: "bg-status-active text-status-active-foreground",
    },
    idle: {
      label: "Idle",
      className: "bg-status-idle text-foreground",
    },
    offline: {
      label: "Offline",
      className: "bg-status-offline text-status-offline-foreground",
    },
    maintenance: {
      label: "Maintenance",
      className: "bg-status-maintenance text-white",
    },
    decommissioned: {
      label: "Decommissioned",
      className: "bg-muted text-muted-foreground",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge className={config.className} variant="secondary">
      {config.label}
    </Badge>
  );
};

export default DryerStatusBadge;
