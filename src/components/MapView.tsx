import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { buildGIBSTileURL, GIBS_LAYERS } from "@/lib/nasa-api";
import { LAYER_CATALOG } from "@/lib/layer-catalog";
import { buildWorldPopLayerName, getCityCountryISO } from "@/lib/worldpop-api";

interface MapViewProps {
  center: [number, number];
  zoom: number;
  activeLayers: string[];
  selectedDate: string;
  selectedCity: string;
}

type LayerMap = Record<string, L.Layer>;

const MapView = ({ center, zoom, activeLayers, selectedDate, selectedCity }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<LayerMap>({});

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
      preferCanvas: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '©OpenStreetMap contributors, ©CartoDB',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layersRef.current = {};
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
        const layer = layersRef.current[key];
        map.removeLayer(layer);
        delete layersRef.current[key];
      }
    });

    activeLayers.forEach(layerKey => {
      const config = LAYER_CATALOG[layerKey];
      if (!config) {
        console.warn(`Layer ${layerKey} not found in catalog`);
        return;
      }

      const existingLayer = layersRef.current[layerKey];

      if (config.type === 'nasa-gibs' && config.gibsLayerKey) {
        const gibsConfig = GIBS_LAYERS[config.gibsLayerKey];
        try {
          const tileUrl = buildGIBSTileURL(config.gibsLayerKey, selectedDate);
          const layerOptions: L.TileLayerOptions = {
            tileSize: 256,
            opacity: config.defaultOpacity ?? 0.7,
            attribution: `© ${config.provider}`,
            minZoom: gibsConfig.minZoom,
            maxZoom: gibsConfig.maxZoom,
            maxNativeZoom: gibsConfig.maxNativeZoom,
            crossOrigin: true,
          };

          if (existingLayer && existingLayer instanceof L.TileLayer) {
            const el = existingLayer as any;
            el.setUrl(tileUrl);
            el.setOpacity(layerOptions.opacity ?? 1);
            if (config.zIndex) {
              el.setZIndex(config.zIndex);
            }
            return;
          }

          const gibsLayer = L.tileLayer(tileUrl, layerOptions);
          if (config.zIndex) {
            gibsLayer.setZIndex(config.zIndex);
          }
          gibsLayer.addTo(map);
          layersRef.current[layerKey] = gibsLayer;
        } catch (error) {
          console.error(`Failed to load GIBS layer ${layerKey}:`, error);
        }
      } else if (config.type === 'wms' && config.wms) {
        let layerName = config.wms.layerName;
        if (layerKey === 'worldpop_population') {
          const iso = getCityCountryISO(selectedCity);
          layerName = buildWorldPopLayerName(iso);
        }
        const wmsParams: L.WMSOptions = {
          layers: layerName,
          styles: config.wms.style ?? '',
          format: config.wms.format ?? 'image/png',
          transparent: config.wms.transparent ?? true,
          opacity: config.defaultOpacity ?? 0.7,
          attribution: `© ${config.provider}`,
          crossOrigin: true,
        };

        if (config.wms.timeEnabled) {
          (wmsParams as any).time = selectedDate;
        }
        if (config.wms.minZoom !== undefined) {
          wmsParams.minZoom = config.wms.minZoom;
        }
        if (config.wms.maxZoom !== undefined) {
          wmsParams.maxZoom = config.wms.maxZoom;
        }
        if (config.wms.maxNativeZoom !== undefined) {
          wmsParams.maxNativeZoom = config.wms.maxNativeZoom;
        }

        try {
          // Leaflet WMS layers are implemented as TileLayer with extra methods.
          // Detect existing WMS-capable layer by presence of setParams.
          if (existingLayer && typeof (existingLayer as any).setParams === 'function') {
            const el = existingLayer as any;
            el.setOpacity(wmsParams.opacity ?? 1);
            const params: any = {
              layers: layerName,
              styles: config.wms.style ?? '',
              format: config.wms.format ?? 'image/png',
              transparent: config.wms.transparent ?? true,
            };
            if (config.wms.timeEnabled) {
              params.time = selectedDate;
            }
            el.setParams(params);
            if (config.zIndex) {
              el.setZIndex(config.zIndex);
            }
            return;
          }

          const wmsLayer = L.tileLayer.wms(config.wms.baseUrl, wmsParams);
          if (config.zIndex) {
            wmsLayer.setZIndex(config.zIndex);
          }
          wmsLayer.addTo(map);
          layersRef.current[layerKey] = wmsLayer;
        } catch (err) {
          console.error(`Failed to create WMS layer ${layerKey}:`, err);
        }
      } else if (config.type === 'xyz' && config.xyz) {
        const xyzOptions: L.TileLayerOptions = {
          opacity: config.defaultOpacity ?? 0.7,
          attribution: `© ${config.provider}`,
          minZoom: config.xyz.minZoom,
          maxZoom: config.xyz.maxZoom,
          crossOrigin: true,
        };

        if (existingLayer && existingLayer instanceof L.TileLayer) {
          const el = existingLayer as any;
          el.setUrl(config.xyz.url);
          el.setOpacity(xyzOptions.opacity ?? 1);
          if (config.zIndex) {
            el.setZIndex(config.zIndex);
          }
          return;
        }

        const xyzLayer = L.tileLayer(config.xyz.url, xyzOptions);
        if (config.zIndex) {
          xyzLayer.setZIndex(config.zIndex);
        }
        xyzLayer.addTo(map);
        layersRef.current[layerKey] = xyzLayer;
      }
    });
  }, [activeLayers, selectedDate, selectedCity]);

  return <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden shadow-lg z-[10]" />;
};

export default MapView;
