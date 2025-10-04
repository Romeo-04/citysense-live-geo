// NASA SEDAC (Socioeconomic Data and Applications Center) API utilities
// Requires NASA Earthdata Login authentication

export const SEDAC_WMS_BASE = 'https://sedac.ciesin.columbia.edu/geoserver/wms';
export const SEDAC_WCS_BASE = 'https://sedac.ciesin.columbia.edu/geoserver/wcs';

function resolveEarthdataToken(tokenOverride?: string): string {
  const envToken = import.meta.env?.VITE_NASA_EARTHDATA_TOKEN;
  const token = tokenOverride ?? envToken;

  if (!token) {
    throw new Error(
      'NASA Earthdata token is required. Run `npm run fetch:earthdata-token` to mint one and place it in VITE_NASA_EARTHDATA_TOKEN.'
    );
  }

  return token;
}

export interface SEDACLayerConfig {
  workspace: string;
  layer: string;
  style?: string;
}

export const SEDAC_LAYERS: { [key: string]: SEDACLayerConfig } = {
  population_density: {
    workspace: 'gpw-v4',
    layer: 'gpw-v4-population-density_2020',
    style: 'gpw-v4-population-density_2020'
  },
  urban_extents: {
    workspace: 'grump-v1',
    layer: 'grump-v1-urban-extents',
  },
  flood_hazard: {
    workspace: 'ndh',
    layer: 'ndh-flood-hazard-frequency-distribution'
  },
  poverty: {
    workspace: 'povmap',
    layer: 'povmap-global-subnational-prevalence-child-malnutrition_2000'
  }
};

/**
 * Fetch SEDAC WMS map with authentication
 */
export async function fetchSEDACMap(
  layerKey: string,
  bbox: [number, number, number, number], // [minLon, minLat, maxLon, maxLat]
  width: number = 1024,
  height: number = 512,
  crs: string = 'EPSG:4326',
  authToken?: string
): Promise<Blob> {
  const layerConfig = SEDAC_LAYERS[layerKey];
  if (!layerConfig) {
    throw new Error(`Unknown SEDAC layer: ${layerKey}`);
  }

  const params = new URLSearchParams({
    service: 'WMS',
    version: '1.3.0',
    request: 'GetMap',
    layers: `${layerConfig.workspace}:${layerConfig.layer}`,
    bbox: bbox.join(','),
    crs: crs,
    width: width.toString(),
    height: height.toString(),
    format: 'image/png',
    transparent: 'true',
    styles: layerConfig.style || ''
  });

  const url = `${SEDAC_WMS_BASE}?${params.toString()}`;

  const token = resolveEarthdataToken(authToken);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`SEDAC WMS request failed: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Get SEDAC WMS layer URL for Leaflet
 */
export function getSEDACWMSUrl(layerKey: string): string {
  const layerConfig = SEDAC_LAYERS[layerKey];
  if (!layerConfig) {
    throw new Error(`Unknown SEDAC layer: ${layerKey}`);
  }

  return `${SEDAC_WMS_BASE}?service=WMS&version=1.3.0&request=GetMap&layers=${layerConfig.workspace}:${layerConfig.layer}&styles=${layerConfig.style || ''}&format=image/png&transparent=true&crs=EPSG:4326&bbox={bbox-epsg-4326}&width=256&height=256`;
}

/**
 * Fetch SEDAC capabilities
 */
export async function fetchSEDACCapabilities(authToken?: string): Promise<string> {
  const url = `${SEDAC_WMS_BASE}?service=WMS&version=1.3.0&request=GetCapabilities`;

  const token = resolveEarthdataToken(authToken);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch SEDAC capabilities: ${response.statusText}`);
  }

  return response.text();
}

/**
 * Download SEDAC raster data (WCS)
 */
export async function downloadSEDACRaster(
  layerKey: string,
  bbox: [number, number, number, number],
  format: string = 'GeoTIFF',
  authToken?: string
): Promise<Blob> {
  const layerConfig = SEDAC_LAYERS[layerKey];
  if (!layerConfig) {
    throw new Error(`Unknown SEDAC layer: ${layerKey}`);
  }

  const params = new URLSearchParams({
    service: 'WCS',
    version: '2.0.1',
    request: 'GetCoverage',
    coverageId: `${layerConfig.workspace}:${layerConfig.layer}`,
    subset: `Lat(${bbox[1]},${bbox[3]})`,
    subset2: `Long(${bbox[0]},${bbox[2]})`,
    format: format
  });

  const url = `${SEDAC_WCS_BASE}?${params.toString()}`;

  const token = resolveEarthdataToken(authToken);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`SEDAC WCS request failed: ${response.statusText}`);
  }

  return response.blob();
}
