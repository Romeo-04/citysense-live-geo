// NASA GIBS API utilities
// Authentication: GIBS WMTS/WMS services are publicly accessible (no token required)
// For protected NASA services (SEDAC, etc.), see sedac-api.ts

export type GIBSProjection = 'EPSG:3857' | 'EPSG:4326';

export interface GIBSLayerConfig {
  /** Product identifier exposed by the GIBS catalogue */
  product: string;
  /** Map projection supported by the layer */
  projection: GIBSProjection;
  /** Tile matrix set advertised by GIBS for Google Maps compatible slippy maps */
  tileMatrixSet: string;
  /** Native raster format */
  format: 'png' | 'jpg';
  /** Recommended minimum zoom for display */
  minZoom: number;
  /** Recommended maximum zoom for display */
  maxZoom: number;
  /** Maximum native zoom advertised by GIBS */
  maxNativeZoom: number;
  /** Human friendly description */
  description: string;
  /** Temporal cadence (daily, 8-day, hourly, etc.) */
  cadence: 'hourly' | 'daily' | '8-day' | 'monthly';
}

const GIBS_BASE_BY_PROJECTION: Record<GIBSProjection, string> = {
  'EPSG:3857': 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best',
  'EPSG:4326': 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best'
};

export const GIBS_LAYERS: Record<string, GIBSLayerConfig> = {
  lst: {
    product: 'MODIS_Terra_Land_Surface_Temp_Day',
    projection: 'EPSG:3857',
    tileMatrixSet: 'GoogleMapsCompatible_Level7',
    format: 'png',
    minZoom: 2,
    maxZoom: 12,
    maxNativeZoom: 7,
    description: 'MODIS Terra Land Surface Temperature (Daytime)',
    cadence: 'daily'
  },
  ndvi: {
    product: 'MODIS_Terra_NDVI_8Day',
    projection: 'EPSG:3857',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'png',
    minZoom: 2,
    maxZoom: 12,
    maxNativeZoom: 9,
    description: 'MODIS Terra NDVI (8-day composite)',
    cadence: '8-day'
  },
  precipitation: {
    product: 'IMERG_Precipitation_Rate_30min',
    projection: 'EPSG:3857',
    tileMatrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    minZoom: 1,
    maxZoom: 9,
    maxNativeZoom: 6,
    description: 'GPM IMERG Precipitation Rate (30-minute average)',
    cadence: 'hourly'
  },
  aod: {
    product: 'MODIS_Combined_Value_Added_AOD',
    projection: 'EPSG:3857',
    tileMatrixSet: 'GoogleMapsCompatible_Level8',
    format: 'png',
    minZoom: 1,
    maxZoom: 11,
    maxNativeZoom: 8,
    description: 'MAIAC Aerosol Optical Depth (1 km)',
    cadence: 'daily'
  },
  no2: {
    product: 'OMI_Nitrogen_Dioxide_Tropo_Column',
    projection: 'EPSG:3857',
    tileMatrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    minZoom: 1,
    maxZoom: 9,
    maxNativeZoom: 6,
    description: 'OMI Tropospheric Nitrogen Dioxide Column (daily)',
    cadence: 'daily'
  },
  nightlights: {
    product: 'VIIRS_SNPP_DayNightBand_ENCC',
    projection: 'EPSG:3857',
    tileMatrixSet: 'GoogleMapsCompatible_Level8',
    format: 'png',
    minZoom: 1,
    maxZoom: 11,
    maxNativeZoom: 8,
    description: 'VIIRS Day/Night Band Night Lights (500 m)',
    cadence: 'daily'
  }
};

/**
 * Construct GIBS WMTS tile URL with a YYYY-MM-DD date.
 */
export function buildGIBSTileURL(
  layerKey: string,
  date: string
): string {
  const config = GIBS_LAYERS[layerKey];
  if (!config) {
    throw new Error(`Unknown GIBS layer key: ${layerKey}`);
  }

  if (!date) {
    throw new Error('Date is required to request a time-enabled GIBS layer');
  }

  const baseUrl = GIBS_BASE_BY_PROJECTION[config.projection];
  // Leaflet expects {z}/{x}/{y} in tile URLs — ensure the template matches that convention
  return `${baseUrl}/${config.product}/default/${date}/${config.tileMatrixSet}/{z}/{x}/{y}.${config.format}`;
}

// --- Capability-aware helpers --------------------------------------------
const capabilitiesCache: Map<GIBSProjection, Document> = new Map();

function parseCapabilitiesXml(text: string): Document {
  // DOMParser is available in browser environments where this code runs
  const parser = new DOMParser();
  return parser.parseFromString(text, 'application/xml');
}

async function getCapabilitiesDocument(projection: GIBSProjection = 'EPSG:3857'): Promise<Document> {
  if (capabilitiesCache.has(projection)) return capabilitiesCache.get(projection)!;
  const xml = await fetchGIBSCapabilities(projection);
  const doc = parseCapabilitiesXml(xml);
  capabilitiesCache.set(projection, doc);
  return doc;
}

