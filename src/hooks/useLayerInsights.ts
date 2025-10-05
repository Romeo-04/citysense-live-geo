import { useEffect, useState } from "react";
import { fetchLayerInsight, LayerInsight } from "@/lib/layer-insights";

interface UseLayerInsightsOptions {
  city: string;
  activeLayers: string[];
  date?: string;
}

interface LayerInsightsState {
  loading: boolean;
  insights: Record<string, LayerInsight>;
}

export function useLayerInsights({ city, activeLayers, date }: UseLayerInsightsOptions): LayerInsightsState {
  const [insights, setInsights] = useState<Record<string, LayerInsight>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadInsights() {
      if (!activeLayers.length) {
        setInsights({});
        return;
      }

      setLoading(true);
      const results = await Promise.all(
        activeLayers.map(async (layerId) => {
          const insight = await fetchLayerInsight(layerId, city, date);
          return [layerId, insight] as const;
        })
      );

      if (cancelled) return;

      setInsights(Object.fromEntries(results));
      setLoading(false);
    }

    loadInsights();

    return () => {
      cancelled = true;
    };
  }, [city, date, activeLayers.join("|")]);

  return { loading, insights };
}
