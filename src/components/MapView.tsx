import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

    // Define NASA GIBS layers
    const layerConfigs: { [key: string]: { layer: string; format: string } } = {
      lst: {
        layer: 'MODIS_Terra_Land_Surface_Temp_Day',
        format: 'png'
      },
      ndvi: {
        layer: 'MODIS_Terra_NDVI_8Day',
        format: 'png'
      },
      precipitation: {
        layer: 'GPM_3IMERGHH_06_precipitation',
        format: 'png'
      }
    };

    // Remove layers that are no longer active
    Object.keys(layersRef.current).forEach(key => {
      if (!activeLayers.includes(key)) {
        map.removeLayer(layersRef.current[key]);
        delete layersRef.current[key];
      }
    });

    // Add new active layers
    activeLayers.forEach(layerKey => {
      if (layersRef.current[layerKey]) return;

      const config = layerConfigs[layerKey];
      if (!config) return;

      const gibsLayer = L.tileLayer(
        `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${config.layer}/default/${selectedDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.${config.format}`,
        {
          attribution: 'NASA GIBS',
          opacity: 0.7,
          tileSize: 256,
        }
      );

      gibsLayer.addTo(map);
      layersRef.current[layerKey] = gibsLayer;
    });
  }, [activeLayers, selectedDate]);

  return <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden shadow-lg" />;
};

export default MapView;
