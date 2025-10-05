import { useMemo } from "react";
import { Calendar, MapPin, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORTED_LAYER_LIST } from "@/lib/layer-catalog";
import { DEFAULT_CITIES } from "@/lib/cities";

interface ControlPanelProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  activeLayers: string[];
  onLayerToggle: (layer: string) => void;
}

const ControlPanel = ({
  selectedCity,
  onCityChange,
  selectedDate,
  onDateChange,
  activeLayers,
  onLayerToggle,
}: ControlPanelProps) => {
  const groupedLayers = useMemo(() => {
    return SORTED_LAYER_LIST.reduce<Record<string, typeof SORTED_LAYER_LIST>>((acc, layer) => {
      const list = acc[layer.category] ?? [];
      acc[layer.category] = [...list, layer];
      return acc;
    }, {});
  }, []);

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
            {DEFAULT_CITIES.map((city) => (
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
        <div className="space-y-4">
          {Object.entries(groupedLayers).map(([category, layers]) => (
            <div key={category} className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                {category}
              </p>
              {layers.map((layer) => (
                <div key={layer.id} className="flex items-center justify-between">
                  <Label htmlFor={layer.id} className="flex flex-col gap-0.5 cursor-pointer">
                    <span className="text-sm font-medium">{layer.name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {layer.provider}
                    </span>
                  </Label>
                  <Switch
                    id={layer.id}
                    checked={activeLayers.includes(layer.id)}
                    onCheckedChange={() => onLayerToggle(layer.id)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ControlPanel;
