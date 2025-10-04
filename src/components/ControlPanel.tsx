import { Calendar, MapPin, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ControlPanelProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  activeLayers: string[];
  onLayerToggle: (layer: string) => void;
}

const cities = [
  { name: "Metro Manila", lat: 14.5995, lon: 120.9842 },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
  { name: "New York", lat: 40.7128, lon: -74.0060 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "São Paulo", lat: -23.5505, lon: -46.6333 },
];

const layers = [
  { id: "lst", name: "Land Surface Temperature", icon: "🌡️" },
  { id: "ndvi", name: "Vegetation Index (NDVI)", icon: "🌿" },
  { id: "precipitation", name: "Precipitation", icon: "🌧️" },
];

const ControlPanel = ({
  selectedCity,
  onCityChange,
  selectedDate,
  onDateChange,
  activeLayers,
  onLayerToggle,
}: ControlPanelProps) => {
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gradient-to-br from-card to-card/80 backdrop-blur border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Location</h3>
        </div>
        <Select value={selectedCity} onValueChange={onCityChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.name} value={city.name}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-card to-card/80 backdrop-blur border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Date</h3>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </Card>

      <Card className="p-4 bg-gradient-to-br from-card to-card/80 backdrop-blur border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Active Layers</h3>
        </div>
        <div className="space-y-3">
          {layers.map((layer) => (
            <div key={layer.id} className="flex items-center justify-between">
              <Label htmlFor={layer.id} className="flex items-center gap-2 cursor-pointer">
                <span>{layer.icon}</span>
                <span className="text-sm">{layer.name}</span>
              </Label>
              <Switch
                id={layer.id}
                checked={activeLayers.includes(layer.id)}
                onCheckedChange={() => onLayerToggle(layer.id)}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ControlPanel;
