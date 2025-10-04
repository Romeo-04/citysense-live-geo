// Copernicus Data Space API utilities

export const COPERNICUS_ODATA_BASE = 'https://catalogue.dataspace.copernicus.eu/odata/v1';

export interface CopernicusSearchParams {
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  startDate: string;
  endDate: string;
  cloudCover?: number;
  collection?: 'SENTINEL-1' | 'SENTINEL-2';
}

/**
 * Search Copernicus Sentinel products
 * Requires authentication token for full access
 */
export async function searchCopernicusProducts(
  params: CopernicusSearchParams,
  token?: string
): Promise<any[]> {
  const { bbox, startDate, endDate, cloudCover = 20, collection = 'SENTINEL-2' } = params;
  
  const polygon = `POLYGON((${bbox[0]} ${bbox[1]},${bbox[2]} ${bbox[1]},${bbox[2]} ${bbox[3]},${bbox[0]} ${bbox[3]},${bbox[0]} ${bbox[1]}))`;
  
  const filter = [
    `startswith(Collection/Name,'${collection}')`,
    `OData.CSC.Intersects(area=geography'${polygon}')`,
    `ContentDate/Start ge ${startDate}`,
    `ContentDate/Start le ${endDate}`,
    collection === 'SENTINEL-2' ? `Attributes/OData.CSC.FloatAttribute/any(a:a/Name eq 'cloudcoverpercentage' and a/OData.CSC.NullableFloat lt ${cloudCover})` : null
  ].filter(Boolean).join(' and ');
  
  const url = `${COPERNICUS_ODATA_BASE}/Products?$filter=${encodeURIComponent(filter)}`;
  
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Copernicus API error: ${response.statusText}`);
    }
    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error('Failed to search Copernicus products:', error);
    return [];
  }
}
