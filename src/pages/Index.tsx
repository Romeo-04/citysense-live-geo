import { useState } from "react";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import ControlPanel from "@/components/ControlPanel";
import IndicatorCard from "@/components/IndicatorCard";
import ApiCallPanel from "@/components/ApiCallPanel";
import { LAYER_CATALOG } from "@/lib/layer-catalog";
import { CITY_COORD_LOOKUP } from "@/lib/cities";
import { Thermometer, Trees, Droplets, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const Index = () => {
  const mapZoom = 10;
  const [selectedCity, setSelectedCity] = useState("Metro Manila");
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() - 86400000).toISOString().split('T')[0] // Yesterday
  );
  const [activeLayers, setActiveLayers] = useState<string[]>([
    "lst",
    "ndvi",
    "precipitation",
    "ghsl_built",
    "worldpop_population",
  ]);

  const handleLayerToggle = (layer: string) => {
    setActiveLayers(prev =>
      prev.includes(layer)
        ? prev.filter(l => l !== layer)
        : [...prev, layer]
    );
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  };

  const cityCoords = CITY_COORD_LOOKUP[selectedCity] ?? CITY_COORD_LOOKUP["Metro Manila"];
  const activeLayerSources = Array.from(
    new Set(
      activeLayers
        .map(layerId => LAYER_CATALOG[layerId]?.provider)
        .filter((source): source is string => Boolean(source))
    )
  ).join(" · ");

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
              <h3 className="text-sm font-semibold text-muted-foreground">Key Indicators</h3>
              <IndicatorCard
                title="Heat Exposure"
                value="8.2M"
                description="Population in UHI zones"
                icon={Thermometer}
                trend="up"
              />
              <IndicatorCard
                title="Greenspace Access"
                value="42%"
                description="Within 500m of parks"
                icon={Trees}
                trend="down"
              />
              <IndicatorCard
                title="Flood Risk"
                value="High"
                description="Last 24h precipitation"
                icon={Droplets}
                trend="up"
              />
              <IndicatorCard
                title="Population Density"
                value="24.5K"
                description="Per sq km average"
                icon={Users}
                trend="neutral"
              />
            </div>

            <ApiCallPanel
              center={cityCoords}
              selectedCity={selectedCity}
              selectedDate={selectedDate}
              zoom={mapZoom}
              activeLayers={activeLayers}
            />

            <Button className="w-full gap-2" variant="outline">
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
            <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur px-3 py-2 rounded-lg border border-border/50 text-xs">
              <p className="text-muted-foreground">
                Data sources: {activeLayerSources || "Select a layer"} · {selectedDate} · {selectedCity}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
