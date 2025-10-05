import { useState, useEffect } from "react";
import {
  fetchPopulationDensity,
  fetchBuiltUpSurface,
  fetchFloodHazard,
  fetchLST,
  fetchNDVI,
  fetchAOD,
  fetchNO2,
} from "@/lib/indicator-api";

export interface IndicatorData {
  heatExposure: {
    value: string;
    description: string;
    trend: "up" | "down" | "neutral";
    rawValue: number;
  };
  greenspace: {
    value: string;
    description: string;
    trend: "up" | "down" | "neutral";
    rawValue: number;
  };
  floodRisk: {
    value: string;
    description: string;
    trend: "up" | "down" | "neutral";
    severity: string;
  };
  population: {
    value: string;
    description: string;
    trend: "up" | "down" | "neutral";
    rawValue: number;
  };
  airQuality: {
    value: string;
    description: string;
    trend: "up" | "down" | "neutral";
    aqi: number;
  };
  temperature: {
    value: string;
    description: string;
    trend: "up" | "down" | "neutral";
    celsius: number;
  };
}

const DEFAULT_INDICATORS: IndicatorData = {
  heatExposure: {
    value: "Loading...",
    description: "Fetching data...",
    trend: "neutral",
    rawValue: 0,
  },
  greenspace: {
    value: "Loading...",
    description: "Fetching data...",
    trend: "neutral",
    rawValue: 0,
  },
  floodRisk: {
    value: "Loading...",
    description: "Fetching data...",
    trend: "neutral",
    severity: "Unknown",
  },
  population: {
    value: "Loading...",
    description: "Fetching data...",
    trend: "neutral",
    rawValue: 0,
  },
  airQuality: {
    value: "Loading...",
    description: "Fetching data...",
    trend: "neutral",
    aqi: 0,
  },
  temperature: {
    value: "Loading...",
    description: "Fetching data...",
    trend: "neutral",
    celsius: 0,
  },
};

export const useIndicatorData = (city: string, date: string): IndicatorData => {
  const [data, setData] = useState<IndicatorData>(DEFAULT_INDICATORS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch data from APIs
      const [population, builtUp, floodHazard, lst, ndvi, aod, no2] = await Promise.all([
        fetchPopulationDensity(city),
        fetchBuiltUpSurface(city),
        fetchFloodHazard(city),
        fetchLST(city, date),
        fetchNDVI(city, date),
        fetchAOD(city, date),
        fetchNO2(city, date),
      ]);

      // Calculate indicators based on fetched data
      const heatExposureValue = lst || aod ? (lst || 0) + (aod || 0) : 0; // Placeholder calculation
      const greenspaceValue = ndvi ? ndvi * 100 : 0; // NDVI as percentage
      const floodRiskValue = floodHazard ? floodHazard : 0;
      const populationValue = population || 0;
      const airQualityValue = (aod || 0) + (no2 || 0); // Placeholder AQI calculation

      setData({
        heatExposure: {
          value: heatExposureValue > 0 ? `${heatExposureValue.toFixed(1)}°C` : "N/A",
          description: "Heat exposure from LST and AOD",
          trend: "neutral", // Could be calculated based on trends
          rawValue: heatExposureValue,
        },
        greenspace: {
          value: greenspaceValue > 0 ? `${greenspaceValue.toFixed(1)}%` : "N/A",
          description: "Greenspace coverage from NDVI",
          trend: "neutral",
          rawValue: greenspaceValue,
        },
        floodRisk: {
          value: floodRiskValue > 0 ? `${floodRiskValue.toFixed(1)}` : "N/A",
          description: "Flood hazard frequency",
          trend: "neutral",
          severity: floodRiskValue > 5 ? "High" : floodRiskValue > 2 ? "Medium" : "Low",
        },
        population: {
          value: populationValue > 0 ? `${populationValue}K` : "N/A",
          description: "Population density per sq km",
          trend: "neutral",
          rawValue: populationValue,
        },
        airQuality: {
          value: airQualityValue > 0 ? (airQualityValue > 100 ? "Poor" : airQualityValue > 50 ? "Moderate" : "Good") : "N/A",
          description: `AQI: ${airQualityValue.toFixed(0)}`,
          trend: "neutral",
          aqi: airQualityValue,
        },
        temperature: {
          value: lst ? `${lst.toFixed(1)}°C` : "N/A",
          description: "Land surface temperature",
          trend: "neutral",
          celsius: lst || 0,
        },
      });

      setLoading(false);
    };

    fetchData();
  }, [city, date]);

  return data;
};
