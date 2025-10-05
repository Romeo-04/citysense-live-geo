import { IndicatorData } from "@/hooks/useIndicatorData";
import { LAYER_CATALOG } from './layer-catalog';

export interface ReportData {
  city: string;
  date: string;
  activeLayers: string[];
  /** optional: layer ids (keys) corresponding to the activeLayers names */
  layerIds?: string[];
  indicators: IndicatorData;
  weather?: {
    temperature: number;
    description: string;
    humidity: number;
    windSpeed: number;
    pressure: number;
  };
}

export const generateReport = (data: ReportData): string => {
  const { city, date, activeLayers, layerIds, indicators, weather } = data;

  // Resolve layer keys: prefer explicit layerIds, otherwise try to match by display name
  const layerKeys = (layerIds && layerIds.length)
    ? layerIds
    : activeLayers.map(name => {
        const found = Object.entries(LAYER_CATALOG).find(([, cfg]) => cfg.name === name);
        return found ? found[0] : name;
      });

  const layerInfo: Record<string, string> = {
    'lst': 'Land Surface Temperature (LST)\n   - Resolution: 1km\n   - Provider: NASA MODIS\n   - Updates: Daily\n   - Use: Urban heat island analysis',
    'ndvi': 'Normalized Difference Vegetation Index (NDVI)\n   - Resolution: 250m\n   - Provider: NASA MODIS\n   - Updates: Daily\n   - Use: Vegetation health monitoring',
    'precipitation': 'Precipitation Data\n   - Resolution: 0.1°\n   - Provider: NASA GPM\n   - Updates: 3-hourly\n   - Use: Rainfall and flood risk assessment',
    'aod': 'Aerosol Optical Depth (AOD)\n   - Resolution: 1km\n   - Provider: NASA MODIS\n   - Updates: Daily\n   - Use: Air quality monitoring',
    'no2': 'Nitrogen Dioxide (NO2)\n   - Resolution: 13km\n   - Provider: NASA OMI\n   - Updates: Daily\n   - Use: Pollution tracking',
    'nightlights': 'Nighttime Lights\n   - Resolution: 500m\n   - Provider: NASA VIIRS\n   - Updates: Daily\n   - Use: Urbanization and economic activity',
    'sedac_flood': 'Flood Hazard Zones\n   - Provider: NASA SEDAC\n   - Use: Disaster risk assessment',
    'ghsl_built': 'Built-up Areas\n   - Resolution: 10m\n   - Provider: ESA GHSL\n   - Use: Urban expansion monitoring',
    'worldpop_population': 'Population Distribution\n   - Resolution: 1km\n   - Provider: WorldPop\n   - Use: Demographic analysis'
  };

  const layerCapabilitiesStr = layerKeys.map(k => layerInfo[k] || `${k}\n   - Information not available`).join('\n\n');
  
  const reportContent = `
CITY ENVIRONMENTAL DATA REPORT
Generated: ${new Date().toLocaleString()}
================================================================================

LOCATION INFORMATION
--------------------------------------------------------------------------------
City: ${city}
Date: ${date}
Active Data Layers: ${activeLayers.length}
- ${activeLayers.join('\n- ')}

ENVIRONMENTAL INDICATORS
--------------------------------------------------------------------------------

🌡️  HEAT EXPOSURE
   Status: ${indicators.heatExposure.value}
   Description: ${indicators.heatExposure.description}
   Trend: ${indicators.heatExposure.trend === 'up' ? '↑ Increasing' : indicators.heatExposure.trend === 'down' ? '↓ Decreasing' : '→ Stable'}
   Affected Population: ${indicators.heatExposure.rawValue.toLocaleString()} people

🌳  GREENSPACE ACCESS
   Coverage: ${indicators.greenspace.value}
   Description: ${indicators.greenspace.description}
   Trend: ${indicators.greenspace.trend === 'up' ? '↑ Improving' : indicators.greenspace.trend === 'down' ? '↓ Declining' : '→ Stable'}
   Access Rate: ${indicators.greenspace.rawValue}%

💧  FLOOD RISK
   Level: ${indicators.floodRisk.value}
   ${indicators.floodRisk.description}
   Trend: ${indicators.floodRisk.trend === 'up' ? '↑ Increasing' : indicators.floodRisk.trend === 'down' ? '↓ Decreasing' : '→ Stable'}

👥  POPULATION DENSITY
   Density: ${indicators.population.value}
   Description: ${indicators.population.description}
   Trend: ${indicators.population.trend === 'up' ? '↑ Growing' : indicators.population.trend === 'down' ? '↓ Declining' : '→ Stable'}
   People per km²: ${indicators.population.rawValue.toLocaleString()}

🌬️  AIR QUALITY
   Status: ${indicators.airQuality.value}
   ${indicators.airQuality.description}
   Trend: ${indicators.airQuality.trend === 'up' ? '↑ Worsening' : indicators.airQuality.trend === 'down' ? '↓ Improving' : '→ Stable'}
   Air Quality Index: ${indicators.airQuality.aqi}

${weather ? `
CURRENT WEATHER CONDITIONS
--------------------------------------------------------------------------------
Temperature: ${weather.temperature}°C
Conditions: ${weather.description}
Humidity: ${weather.humidity}%
Wind Speed: ${weather.windSpeed} km/h
Pressure: ${weather.pressure} hPa
` : ''}

DATA SOURCES
--------------------------------------------------------------------------------
- NASA GIBS (Land Surface Temperature, NDVI, Precipitation, AOD, NO2)
- NASA SEDAC (Flood Hazard, Population Data)
- ESA GHSL (Built-up Areas)
- WorldPop (Population Distribution)
- VIIRS (Nighttime Lights)
- Open-Meteo (Weather Data)

LAYER CAPABILITIES
--------------------------------------------------------------------------------
${layerCapabilitiesStr}

ANALYSIS SUMMARY
--------------------------------------------------------------------------------
This report provides comprehensive environmental and demographic data for ${city}.
The data combines satellite observations, ground measurements, and statistical
models to assess urban environmental conditions.

Key Findings:
- Heat exposure affects ${indicators.heatExposure.value} residents
- ${indicators.greenspace.value} have access to greenspace within walking distance
- Flood risk is currently ${indicators.floodRisk.value}
- Population density: ${indicators.population.value}
- Air quality: ${indicators.airQuality.value} (AQI: ${indicators.airQuality.aqi})

RECOMMENDATIONS
--------------------------------------------------------------------------------
Based on current indicators:
${indicators.heatExposure.trend === 'up' ? '⚠️  Monitor urban heat island effects and consider cooling strategies' : ''}
${indicators.greenspace.trend === 'down' ? '⚠️  Increase greenspace accessibility to improve urban resilience' : ''}
${indicators.floodRisk.severity === 'High' ? '⚠️  Implement flood mitigation measures and early warning systems' : ''}
${indicators.airQuality.aqi > 100 ? '⚠️  Air quality requires attention - reduce emissions sources' : ''}

================================================================================
End of Report

Note: This is a demonstration report with placeholder and real-time data.
For operational use, verify data sources and update frequencies.
`;

  return reportContent;
};

export const downloadReport = (content: string, filename: string = 'city-report.txt') => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
