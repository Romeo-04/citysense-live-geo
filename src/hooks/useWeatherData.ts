import { useState, useEffect } from "react";

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
}

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  "Metro Manila": { lat: 14.5995, lon: 120.9842 },
  "Tokyo": { lat: 35.6762, lon: 139.6503 },
  "New York": { lat: 40.7128, lon: -74.0060 },
  "London": { lat: 51.5074, lon: -0.1278 },
  "São Paulo": { lat: -23.5505, lon: -46.6333 }
};

export const useWeatherData = (city: string) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      const coords = CITY_COORDS[city];
      
      if (!coords) {
        setLoading(false);
        return;
      }

      try {
        // Using Open-Meteo free API (no API key required)
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,weather_code&timezone=auto`
        );
        
        if (response.ok) {
          const data = await response.json();
          const weatherCodeDescriptions: Record<number, string> = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Foggy',
            51: 'Light drizzle',
            61: 'Light rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            80: 'Rain showers',
            95: 'Thunderstorm'
          };

          setWeather({
            temperature: data.current.temperature_2m,
            description: weatherCodeDescriptions[data.current.weather_code] || 'Unknown',
            humidity: data.current.relative_humidity_2m,
            windSpeed: data.current.wind_speed_10m,
            pressure: data.current.surface_pressure
          });
        }
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [city]);

  return { weather, loading };
};
