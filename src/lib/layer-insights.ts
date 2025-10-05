import { LAYER_CATALOG } from "./layer-catalog";

type InsightFeature = {
  name: string;
  value: number;
  unit?: string;
  narrative?: string;
  source?: string;
  sourceDate?: string;
  geometryType: string;
  coordinates: number[] | number[][] | number[][][];
};

export interface LayerInsight {
  layerId: string;
  layerName: string;
  summary: string;
  headline: string;
  topFeature?: InsightFeature;
  features: InsightFeature[];
  source?: string;
  sourceDate?: string;
  generatedBy?: string;
}

const CITY_SLUG: Record<string, string> = {
  "Metro Manila": "metro-manila",
};

const LAYER_FILE_MAP: Record<string, string> = {
  aod: "aod",
  no2: "no2",
  lst: "lst",
  ndvi: "ndvi",
  ghsl_built: "ghsl_built",
  nightlights: "nightlights",
  worldpop_population: "worldpop_population",
  sedac_flood: "sedac_flood",
  precipitation: "precipitation",
};

interface GeoJSONFeature {
  type: "Feature";
  properties: {
    name?: string;
    value?: number;
    unit?: string;
    narrative?: string;
    source?: string;
    sourceDate?: string;
    [key: string]: unknown;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface GeoJSONCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

async function loadGeoJSON(path: string): Promise<GeoJSONCollection | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    return (await response.json()) as GeoJSONCollection;
  } catch (error) {
    console.error(`Failed to load insight geojson ${path}`, error);
    return null;
  }
}

function buildSummary(layerId: string, features: InsightFeature[]): LayerInsight {
  const config = LAYER_CATALOG[layerId];
  const layerName = config?.name ?? layerId;
  if (!features.length) {
    return {
      layerId,
      layerName,
      summary: `No insight features available for ${layerName} right now.`,
      headline: `No data for ${layerName}`,
      features,
    };
  }

  const sorted = [...features].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const top = sorted[0];
  const magnitude = top.value?.toFixed(top.value >= 10 ? 0 : 2);
  const unit = top.unit ? ` ${top.unit}` : "";
  const areaName = top.name ?? "Top hotspot";
  const effect = top.narrative ?? `${areaName} currently leads this indicator.`;

  const headline = `${areaName}: ${magnitude}${unit}`;
  const summary = `${effect} The highest value within the city is ${magnitude}${unit} at ${areaName}. ${sorted.length > 1 ? "Other notable spots: " + sorted.slice(1, 3).map(f => f.name).filter(Boolean).join(", ") + "." : ""}`.trim();

  return {
    layerId,
    layerName,
    summary,
    headline,
    topFeature: top,
    features: sorted,
    source: top.source,
    sourceDate: top.sourceDate,
  };
}

export async function fetchLayerInsight(layerId: string, city: string, date?: string): Promise<LayerInsight> {
  const citySlug = CITY_SLUG[city] ?? CITY_SLUG["Metro Manila"];
  const fileKey = LAYER_FILE_MAP[layerId];
  if (!fileKey) {
    return {
      layerId,
      layerName: LAYER_CATALOG[layerId]?.name ?? layerId,
      summary: "No insight mapping configured for this layer yet.",
      headline: "Insight unavailable",
      features: [],
    };
  }

  // Try a date-specific file first (formatted as YYYY-MM-DD), fall back to -latest
  let collection = null;
  if (date) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const iso = d.toISOString().split('T')[0];
      const datedPath = `/demo/gee/${citySlug}-${fileKey}-${iso}.geojson`;
      collection = await loadGeoJSON(datedPath);
    }
  }

  if (!collection) {
    const geojsonPath = `/demo/gee/${citySlug}-${fileKey}-latest.geojson`;
    collection = await loadGeoJSON(geojsonPath);
  }

  if (!collection || !collection.features?.length) {
    return {
      layerId,
      layerName: LAYER_CATALOG[layerId]?.name ?? layerId,
      summary: `No feature summaries available for ${city}.`,
      headline: `No data for ${city}`,
      features: [],
    };
  }

  const mapped = collection.features.map((feature) => {
      const value = typeof feature.properties?.value === "number" ? feature.properties.value : undefined;
      if (typeof value !== "number") {
        return null;
      }

      return {
        name: typeof feature.properties?.name === "string" ? feature.properties.name : undefined,
        value,
        unit: typeof feature.properties?.unit === "string" ? feature.properties.unit : undefined,
        narrative: typeof feature.properties?.narrative === "string" ? feature.properties.narrative : undefined,
        source: typeof feature.properties?.source === "string" ? feature.properties.source : undefined,
        sourceDate: typeof feature.properties?.sourceDate === "string" ? feature.properties.sourceDate : undefined,
        geometryType: feature.geometry?.type ?? "Unknown",
        coordinates: feature.geometry?.coordinates,
      };
    });

  const features: InsightFeature[] = mapped.filter((f): f is InsightFeature => f !== null);

  const insight = buildSummary(layerId, features);
  // Mark the insight as generated by the AI model
  insight.generatedBy = 'deepseek-r1';
  return insight;
}
