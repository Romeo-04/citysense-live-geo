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
    product: 'MOD11A1_LST_Day_1km',
    projection: 'EPSG:3857',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'png',
    minZoom: 2,
    maxZoom: 12,
    maxNativeZoom: 9,
    description: 'MODIS Terra Land Surface Temperature (Daytime, 1 km)',
    cadence: 'daily'
  },
  ndvi: {
    product: 'MOD13A1_NDVI_1km',
    projection: 'EPSG:3857',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'png',
    minZoom: 2,
    maxZoom: 12,
    maxNativeZoom: 9,
    description: 'MODIS Terra NDVI (8-day composite, 1 km)',
    cadence: '8-day'
  },
  precipitation: {
    product: 'GPM_3IMERGHH_06_precipitation',
    projection: 'EPSG:3857',
    tileMatrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    minZoom: 1,
    maxZoom: 9,
    maxNativeZoom: 6,
    description: 'GPM IMERG Half-Hourly Precipitation (0.1°)',
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
    product: 'OMI_Nitrogen_Dioxide_Tropo_Column_L3',
    projection: 'EPSG:3857',
    tileMatrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    minZoom: 1,
    maxZoom: 9,
    maxNativeZoom: 6,
    description: 'OMI Tropospheric NO₂ Column (daily, 0.25°)',
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
