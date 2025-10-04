import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { buildGIBSTileURL, GIBS_LAYERS } from "@/lib/nasa-api";

interface MapViewProps {
  center: [number, number];
  zoom: number;
  activeLayers: string[];
  selectedDate: string;
}

const MapView = ({ center, zoom, activeLayers, selectedDate }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{ [key: string]: L.TileLayer }>({});

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
    });

    // Add base layer (dark theme)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '©OpenStreetMap, ©CartoDB',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(center, zoom);
  }, [center, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Remove layers that are no longer active
    Object.keys(layersRef.current).forEach(key => {
      if (!activeLayers.includes(key)) {
        map.removeLayer(layersRef.current[key]);
        delete layersRef.current[key];
      }
    });

    // Add new active layers using NASA API
    activeLayers.forEach(layerKey => {
      if (layersRef.current[layerKey]) return;

      // Check if layer exists in GIBS configuration
      if (!GIBS_LAYERS[layerKey]) {
        console.warn(`Layer ${layerKey} not found in GIBS catalog`);
        return;
      }

      try {
        // Build dynamic tile URL using NASA API utility
        const tileUrl = buildGIBSTileURL(layerKey, selectedDate);

        const gibsLayer = L.tileLayer(tileUrl, {
          attribution: '©NASA GIBS',
          opacity: 0.7,
          tileSize: 256,
          maxZoom: 9,
        });

        gibsLayer.addTo(map);
        layersRef.current[layerKey] = gibsLayer;
      } catch (error) {
        console.error(`Failed to load layer ${layerKey}:`, error);
      }
    });
  }, [activeLayers, selectedDate]);

  return <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden shadow-lg" />;
};

export default MapView;
