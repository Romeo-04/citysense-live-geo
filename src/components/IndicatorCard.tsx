import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface IndicatorCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

const IndicatorCard = ({ title, value, description, icon: Icon, trend }: IndicatorCardProps) => {
  const trendColors = {
    up: "text-red-400",
    down: "text-green-400",
    neutral: "text-muted-foreground",
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-card to-card/80 backdrop-blur border-border/50 hover:border-primary/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trendColors[trend]}`}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          </span>
        )}
      </div>
      <h4 className="text-sm font-medium text-muted-foreground mb-1">{title}</h4>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Card>
  );
};

export default IndicatorCard;
