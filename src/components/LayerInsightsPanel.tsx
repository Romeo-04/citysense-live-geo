import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayerInsight } from "@/lib/layer-insights";
import { Loader2 } from "lucide-react";

interface LayerInsightsPanelProps {
  insights: Record<string, LayerInsight>;
  loading?: boolean;
}

export function LayerInsightsPanel({ insights, loading = false }: LayerInsightsPanelProps) {
  const entries = Object.values(insights);

  if (!loading && entries.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 z-40 w-[320px] max-h-[70vh]">
      <Card className="bg-card/90 backdrop-blur border-border/60 shadow-lg">
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">AI Insight Summary</h3>
            <p className="text-xs text-muted-foreground">Highlights update as you toggle layers</p>
          </div>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <ScrollArea className="h-[50vh]">
          <div className="p-4 space-y-4">
            {entries.map((entry) => (
              <div key={entry.layerId} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold leading-tight">{entry.layerName}</p>
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                    {entry.headline}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{entry.summary}</p>
                {entry.topFeature && (
                  <div className="rounded-md bg-muted/40 border border-border/30 p-2">
                    <p className="text-xs font-medium">Hotspot: {entry.topFeature.name ?? "Unnamed"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {entry.topFeature.narrative ?? "High concentration detected."}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Peak value: {entry.topFeature.value.toFixed(entry.topFeature.value >= 10 ? 0 : 2)}
                      {entry.topFeature.unit ? ` ${entry.topFeature.unit}` : ""}
                    </p>
                    {entry.source && (
                      <p className="text-[10px] text-muted-foreground/80 mt-1">
                        Source: {entry.source}
                        {entry.sourceDate ? ` (${entry.sourceDate})` : ""}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
