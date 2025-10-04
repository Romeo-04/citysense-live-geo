// NASA SEDAC (Socioeconomic Data and Applications Center) API utilities
// Requires NASA Earthdata Login authentication

export const SEDAC_WMS_BASE = 'https://sedac.ciesin.columbia.edu/geoserver/wms';
export const SEDAC_WCS_BASE = 'https://sedac.ciesin.columbia.edu/geoserver/wcs';

// IMPORTANT: Store this token securely - consider using Lovable Cloud secrets for production
// Token expires: May 2025 (exp: 1764756514)
export const NASA_EARTHDATA_TOKEN = 'eyJ0eXAiOiJKV1QiLCJvcmlnaW4iOiJFYXJ0aGRhdGEgTG9naW4iLCJzaWciOiJlZGxqd3RwdWJrZXlfb3BzIiwiYWxnIjoiUlMyNTYifQ.eyJ0eXBlIjoiVXNlciIsInVpZCI6ImFjbXJzdSIsImV4cCI6MTc2NDc1NjUxNCwiaWF0IjoxNzU5NTcyNTE0LCJpc3MiOiJodHRwczovL3Vycy5lYXJ0aGRhdGEubmFzYS5nb3YiLCJpZGVudGl0eV9wcm92aWRlciI6ImVkbF9vcHMiLCJhY3IiOiJlZGwiLCJhc3N1cmFuY2VfbGV2ZWwiOjN9.hwZTEWTqF-iHEell4s8OYLlS7TjyBxMz_IoU7DtZ_E8KLFI3jpkquBMEo_b5OY8UqqkxIRYEDbfa_lJytjsORyd1tjSUI7GLdaE6FM6-_9XlJwVd8E_mYkxGhhFwYINRxGINVN01Oxh3MDmxxxYKpWkNfEogCTtR-EQSkKcnug5IMBu_YRtZgQjYRgPWNxfR_r0pEtPurcoSCOHx6i7pSGjkeO7x48rG0g2zuObxaMZ8ew6gQqQq8eFLU-z253uomSHS6MPaD6dsA95CTMftEHAxCWpLOGNEc9RtDrlWD-DzJmZ5NqOmhIFAVABdCJQGFAYFvChLn9edOgiy-UkewQ';

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
  crs: string = 'EPSG:4326'
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

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${NASA_EARTHDATA_TOKEN}`
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
export async function fetchSEDACCapabilities(): Promise<string> {
  const url = `${SEDAC_WMS_BASE}?service=WMS&version=1.3.0&request=GetCapabilities`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${NASA_EARTHDATA_TOKEN}`
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
  format: string = 'GeoTIFF'
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

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${NASA_EARTHDATA_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`SEDAC WCS request failed: ${response.statusText}`);
  }

  return response.blob();
}
