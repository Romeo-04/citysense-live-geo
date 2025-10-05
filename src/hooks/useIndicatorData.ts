import { useState, useEffect } from "react";

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

const CITY_DATA: Record<string, IndicatorData> = {
  "Metro Manila": {
    heatExposure: {
      value: "8.2M",
      description: "Population in UHI zones",
      trend: "up",
      rawValue: 8200000
    },
    greenspace: {
      value: "42%",
      description: "Within 500m of parks",
      trend: "down",
      rawValue: 42
    },
    floodRisk: {
      value: "High",
      description: "Last 24h precipitation: 45mm",
      trend: "up",
      severity: "High"
    },
    population: {
      value: "24.5K",
      description: "Per sq km average",
      trend: "neutral",
      rawValue: 24500
    },
    airQuality: {
      value: "Moderate",
      description: "AQI: 78",
      trend: "neutral",
      aqi: 78
    },
    temperature: {
      value: "32°C",
      description: "Current temperature",
      trend: "up",
      celsius: 32
    }
  },
  "Tokyo": {
    heatExposure: {
      value: "12.5M",
      description: "Population in UHI zones",
      trend: "neutral",
      rawValue: 12500000
    },
    greenspace: {
      value: "58%",
      description: "Within 500m of parks",
      trend: "up",
      rawValue: 58
    },
    floodRisk: {
      value: "Medium",
      description: "Last 24h precipitation: 12mm",
      trend: "neutral",
      severity: "Medium"
    },
    population: {
      value: "16.2K",
      description: "Per sq km average",
      trend: "down",
      rawValue: 16200
    },
    airQuality: {
      value: "Good",
      description: "AQI: 45",
      trend: "down",
      aqi: 45
    },
    temperature: {
      value: "24°C",
      description: "Current temperature",
      trend: "neutral",
      celsius: 24
    }
  },
  "New York": {
    heatExposure: {
      value: "5.8M",
      description: "Population in UHI zones",
      trend: "up",
      rawValue: 5800000
    },
    greenspace: {
      value: "65%",
      description: "Within 500m of parks",
      trend: "up",
      rawValue: 65
    },
    floodRisk: {
      value: "Low",
      description: "Last 24h precipitation: 3mm",
      trend: "down",
      severity: "Low"
    },
    population: {
      value: "11.2K",
      description: "Per sq km average",
      trend: "neutral",
      rawValue: 11200
    },
    airQuality: {
      value: "Good",
      description: "AQI: 52",
      trend: "down",
      aqi: 52
    },
    temperature: {
      value: "18°C",
      description: "Current temperature",
      trend: "down",
      celsius: 18
    }
  },
  "London": {
    heatExposure: {
      value: "4.2M",
      description: "Population in UHI zones",
      trend: "neutral",
      rawValue: 4200000
    },
    greenspace: {
      value: "72%",
      description: "Within 500m of parks",
      trend: "up",
      rawValue: 72
    },
    floodRisk: {
      value: "Medium",
      description: "Last 24h precipitation: 8mm",
      trend: "neutral",
      severity: "Medium"
    },
    population: {
      value: "5.7K",
      description: "Per sq km average",
      trend: "neutral",
      rawValue: 5700
    },
    airQuality: {
      value: "Moderate",
      description: "AQI: 68",
      trend: "neutral",
      aqi: 68
    },
    temperature: {
      value: "15°C",
      description: "Current temperature",
      trend: "neutral",
      celsius: 15
    }
  },
  "São Paulo": {
    heatExposure: {
      value: "9.1M",
      description: "Population in UHI zones",
      trend: "up",
      rawValue: 9100000
    },
    greenspace: {
      value: "38%",
      description: "Within 500m of parks",
      trend: "down",
      rawValue: 38
    },
    floodRisk: {
      value: "High",
      description: "Last 24h precipitation: 52mm",
      trend: "up",
      severity: "High"
    },
    population: {
      value: "7.9K",
      description: "Per sq km average",
      trend: "up",
      rawValue: 7900
    },
    airQuality: {
      value: "Moderate",
      description: "AQI: 72",
      trend: "up",
      aqi: 72
    },
    temperature: {
      value: "28°C",
      description: "Current temperature",
      trend: "up",
      celsius: 28
    }
  }
};

export const useIndicatorData = (city: string): IndicatorData => {
  const [data, setData] = useState<IndicatorData>(
    CITY_DATA[city] || CITY_DATA["Metro Manila"]
  );

  useEffect(() => {
    setData(CITY_DATA[city] || CITY_DATA["Metro Manila"]);
  }, [city]);

  return data;
};
