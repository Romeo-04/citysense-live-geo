import { GIBS_LAYERS } from './nasa-api';

export type LayerProvider = 'nasa-gibs' | 'wms' | 'xyz';

export interface MapLayerConfig {
  id: string;
  name: string;
  shortName: string;
  category:
    | 'Heat & Greenspace'
    | 'Air & Mobility'
    | 'Water & Flood'
    | 'Urbanization & Equity';
  provider: string;
  description: string;
  defaultOpacity?: number;
  zIndex?: number;
  type: LayerProvider;
  /** Key that maps to NASA GIBS layer metadata */
  gibsLayerKey?: keyof typeof GIBS_LAYERS;
  /** WMS configuration for non-NASA services */
  wms?: {
    baseUrl: string;
    layerName: string;
    style?: string;
    format?: string;
    transparent?: boolean;
    timeEnabled?: boolean;
    minZoom?: number;
    maxZoom?: number;
    maxNativeZoom?: number;
  };
  /** XYZ tile configuration (e.g., Resource Watch) */
  xyz?: {
    url: string;
    minZoom?: number;
    maxZoom?: number;
  };
}

export const LAYER_CATALOG: Record<string, MapLayerConfig> = {
  lst: {
    id: 'lst',
    name: 'Land Surface Temperature',
    shortName: 'LST',
    category: 'Heat & Greenspace',
    provider: 'NASA GIBS (MOD11A1)',
    description: 'Daily daytime land surface temperature derived from MODIS Terra (1 km).',
    defaultOpacity: 0.75,
    zIndex: 400,
    type: 'nasa-gibs',
    gibsLayerKey: 'lst'
  },
  ndvi: {
    id: 'ndvi',
    name: 'Vegetation Index (NDVI)',
    shortName: 'NDVI',
    category: 'Heat & Greenspace',
    provider: 'NASA GIBS (MOD13A1)',
    description: '8-day MODIS NDVI composite (1 km) for vegetation vigor assessment.',
    defaultOpacity: 0.65,
    zIndex: 410,
    type: 'nasa-gibs',
    gibsLayerKey: 'ndvi'
  },
  precipitation: {
    id: 'precipitation',
    name: 'Precipitation (IMERG)',
    shortName: 'IMERG',
    category: 'Water & Flood',
    provider: 'NASA GIBS (GPM IMERG)',
    description: 'Half-hourly GPM IMERG precipitation estimate for near-real-time rainfall.',
    defaultOpacity: 0.65,
    zIndex: 420,
    type: 'nasa-gibs',
    gibsLayerKey: 'precipitation'
  },
  aod: {
    id: 'aod',
    name: 'Aerosol Optical Depth',
    shortName: 'AOD',
    category: 'Air & Mobility',
    provider: 'NASA GIBS (MAIAC)',
    description: 'Daily aerosol optical depth from MODIS MAIAC as a proxy for particulate pollution.',
    defaultOpacity: 0.7,
    zIndex: 430,
    type: 'nasa-gibs',
    gibsLayerKey: 'aod'
  },
  no2: {
    id: 'no2',
    name: 'NO₂ Tropospheric Column',
    shortName: 'NO₂',
    category: 'Air & Mobility',
    provider: 'NASA GIBS (OMI)',
    description: 'Daily tropospheric nitrogen dioxide concentrations from the Aura OMI sensor.',
    defaultOpacity: 0.7,
    zIndex: 440,
    type: 'nasa-gibs',
    gibsLayerKey: 'no2'
  },
  nightlights: {
    id: 'nightlights',
    name: 'Night Lights (VIIRS)',
    shortName: 'Night Lights',
    category: 'Urbanization & Equity',
    provider: 'NASA GIBS (VIIRS DNB)',
    description: 'Nighttime light emissions from VIIRS Day/Night Band as an urbanization proxy.',
    defaultOpacity: 0.6,
    zIndex: 450,
    type: 'nasa-gibs',
    gibsLayerKey: 'nightlights'
  },
  sedac_flood: {
    id: 'sedac_flood',
    name: 'Flood Hazard Frequency',
    shortName: 'Flood Hazard',
    category: 'Water & Flood',
    provider: 'NASA SEDAC',
    description: 'Global flood hazard frequency (return period) from SEDAC Natural Disaster Hotspots.',
    defaultOpacity: 0.55,
    zIndex: 460,
    type: 'wms',
    wms: {
      baseUrl: 'https://sedac.ciesin.columbia.edu/geoserver/wms',
      layerName: 'ndh:ndh-flood-hazard-frequency-distribution',
      style: 'default',
      format: 'image/png',
      transparent: true,
      minZoom: 0,
      maxZoom: 12,
      maxNativeZoom: 10
    }
  },
  ghsl_built: {
    id: 'ghsl_built',
    name: 'Built-up Surface (GHSL)',
    shortName: 'Built-up',
    category: 'Urbanization & Equity',
    provider: 'JRC GHSL',
    description: 'European Commission Global Human Settlement Layer built-up surface (2018).',
    defaultOpacity: 0.65,
    zIndex: 470,
    type: 'wms',
    wms: {
      baseUrl: 'https://ghsl.jrc.ec.europa.eu/ghs_wms',
      layerName: 'GHS_BUILT_S_E2018_GLOBE_R2019A',
      format: 'image/png',
      transparent: true,
      minZoom: 0,
      maxZoom: 13,
      maxNativeZoom: 12
    }
  },
  worldpop_population: {
    id: 'worldpop_population',
    name: 'Population Density (WorldPop)',
    shortName: 'Population',
    category: 'Urbanization & Equity',
    provider: 'WorldPop',
    description: 'WorldPop 1 km population density (latest national mosaic).',
    defaultOpacity: 0.6,
    zIndex: 480,
    type: 'wms',
    wms: {
      baseUrl: 'https://sdi.worldpop.org/geoserver/worldpop/wms',
      layerName: 'worldpop:ppp_2020_1km_Aggregated',
      format: 'image/png',
      transparent: true,
      minZoom: 0,
      maxZoom: 12,
      maxNativeZoom: 10
    }
  }
};

export const SORTED_LAYER_LIST = Object.values(LAYER_CATALOG).sort((a, b) => {
  if (a.category === b.category) {
    return a.name.localeCompare(b.name);
  }
  return a.category.localeCompare(b.category);
});
