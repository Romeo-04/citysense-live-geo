import { useState } from "react";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import ControlPanel from "@/components/ControlPanel";
import IndicatorCard from "@/components/IndicatorCard";
import { Thermometer, Trees, Droplets, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const cities = {
  "Metro Manila": { lat: 14.5995, lon: 120.9842 },
  "Tokyo": { lat: 35.6762, lon: 139.6503 },
  "New York": { lat: 40.7128, lon: -74.0060 },
  "London": { lat: 51.5074, lon: -0.1278 },
  "São Paulo": { lat: -23.5505, lon: -46.6333 },
};

const Index = () => {
  const [selectedCity, setSelectedCity] = useState("Metro Manila");
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() - 86400000).toISOString().split('T')[0] // Yesterday
  );
  const [activeLayers, setActiveLayers] = useState<string[]>(["lst"]);

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

  const cityCoords = cities[selectedCity as keyof typeof cities];

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

            <Button className="w-full gap-2" variant="outline">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>

          {/* Main Map Area */}
          <div className="lg:col-span-3 relative">
            <MapView
              center={[cityCoords.lat, cityCoords.lon]}
              zoom={10}
              activeLayers={activeLayers}
              selectedDate={selectedDate}
            />
            <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur px-3 py-2 rounded-lg border border-border/50 text-xs">
              <p className="text-muted-foreground">
                Data sources: NASA GIBS · {selectedDate} · {selectedCity}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
