export interface CityLocation {
  name: string;
  lat: number;
  lon: number;
}

export const DEFAULT_CITIES: CityLocation[] = [
  { name: 'Metro Manila', lat: 14.5995, lon: 120.9842 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
];

export const CITY_COORD_LOOKUP: Record<string, { lat: number; lon: number }> = DEFAULT_CITIES.reduce(
  (acc, city) => {
    acc[city.name] = { lat: city.lat, lon: city.lon };
    return acc;
  },
  {} as Record<string, { lat: number; lon: number }>
);
