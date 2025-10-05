import L from "leaflet";
import type { Feature, FeatureCollection } from "geojson";
import type { MapLayerConfig } from "./layer-catalog";

export interface DemoContext {
  lat: number;
  lon: number;
}

interface RectangleDefinition {
  center: [number, number];
  width: number;
  height: number;
  properties: Record<string, any>;
}

interface PointDefinition {
  offset: [number, number];
  properties: Record<string, any>;
}

interface DemoBuilder {
  type: "polygon" | "point";
  popupTitle: string;
  rectangles?: RectangleDefinition[];
  points?: PointDefinition[];
  style?: (feature: Feature) => L.PathOptions;
  pointStyle?: (feature: Feature) => { radius: number; options: L.CircleMarkerOptions };
}

export interface DemoLayerConfig extends DemoBuilder {
  build: (context: DemoContext) => FeatureCollection;
}

const buildRectangle = (context: DemoContext, def: RectangleDefinition) => {
  const lonCenter = context.lon + def.center[0];
  const latCenter = context.lat + def.center[1];
  const halfWidth = def.width / 2;
  const halfHeight = def.height / 2;

  const coords: [number, number][] = [
    [lonCenter - halfWidth, latCenter - halfHeight],
    [lonCenter + halfWidth, latCenter - halfHeight],
    [lonCenter + halfWidth, latCenter + halfHeight],
    [lonCenter - halfWidth, latCenter + halfHeight],
    [lonCenter - halfWidth, latCenter - halfHeight],
  ];

  return {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [coords],
    },
    properties: def.properties,
  } satisfies Feature;
};

const buildPoint = (context: DemoContext, def: PointDefinition) => {
  const lon = context.lon + def.offset[0];
  const lat = context.lat + def.offset[1];
  return {
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      coordinates: [lon, lat],
    },
    properties: def.properties,
  } satisfies Feature;
};

const createRectangleCollection = (context: DemoContext, rectangles: RectangleDefinition[]): FeatureCollection => ({
  type: "FeatureCollection",
  features: rectangles.map((rect) => buildRectangle(context, rect)),
});

const createPointCollection = (context: DemoContext, points: PointDefinition[]): FeatureCollection => ({
  type: "FeatureCollection",
  features: points.map((point) => buildPoint(context, point)),
});

const heatStyle = (feature: Feature) => {
  const value = (feature.properties as any)?.value ?? 0;
  let fillColor = "#f97316";
  if (value >= 39) fillColor = "#b91c1c";
  else if (value >= 37) fillColor = "#ef4444";
  return {
    color: "#7f1d1d",
    weight: 1,
    fillColor,
    fillOpacity: 0.45,
    dashArray: "4 2",
  } satisfies L.PathOptions;
};

const vegetationStyle = (feature: Feature) => {
  const value = (feature.properties as any)?.value ?? 0;
  let fillColor = "#a3e635";
  if (value <= 0.2) fillColor = "#bbf7d0";
  if (value >= 0.5) fillColor = "#4ade80";
  if (value >= 0.7) fillColor = "#16a34a";
  return {
    color: "#166534",
    weight: 1,
    fillColor,
    fillOpacity: 0.4,
  } satisfies L.PathOptions;
};

const precipitationStyle = (feature: Feature) => {
  const value = (feature.properties as any)?.value ?? 0;
  let fillColor = "#38bdf8";
  if (value >= 120) fillColor = "#0ea5e9";
  if (value >= 160) fillColor = "#2563eb";
  return {
    color: "#0c4a6e",
    weight: 1,
    fillColor,
    fillOpacity: 0.35,
    dashArray: "2 4",
  } satisfies L.PathOptions;
};

const floodStyle = (_feature: Feature) => ({
  color: "#1d4ed8",
  weight: 1,
  fillColor: "#93c5fd",
  fillOpacity: 0.35,
  dashArray: "6 4",
} satisfies L.PathOptions);