function extractLayerElement(doc: Document, product: string): Element | null {
  const layers = Array.from(doc.getElementsByTagName('Layer'));
  for (const layer of layers) {
    const idEl = layer.getElementsByTagName('ows:Identifier')[0] || layer.getElementsByTagName('Identifier')[0];
    if (!idEl) continue;
    if (idEl.textContent === product) return layer;
  }
  return null;
}

function getTimeDefaultAndValues(layerEl: Element | null): { defaultTime?: string; values: string[] } {
  if (!layerEl) return { values: [] };
  const dims = Array.from(layerEl.getElementsByTagName('Dimension'));
  for (const d of dims) {
    const id = d.getElementsByTagName('ows:Identifier')[0] || d.getElementsByTagName('Identifier')[0];
    if (id && id.textContent === 'Time') {
      const def = d.getElementsByTagName('Default')[0];
      const values = Array.from(d.getElementsByTagName('Value')).map(v => v.textContent || '').filter(Boolean);
      return { defaultTime: def?.textContent || undefined, values };
    }
  }
  return { values: [] };
}

function chooseDateForLayer(preferred: string, defaultTime?: string, values: string[] = []): string {
  if (!preferred) return defaultTime ?? 'default';
  // fast path: exact match in values
  if (values.includes(preferred)) return preferred;

  // values may contain ranges like 2023-01-01/2023-01-31/P1D
  const prefDate = new Date(preferred);
  if (!isNaN(prefDate.getTime())) {
    for (const v of values) {
      if (v.includes('/')) {
        const parts = v.split('/');
        const start = new Date(parts[0]);
        const end = new Date(parts[1]);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && prefDate >= start && prefDate <= end) {
          return preferred;
        }
      }
    }
  }

  // fallback to declared Default if present
  if (defaultTime) return defaultTime;
  // otherwise pick the end of the last range, or 'default'
  if (values.length) {
    const last = values[values.length - 1];
    if (last.includes('/')) {
      const parts = last.split('/');
      return parts[1] || 'default';
    }
    return last;
  }
  return 'default';
}

function pickResourceURLTemplate(layerEl: Element | null): string | undefined {
  if (!layerEl) return undefined;
  const resourceEls = Array.from(layerEl.getElementsByTagName('ResourceURL')) as Element[];
  // prefer a template that contains {Time}
  let chosen: string | undefined;
  for (const r of resourceEls) {
    const template = r.getAttribute('template') || undefined;
    const resourceType = r.getAttribute('resourceType') || r.getAttribute('resourcetype') || '';
    if (!template || resourceType.toLowerCase() !== 'tile') continue;
    if (template.includes('{Time}')) return template;
    if (!chosen) chosen = template;
  }
  return chosen;
}

function findTileMatrixSetElement(doc: Document, id: string): Element | null {
  const tms = Array.from(doc.getElementsByTagName('TileMatrixSet'));
  for (const t of tms) {
    const idEl = t.getElementsByTagName('ows:Identifier')[0] || t.getElementsByTagName('Identifier')[0];
    if (idEl && idEl.textContent === id) return t;
  }
  return null;
}

function tileMatrixSetMaxZoom(tmsEl: Element | null): number | undefined {
  if (!tmsEl) return undefined;
  const matrices = Array.from(tmsEl.getElementsByTagName('TileMatrix'));
  let max = -Infinity;
  for (const m of matrices) {
    const idEl = m.getElementsByTagName('ows:Identifier')[0] || m.getElementsByTagName('Identifier')[0];
    if (!idEl || !idEl.textContent) continue;
    const v = parseInt(idEl.textContent.trim(), 10);
    if (!isNaN(v) && v > max) max = v;
  }
  return isFinite(max) ? max : undefined;
}

/**
 * Return capability-derived metadata for a configured layer key.
 * Includes preferred template (if present), time default/values, tileMatrixSet (from capability if available), format and computed maxNativeZoom.
 */
