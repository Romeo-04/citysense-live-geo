// WorldPop API utilities

export const WORLDPOP_API_BASE = 'https://hub.worldpop.org/rest';

export interface WorldPopDataset {
  id: string;
  title: string;
  country: string;
  year: number;
  downloadUrl: string;
}

/**
 * Fetch available WorldPop datasets for a country
 */
export async function fetchWorldPopDatasets(
  countryISO: string
): Promise<WorldPopDataset[]> {
  try {
    // Note: WorldPop API structure - adjust based on actual endpoints
    const response = await fetch(
      `${WORLDPOP_API_BASE}/data/pop/${countryISO.toLowerCase()}`
    );
    
    if (!response.ok) {
      throw new Error(`WorldPop API error: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch WorldPop data:', error);
    return [];
  }
}

/**
 * Get country ISO code from city name
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
