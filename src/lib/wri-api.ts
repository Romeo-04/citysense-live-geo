// WRI Resource Watch API utilities

export const RESOURCE_WATCH_API_BASE = 'https://api.resourcewatch.org/v1';

export interface WRIDataset {
  id: string;
  name: string;
  slug: string;
  type: string;
}

/**
 * Fetch available datasets from Resource Watch
 */
export async function fetchWRIDatasets(searchTerm?: string): Promise<WRIDataset[]> {
  try {
    const url = searchTerm 
      ? `${RESOURCE_WATCH_API_BASE}/dataset?search=${encodeURIComponent(searchTerm)}`
      : `${RESOURCE_WATCH_API_BASE}/dataset`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`WRI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch WRI datasets:', error);
    return [];
  }
}

/**
 * Query Aqueduct water risk data
 */
export async function queryAqueductData(
  datasetId: string,
  sql: string,
  token?: string
): Promise<any[]> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${RESOURCE_WATCH_API_BASE}/query/${datasetId}?sql=${encodeURIComponent(sql)}`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Aqueduct query error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to query Aqueduct data:', error);
    return [];
  }
}