const builtStyle = (feature: Feature) => {
  const value = (feature.properties as any)?.value ?? 0;
  let fillColor = "#cbd5f5";
  if (value >= 65) fillColor = "#818cf8";
  if (value >= 80) fillColor = "#6366f1";
  return {
    color: "#312e81",
    weight: 1,
    fillColor,
    fillOpacity: 0.4,
  } satisfies L.PathOptions;
};

const populationStyle = (feature: Feature) => {
  const value = (feature.properties as any)?.value ?? 0;
  let fillColor = "#fdba74";
  if (value >= 15000) fillColor = "#fb923c";
  if (value >= 25000) fillColor = "#f97316";
  if (value >= 35000) fillColor = "#ea580c";
  return {
    color: "#9a3412",
    weight: 1,
    fillColor,
    fillOpacity: 0.4,
  } satisfies L.PathOptions;
};

const circlePointStyle = (color: string, border: string) =>
  (feature: Feature) => {
    const value = (feature.properties as any)?.value ?? 0;
    const radius = Math.max(6, Math.min(18, value));
    return {
      radius,
      options: {
        color: border,
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.8,
      } satisfies L.CircleMarkerOptions,
    };
  };

const bindPopup = (layer: L.Layer, title: string, feature: Feature) => {
  const props = (feature.properties ?? {}) as Record<string, any>;
  const location = props.name ? `<strong>${props.name}</strong>` : "";
  const value =
    props.value !== undefined
      ? `<div class="mt-1 text-sm font-semibold">${props.value}${props.unit ? ` ${props.unit}` : ""}</div>`
      : "";
  const narrative = props.narrative
    ? `<p class="mt-1 text-xs leading-snug text-muted-foreground">${props.narrative}</p>`
    : "";
  const content = `
    <div class="space-y-1">
      <div class="text-xs uppercase tracking-wide text-primary/80">${title}</div>
      ${location}
      ${value}
      ${narrative}
    </div>
  `;
  if ((layer as L.Layer & { bindPopup?: (content: string) => void }).bindPopup) {
    (layer as L.Layer & { bindPopup: (content: string) => void }).bindPopup(content);
  }
};

const LST_RECTANGLES: RectangleDefinition[] = [
  {
    center: [0.05, 0.06],
    width: 0.07,
    height: 0.05,
    properties: {
      name: "Quezon City CBD",
      value: 39.2,
      unit: "°C",
      narrative: "Top 10% hottest compared to Metro Manila baseline.",
    },
  },
  {
    center: [0.0, -0.02],
    width: 0.06,
    height: 0.045,
    properties: {
      name: "Makati - Ortigas Corridor",
      value: 37.8,
      unit: "°C",
      narrative: "Elevated urban heat due to dense built-up fabric.",
    },
  },
  {
    center: [-0.06, 0.02],
    width: 0.06,
    height: 0.05,
    properties: {
      name: "Caloocan Industrial Belt",
      value: 36.9,
      unit: "°C",
      narrative: "Industrial surfaces retaining heat after sunset.",
    },
  },
];

const NDVI_RECTANGLES: RectangleDefinition[] = [
  {
    center: [0.02, 0.08],
    width: 0.06,
    height: 0.05,
    properties: {
      name: "La Mesa Watershed",
      value: 0.74,
      unit: "NDVI",
      narrative: "Dense urban forest canopy moderating local heat.",
    },
  },
  {
    center: [-0.04, -0.02],
    width: 0.05,
    height: 0.045,
    properties: {
      name: "Pasig River Corridor",
      value: 0.48,
      unit: "NDVI",
      narrative: "Moderate vegetation along riparian buffer.",
    },
  },
  {
    center: [0.06, -0.05],
    width: 0.05,
    height: 0.04,
    properties: {
      name: "Southern Taguig",
      value: 0.22,
      unit: "NDVI",
      narrative: "Rapid conversion reducing green cover.",
    },
  },
];

