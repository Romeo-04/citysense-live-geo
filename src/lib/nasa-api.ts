// NASA GIBS API utilities

export interface GIBSLayerConfig {
  layer: string;
  format: string;
  tileMatrixSet: string;
  resolution: string;
}

export const GIBS_BASE_URL = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';

export const GIBS_LAYERS: { [key: string]: GIBSLayerConfig } = {
  lst: {
    layer: 'MODIS_Terra_Land_Surface_Temp_Day',
    format: 'png',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    resolution: '1km'
  },
  ndvi: {
    layer: 'MODIS_Terra_NDVI_8Day',
    format: 'png',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    resolution: '500m'
  },
  precipitation: {
    layer: 'GPM_3IMERGHH_06_precipitation',
    format: 'png',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    resolution: '10km'
  },
  aod: {
    layer: 'MODIS_Combined_Value_Added_AOD',
    format: 'png',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    resolution: '1km'
  },
  no2: {
    layer: 'OMI_Nitrogen_Dioxide_Tropo_Column',
    format: 'png',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    resolution: '25km'
  },
  nightlights: {
    layer: 'VIIRS_SNPP_DayNightBand_ENCC',
    format: 'png',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    resolution: '500m'
  }
};

/**
 * Construct GIBS WMTS tile URL with date parameter
 */
export function buildGIBSTileURL(
  layerKey: string,
  date: string
): string {
  const config = GIBS_LAYERS[layerKey];
  if (!config) {
    throw new Error(`Unknown layer: ${layerKey}`);
  }

  return `${GIBS_BASE_URL}/${config.layer}/default/${date}/${config.tileMatrixSet}/{z}/{y}/{x}.${config.format}`;
}

/**
 * Fetch GIBS GetCapabilities XML (for advanced use)
 */
export async function fetchGIBSCapabilities(): Promise<string> {
  const url = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch GIBS capabilities: ${response.statusText}`);
  }
  return response.text();
}

/**
 * Validate if a date is available for a given layer (basic check)
 * In production, parse GetCapabilities XML for exact date ranges
 */
export function isDateAvailable(date: string): boolean {
  const selectedDate = new Date(date);
  const today = new Date();
  const minDate = new Date('2000-01-01'); // MODIS era start
  
  return selectedDate >= minDate && selectedDate <= today;
}
