import { useState } from "react";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import ControlPanel from "@/components/ControlPanel";
import IndicatorCard from "@/components/IndicatorCard";
import { LAYER_CATALOG } from "@/lib/layer-catalog";
import { CITY_COORD_LOOKUP } from "@/lib/cities";
import {
  Thermometer,
  Trees,
  Droplets,
  Users,
  Wind,
  CloudRain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useIndicatorData } from "@/hooks/useIndicatorData";
import { useLayerInsights } from "@/hooks/useLayerInsights";
import { useWeatherData } from "@/hooks/useWeatherData";
import { generateReport, downloadReport } from "@/lib/report-generator";
import { useToast } from "@/hooks/use-toast";
import WeatherChatbot from "@/components/WeatherChatbot";
import { LayerInsightsPanel } from "@/components/LayerInsightsPanel";

const Index = () => {
  const { toast } = useToast();
  const mapZoom = 10;
  const [selectedCity, setSelectedCity] = useState("Metro Manila");
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() - 86400000).toISOString().split("T")[0] // Yesterday
  );
  const [activeLayers, setActiveLayers] = useState<string[]>([
    "lst",
    "ndvi",
    "precipitation",
    "ghsl_built",
    "worldpop_population",
  ]);

  const indicators = useIndicatorData(selectedCity, selectedDate);
  const { insights: layerInsights, loading: insightsLoading } =
    useLayerInsights({
      city: selectedCity,
      activeLayers,
      date: selectedDate,
    });
  const { weather, loading: weatherLoading } = useWeatherData(selectedCity);

  const handleLayerToggle = (layer: string) => {
    setActiveLayers((prev) =>
      prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer]
    );
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  };

  const cityCoords =
    CITY_COORD_LOOKUP[selectedCity] ?? CITY_COORD_LOOKUP["Metro Manila"];
  const activeLayerSources = Array.from(
    new Set(
      activeLayers
        .map((layerId) => LAYER_CATALOG[layerId]?.provider)
        .filter((source): source is string => Boolean(source))
    )
  ).join(" · ");

  const handleDownloadReport = () => {
    const layerNames = activeLayers.map((id) => LAYER_CATALOG[id]?.name || id);
    const reportContent = generateReport({
      city: selectedCity,
      date: selectedDate,
      activeLayers: layerNames,
      layerIds: activeLayers,
      indicators,
      weather: weather || undefined,
    });

    const filename = `${selectedCity.replace(
      /\s+/g,
      "_"
    )}_Report_${selectedDate}.txt`;
    downloadReport(reportContent, filename);

    toast({
      title: "Report Downloaded",
      description: `Environmental report for ${selectedCity} has been generated.`,
    });
  };

  // Insights/pins removed per user request

  return (
    <div className="min-h-screen bg-background flex flex-col relative z-0">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-4 overflow-y-auto">
            <ControlPanel
              selectedCity={selectedCity}
              onCityChange={handleCityChange}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              activeLayers={activeLayers}
              onLayerToggle={handleLayerToggle}
            />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Key Indicators
              </h3>
              <IndicatorCard
                title="Heat Exposure"
                value={indicators.heatExposure.value}
                description={indicators.heatExposure.description}
                icon={Thermometer}
                trend={indicators.heatExposure.trend}
              />
              <IndicatorCard
                title="Greenspace Access"
                value={indicators.greenspace.value}
                description={indicators.greenspace.description}
                icon={Trees}
                trend={indicators.greenspace.trend}
              />
              <IndicatorCard
                title="Flood Risk"
                value={indicators.floodRisk.value}
                description={indicators.floodRisk.description}
                icon={Droplets}
                trend={indicators.floodRisk.trend}
              />
              <IndicatorCard
                title="Population Density"
                value={indicators.population.value}
                description={indicators.population.description}
                icon={Users}
                trend={indicators.population.trend}
              />
              <IndicatorCard
                title="Air Quality"
                value={indicators.airQuality.value}
                description={indicators.airQuality.description}
                icon={Wind}
                trend={indicators.airQuality.trend}
              />
              {weather && (
                <IndicatorCard
                  title="Weather"
                  value={`${weather.temperature}°C`}
                  description={weather.description}
                  icon={CloudRain}
                  trend="neutral"
                />
              )}
            </div>

            <Button
              className="w-full gap-2"
              variant="outline"
              onClick={handleDownloadReport}
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>

          {/* Main Map Area */}
          <div className="lg:col-span-3 relative">
            <MapView
              center={[cityCoords.lat, cityCoords.lon]}
              zoom={mapZoom}
              activeLayers={activeLayers}
              selectedDate={selectedDate}
              selectedCity={selectedCity}
            />
            <LayerInsightsPanel
              insights={layerInsights}
              loading={insightsLoading}
            />
            <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur px-3 py-2 rounded-lg border border-border/50 text-xs">
              <p className="text-muted-foreground">
                Data sources: {activeLayerSources || "Select a layer"} ·{" "}
                {selectedDate} · {selectedCity}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Floating AI Chatbot Button */}
      <div className="fixed bottom-6 right-6 z-[2000]">
        <WeatherChatbot
          city={selectedCity}
          weather={weather}
          loading={weatherLoading}
        />
      </div>
    </div>
  );
};

export default Index;