const PRECIP_RECTANGLES: RectangleDefinition[] = [
  {
    center: [0.04, 0.04],
    width: 0.07,
    height: 0.05,
    properties: {
      name: "Quezon City North",
      value: 182,
      unit: "mm",
      narrative: "Converging storms dumped 180+ mm in 24 hours.",
    },
  },
  {
    center: [-0.03, 0.01],
    width: 0.06,
    height: 0.045,
    properties: {
      name: "Manila Bay Coast",
      value: 95,
      unit: "mm",
      narrative: "Sea breeze convection with moderate showers.",
    },
  },
  {
    center: [0.07, -0.04],
    width: 0.05,
    height: 0.045,
    properties: {
      name: "Laguna Lake Fringe",
      value: 128,
      unit: "mm",
      narrative: "Strong southeasterly cell tracking across lakeshore.",
    },
  },
];

const FLOOD_RECTANGLES: RectangleDefinition[] = [
  {
    center: [-0.02, 0.03],
    width: 0.08,
    height: 0.05,
    properties: {
      name: "Tullahan River Floodplain",
      value: "High",
      narrative: "At least 1-in-5 year inundation based on SEDAC Hotspots.",
    },
  },
  {
    center: [0.06, -0.01],
    width: 0.07,
    height: 0.05,
    properties: {
      name: "Lower Pasig Basin",
      value: "Very High",
      narrative: "Frequent flooding requiring river dike and pump upkeep.",
    },
  },
];

const BUILT_RECTANGLES: RectangleDefinition[] = [
  {
    center: [0.02, -0.01],
    width: 0.07,
    height: 0.05,
    properties: {
      name: "Bonifacio Global City",
      value: 86,
      unit: "% built",
      narrative: "High-rise district exceeding 80% impervious cover.",
    },
  },
  {
    center: [-0.04, 0.03],
    width: 0.06,
    height: 0.045,
    properties: {
      name: "North Caloocan",
      value: 68,
      unit: "% built",
      narrative: "Compact settlements with limited open space.",
    },
  },
];

const POP_RECTANGLES: RectangleDefinition[] = [
  {
    center: [0.01, 0.02],
    width: 0.06,
    height: 0.045,
    properties: {
      name: "Quiapo & Sampaloc",
      value: 36800,
      unit: "people/km²",
      narrative: "Densest barangays with limited greenspace.",
    },
  },
  {
    center: [0.06, -0.04],
    width: 0.05,
    height: 0.045,
    properties: {
      name: "Taguig Lakeside",
      value: 25500,
      unit: "people/km²",
      narrative: "New townships balancing residential and commercial growth.",
    },
  },
];

const AOD_POINTS: PointDefinition[] = [
  {
    offset: [-0.03, 0.01],
    properties: {
      name: "Port of Manila",
      value: 12,
      unit: "×10⁻²",
      narrative: "Harbor activities adding particulate haze during rush hours.",
    },
  },
  {
    offset: [0.05, -0.02],
    properties: {
      name: "C5 Corridor",
      value: 9,
      unit: "×10⁻²",
      narrative: "Persistent aerosols from expressway traffic.",
    },
  },
  {
    offset: [0.02, 0.07],
    properties: {
      name: "Fairview Plateau",
      value: 6,
      unit: "×10⁻²",
      narrative: "Cleaner air from surrounding vegetation.",
    },
  },
];

const NO2_POINTS: PointDefinition[] = [
  {
    offset: [0.0, -0.01],
    properties: {
      name: "EDSA Ortigas",
      value: 17,
      unit: "µmol/m²",
      narrative: "Congested arterial with buses and jeepneys.",
    },
  },
  {
    offset: [-0.05, -0.03],
    properties: {
      name: "Coastal Road",
      value: 14,
      unit: "µmol/m²",
      narrative: "Truck-heavy route linking ports to southern suburbs.",
    },
  },
  {
    offset: [0.04, 0.05],
    properties: {
      name: "Commonwealth Avenue",
      value: 11,
      unit: "µmol/m²",
      narrative: "Wide corridor with peak-hour build-up.",
    },
  },
];

