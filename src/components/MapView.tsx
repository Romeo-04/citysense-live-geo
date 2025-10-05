import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { buildGIBSTileURL, GIBS_LAYERS, resolveGIBSTileURL } from "@/lib/nasa-api";
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

    let resizeObserver: ResizeObserver | undefined;

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          map.invalidateSize();
        });
      });

      resizeObserver.observe(mapRef.current);
    }

    map.whenReady(() => {
      map.invalidateSize();
    });

    return () => {
      resizeObserver?.disconnect();
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

    // insights/pins removed

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
          // Resolve a capability-backed tile URL (may fetch capabilities once and cache)
          resolveGIBSTileURL(config.gibsLayerKey, selectedDate)
            .then(tileUrl => {
              // Log the resolved URL for debugging (Leaflet will substitute {z}/{x}/{y})
              console.debug(`GIBS resolved URL for ${config.gibsLayerKey}:`, tileUrl);
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
                existingLayer.setUrl(tileUrl);
                existingLayer.setOpacity(layerOptions.opacity ?? 1);
                if (config.zIndex) {
                  existingLayer.setZIndex(config.zIndex);
                }
                return;
              }

              const gibsLayer = L.tileLayer(tileUrl, layerOptions);
              if (config.zIndex) {
                gibsLayer.setZIndex(config.zIndex);
              }
              gibsLayer.addTo(map);
              layersRef.current[layerKey] = gibsLayer;
            })
            .catch(error => {
              console.error(`Failed to resolve/load GIBS layer ${layerKey}:`, error);
            });
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

        if (existingLayer && existingLayer instanceof L.TileLayer.WMS) {
          existingLayer.setOpacity(wmsParams.opacity ?? 1);
          const params: L.WMSParams = {
            layers: layerName,
            styles: config.wms.style ?? '',
            format: config.wms.format ?? 'image/png',
            transparent: config.wms.transparent ?? true,
          };
          if (config.wms.timeEnabled) {
            (params as any).time = selectedDate;
          }
          existingLayer.setParams(params);
          if (config.zIndex) {
            existingLayer.setZIndex(config.zIndex);
          }
          return;
        }

        const wmsLayer = L.tileLayer.wms(config.wms.baseUrl, wmsParams);
        if (config.zIndex) {
          wmsLayer.setZIndex(config.zIndex);
        }
        wmsLayer.addTo(map);
        layersRef.current[layerKey] = wmsLayer;
      } else if (config.type === 'xyz' && config.xyz) {
        const xyzOptions: L.TileLayerOptions = {
          opacity: config.defaultOpacity ?? 0.7,
          attribution: `© ${config.provider}`,
          minZoom: config.xyz.minZoom,
          maxZoom: config.xyz.maxZoom,
          crossOrigin: true,
        };

        if (existingLayer && existingLayer instanceof L.TileLayer) {
          existingLayer.setUrl(config.xyz.url);
          existingLayer.setOpacity(xyzOptions.opacity ?? 1);
          if (config.zIndex) {
            existingLayer.setZIndex(config.zIndex);
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

  return <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden shadow-lg" />;
};

export default MapView;
