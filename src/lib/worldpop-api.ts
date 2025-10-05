// WorldPop data access helpers

export const WORLDPOP_STAC_BASE = 'https://sdi.worldpop.org/api';
export const WORLDPOP_WMS_BASE = 'https://sdi.worldpop.org/geoserver/worldpop/wms';
export const WORLDPOP_DOWNLOAD_BASE = 'https://sdi.worldpop.org/wpdata';

export interface WorldPopCollection {
  id: string;
  title: string;
  keywords?: string[];
  extent?: {
    spatial?: {
      bbox: number[][];
    };
    temporal?: {
      interval: [string, string][];
    };
  };
}

export interface WorldPopDownloadOptions {
  iso: string;
  year: number;
  resolution?: '1km' | '100m';
}

/**
 * Fetch the STAC collections exposed by the WorldPop SDI (public endpoint).
 */
export async function fetchWorldPopCollections(): Promise<WorldPopCollection[]> {
  try {
    const response = await fetch(`${WORLDPOP_STAC_BASE}/collections`);
    if (!response.ok) {
      throw new Error(`WorldPop collections error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.collections ?? [];
  } catch (error) {
    console.error('Failed to fetch WorldPop collections:', error);
    return [];
  }
}

/**
 * Build a WMS layer name for a given ISO code and year.
 * WorldPop publishes national mosaics with the pattern:
 *   worldpop:ppp_<YEAR>_<ISO>_1km_Aggregated
 */
export function buildWorldPopLayerName(iso: string, year: number = 2020): string {
  return `worldpop:ppp_${year}_${iso.toUpperCase()}_1km_Aggregated`;
}

/**
 * Construct a download URL (GeoTIFF) using the documented REST helper.
 */
export function buildWorldPopDownloadUrl({ iso, year, resolution = '1km' }: WorldPopDownloadOptions): string {
  const layer = `ppp_${year}_${resolution}`;
  return `${WORLDPOP_DOWNLOAD_BASE}?iso=${iso.toUpperCase()}&layer=${layer}`;
}

/**
 * Map supported cities to ISO3 codes for quick lookup.
 */
export function getCityCountryISO(city: string): string {
  const cityMap: { [key: string]: string } = {
    'Metro Manila': 'PHL',
    'Tokyo': 'JPN',
    'New York': 'USA',
    'London': 'GBR',
    'São Paulo': 'BRA'
  };

  return cityMap[city] || 'PHL';
}