const NIGHT_POINTS: PointDefinition[] = [
  {
    offset: [0.01, -0.015],
    properties: {
      name: "Makati CBD",
      value: 18,
      unit: "nW/cm²/sr",
      narrative: "Late-night commercial activity keeps lights blazing.",
    },
  },
  {
    offset: [0.05, -0.005],
    properties: {
      name: "BGC Skyline",
      value: 21,
      unit: "nW/cm²/sr",
      narrative: "Mixed-use towers and entertainment strip.",
    },
  },
  {
    offset: [-0.045, 0.025],
    properties: {
      name: "Caloocan Industrial",
      value: 13,
      unit: "nW/cm²/sr",
      narrative: "Factories running swing shifts.",
    },
  },
];

export const DEMO_LAYER_CONFIGS: Record<string, DemoLayerConfig> = {
  lst: {
    type: "polygon",
    popupTitle: "Surface Temperature",
    style: heatStyle,
    rectangles: LST_RECTANGLES,
    build: (context) => createRectangleCollection(context, LST_RECTANGLES),
  },
  ndvi: {
    type: "polygon",
    popupTitle: "Vegetation Index",
    style: vegetationStyle,
    rectangles: NDVI_RECTANGLES,
    build: (context) => createRectangleCollection(context, NDVI_RECTANGLES),
  },
  precipitation: {
    type: "polygon",
    popupTitle: "IMERG 24h Rainfall",
    style: precipitationStyle,
    rectangles: PRECIP_RECTANGLES,
    build: (context) => createRectangleCollection(context, PRECIP_RECTANGLES),
  },
  sedac_flood: {
    type: "polygon",
    popupTitle: "Flood Hazard Frequency",
    style: floodStyle,
    rectangles: FLOOD_RECTANGLES,
    build: (context) => createRectangleCollection(context, FLOOD_RECTANGLES),
  },
  ghsl_built: {
    type: "polygon",
    popupTitle: "Built-up Density",
    style: builtStyle,
    rectangles: BUILT_RECTANGLES,
    build: (context) => createRectangleCollection(context, BUILT_RECTANGLES),
  },
  worldpop_population: {
    type: "polygon",
    popupTitle: "Population Density",
    style: populationStyle,
    rectangles: POP_RECTANGLES,
    build: (context) => createRectangleCollection(context, POP_RECTANGLES),
  },
  aod: {
    type: "point",
    popupTitle: "Aerosol Optical Depth",
    points: AOD_POINTS,
    pointStyle: circlePointStyle("#fde68a", "#facc15"),
    build: (context) => createPointCollection(context, AOD_POINTS),
  },
  no2: {
    type: "point",
    popupTitle: "NO₂ Column Density",
    points: NO2_POINTS,
    pointStyle: circlePointStyle("#fca5a5", "#ef4444"),
    build: (context) => createPointCollection(context, NO2_POINTS),
  },
  nightlights: {
    type: "point",
    popupTitle: "Night Lights Intensity",
    points: NIGHT_POINTS,
    pointStyle: circlePointStyle("#fef08a", "#facc15"),
    build: (context) => createPointCollection(context, NIGHT_POINTS),
  },
};

export const buildDemoGeoJSON = (
  layerKey: string,
  context: DemoContext,
): FeatureCollection | null => {
  const config = DEMO_LAYER_CONFIGS[layerKey];
  if (!config) return null;
  return config.build(context);
};

export const addDemoFeatureInteractions = (
  layer: L.GeoJSON,
  layerConfig: MapLayerConfig,
  demoConfig: DemoLayerConfig,
) => {
  layer.eachLayer((child) => {
    const feature = (child as any).feature as Feature | undefined;
    if (!feature) return;
    bindPopup(child, demoConfig.popupTitle ?? layerConfig.name, feature);
  });
};

export const applyDemoPointStyle = (
  feature: Feature,
  latlng: L.LatLng,
  config: DemoLayerConfig,
): L.Layer => {
  const point = config.pointStyle?.(feature);
  if (point) {
    return L.circleMarker(latlng, point.options).setRadius(point.radius);
  }
  return L.circleMarker(latlng, {
    radius: 10,
    color: "#334155",
    weight: 1,
    fillColor: "#94a3b8",
    fillOpacity: 0.7,
  });
};