export async function getLayerCapabilities(layerKey: string) {
  const config = GIBS_LAYERS[layerKey];
  if (!config) throw new Error(`Unknown GIBS layer key: ${layerKey}`);

  const doc = await getCapabilitiesDocument(config.projection);
  const layerEl = extractLayerElement(doc, config.product);
  const template = pickResourceURLTemplate(layerEl);
  const { defaultTime, values } = getTimeDefaultAndValues(layerEl);

  // try to discover TileMatrixSet used by the layer element
  let capabilityTileMatrixSet: string | undefined;
  if (layerEl) {
    const tmsLink = layerEl.getElementsByTagName('TileMatrixSetLink')[0];
    if (tmsLink) {
      const tmsName = tmsLink.getElementsByTagName('TileMatrixSet')[0];
      if (tmsName && tmsName.textContent) capabilityTileMatrixSet = tmsName.textContent.trim();
    }
  }

  const tmsToInspect = capabilityTileMatrixSet ?? config.tileMatrixSet;
  const tmsEl = findTileMatrixSetElement(doc, tmsToInspect);
  const computedMaxNative = tileMatrixSetMaxZoom(tmsEl);

  // compute a Leaflet-friendly template if capability provided one
  let leafletTemplate: string | undefined;
  if (template) {
    leafletTemplate = template
      .replace('{TileMatrixSet}', capabilityTileMatrixSet ?? config.tileMatrixSet)
      .replace('{TileMatrix}', '{z}')
      .replace('{TileRow}', '{y}')
      .replace('{TileCol}', '{x}');
  }

  return {
    product: config.product,
    projection: config.projection,
    tileMatrixSet: capabilityTileMatrixSet ?? config.tileMatrixSet,
    format: config.format,
    minZoom: config.minZoom,
    maxZoom: config.maxZoom,
    maxNativeZoom: computedMaxNative ?? config.maxNativeZoom,
    description: config.description,
    cadence: config.cadence,
    template: leafletTemplate,
    defaultTime,
    values
  };
}

function isDateInsideValues(dateStr: string, values: string[]): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;

  for (const v of values) {
    if (!v) continue;
    if (v.includes('/')) {
      const parts = v.split('/');
      const start = new Date(parts[0]);
      const end = new Date(parts[1]);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && d >= start && d <= end) return true;
    } else {
      // explicit date list
      if (v === dateStr) return true;
    }
  }
  return false;
}

/**
 * Async date availability check that uses GetCapabilities Time values when available.
 */
export async function isDateAvailableForLayer(layerKey: string, date: string): Promise<boolean> {
  try {
    const caps = await getLayerCapabilities(layerKey);
    if (caps.values && caps.values.length) {
      // exact match or within any declared range
      if (isDateInsideValues(date, caps.values)) return true;
      // if a Default is present and the date equals it
      if (caps.defaultTime && caps.defaultTime === date) return true;
      return false;
    }
  } catch (err) {
    // if capabilities fail, fall back to broad range check below
    console.warn('Failed to check capabilities for date availability, falling back', err);
  }

  // fallback to the original heuristic
  return isDateAvailable(date);
}

/**
 * Resolve a capability-backed GIBS tile template for Leaflet.
 * Replaces WMTS placeholders ({TileMatrix}/{TileRow}/{TileCol}) with
 * Leaflet-friendly {z}/{y}/{x} and substitutes {TileMatrixSet} and {Time} when available.
 */
export async function resolveGIBSTileURL(layerKey: string, preferredDate: string): Promise<string> {
  const config = GIBS_LAYERS[layerKey];
  if (!config) throw new Error(`Unknown GIBS layer key: ${layerKey}`);

  try {
    const doc = await getCapabilitiesDocument(config.projection);
    const layerEl = extractLayerElement(doc, config.product);
    const { defaultTime, values } = getTimeDefaultAndValues(layerEl);
    const dateToUse = chooseDateForLayer(preferredDate, defaultTime, values);
    const template = pickResourceURLTemplate(layerEl);
    if (template) {
      // substitute placeholders into a Leaflet-friendly template
      let resolved = template
        .replace('{TileMatrixSet}', config.tileMatrixSet)
        .replace('{TileMatrix}', '{z}')
        .replace('{TileRow}', '{y}')
        .replace('{TileCol}', '{x}');
      // substitute time if present
      if (resolved.includes('{Time}')) {
        resolved = resolved.replace('{Time}', dateToUse);
      } else {
        // if no {Time} placeholder, some templates use "default" in path;
        // ensure date is applied in a consistent location: many templates include '/default/' already.
      }
      return resolved;
    }
  } catch (err) {
    // fall through to fallback
    console.warn('Failed to resolve GIBS capabilities, falling back to static template', err);
  }

  // fallback to original template builder
  return buildGIBSTileURL(layerKey, preferredDate);
}

/**
 * Fetch GIBS GetCapabilities XML (for advanced use)
 */
export async function fetchGIBSCapabilities(projection: GIBSProjection = 'EPSG:3857'): Promise<string> {
  const baseUrl = GIBS_BASE_BY_PROJECTION[projection];
  const url = `${baseUrl}/1.0.0/WMTSCapabilities.xml`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch GIBS capabilities: ${response.statusText}`);
  }
  return response.text();
}

/**
 * Validate if a date is available for a given layer (basic range check)
 * In production, parse GetCapabilities XML for exact date ranges.
 */
export function isDateAvailable(date: string): boolean {
  const selectedDate = new Date(date);
  const today = new Date();
  const minDate = new Date('2000-01-01'); // MODIS era start

  return selectedDate >= minDate && selectedDate <= today;
}
