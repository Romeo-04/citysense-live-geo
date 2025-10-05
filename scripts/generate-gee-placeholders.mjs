#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

let ee;
let OUTPUT_DIR;
let DEFAULT_BUFFER_KM;
let TARGET_DATE;
let PROJECT_ID;

const loadDependencies = async () => {
  let dotenv;
  try {
    ({ default: dotenv } = await import('dotenv'));
    dotenv.config();
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: false });
  } catch (error) {
    console.warn(
      '⚠️  Optional dependency "dotenv" not found. Environment variables will be read directly from the shell.',
    );
  }

  try {
    ({ default: ee } = await import('earthengine'));
  } catch (error) {
    throw new Error(
      'Missing dependency "earthengine". Install it with `npm install earthengine dotenv` before running this script.',
    );
  }
};

const CITIES = [
  { name: 'Metro Manila', lat: 14.5995, lon: 120.9842, iso: 'PHL' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, iso: 'JPN' },
  { name: 'New York', lat: 40.7128, lon: -74.006, iso: 'USA' },
  { name: 'London', lat: 51.5074, lon: -0.1278, iso: 'GBR' },
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333, iso: 'BRA' },
];

const kmToDegrees = km => km / 111.32;

const slugify = value =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const getImageDate = async image => {
  try {
    const formatted = await ee.Date(image.get('system:time_start')).format('YYYY-MM-dd').getInfo();
    return typeof formatted === 'string' ? formatted : null;
  } catch {
    return null;
  }
};

const describeHeat = value => {
  if (value >= 39) return 'Extreme surface heat – prioritize shading and cool roofs.';
  if (value >= 37) return 'Very hot block with dense hardscape.';
  if (value >= 35) return 'Warm micro-urban heat island.';
  return 'Moderate temperature cell.';
};

const describeNdvi = value => {
  if (value <= 0.2) return 'Sparse vegetation – focus greening investments here.';
  if (value <= 0.4) return 'Mixed land cover with limited canopy.';
  if (value >= 0.6) return 'Healthy vegetation signature.';
  return 'Stable vegetation cover.';
};

const describeRain = value => {
  if (value >= 180) return 'Severe 24h rainfall – expect flash flood risk.';
  if (value >= 120) return 'Intense rainfall concentration.';
  if (value >= 80) return 'High rainfall pocket to monitor.';
  return 'Light to moderate rainfall.';
};

const describeAOD = value => {
  if (value >= 1.2) return 'Very high aerosol loading – likely haze/PM hotspot.';
  if (value >= 0.8) return 'Elevated aerosol burden near transport corridors.';
  if (value >= 0.5) return 'Moderate aerosols – track emissions.';
  return 'Low aerosol optical depth.';
};

const describeNO2 = value => {
  if (value >= 350) return 'Extreme NO₂ – curb traffic and combustion sources urgently.';
  if (value >= 220) return 'High NO₂ – prioritize schools and hospitals nearby.';
  if (value >= 120) return 'Moderate NO₂ – monitor peak-hour patterns.';
  return 'Lower NO₂ background levels.';
};

const describeNight = value => {
  if (value >= 35) return 'Bright commercial/nightlife hub.';
  if (value >= 20) return 'Active mixed-use corridor.';
  if (value >= 10) return 'Moderate lighting – residential/industrial mix.';
  return 'Dim zone – primarily residential or natural.';
};

const describeFlood = value => {
  if (value >= 80) return 'Persistent surface water – high flood susceptibility.';
  if (value >= 60) return 'Frequent inundation signature.';
  if (value >= 40) return 'Occasional standing water.';
  return 'Limited surface water persistence.';
};

const describeBuilt = value => {
  if (value >= 80) return 'Dominant built-up footprint.';
  if (value >= 60) return 'Dense urban core.';
  if (value >= 40) return 'Emerging mixed-density area.';
  return 'Lower built-up coverage.';
};

const describePopulation = value => {
  if (value >= 35000) return 'Severely crowded – highest exposure risk.';
  if (value >= 25000) return 'Very dense households.';
  if (value >= 15000) return 'Dense neighborhoods needing services.';
  return 'Moderate population density.';
};

const layerDefinitions = {
  lst: {
    geometry: 'polygon',
    source: 'MODIS Terra LST (MOD11A1)',
    unit: '°C',
    scale: 1000,
    samplePixels: 120,
    cellSizeKm: 3.5,
    maxFeatures: 12,
    sort: 'desc',
    valuePrecision: 1,
    buildName: (value, index, city) => `${city.name} heat cell ${index + 1}`,
    fetchImage: ({ region, targetDate }) => {
      const start = ee.Date(targetDate).advance(-1, 'day');
      const end = ee.Date(targetDate).advance(1, 'day');
      const collection = ee
        .ImageCollection('MODIS/061/MOD11A1')
        .filterBounds(region)
        .filterDate(start, end)
        .select('LST_Day_1km')
        .map(image => image.multiply(0.02).subtract(273.15).rename('value'));
      return collection.sort('system:time_start', false).first();
    },
    describe: describeHeat,
  },
  ndvi: {
    geometry: 'polygon',
    source: 'MODIS NDVI (MOD13A1)',
    unit: 'NDVI',
    scale: 250,
    samplePixels: 150,
    cellSizeKm: 2,
    maxFeatures: 14,
    sort: 'asc',
    valuePrecision: 2,
    buildName: (_value, index, city) => `${city.name} greenspace gap ${index + 1}`,
    fetchImage: ({ region, targetDate }) => {
      const start = ee.Date(targetDate).advance(-16, 'day');
      const end = ee.Date(targetDate).advance(1, 'day');
      const collection = ee
        .ImageCollection('MODIS/061/MOD13A1')
        .filterBounds(region)
        .filterDate(start, end)
        .select('NDVI')
        .map(image => image.multiply(0.0001).rename('value'));
      return collection.sort('system:time_start', false).first();
    },
    describe: describeNdvi,
  },
  precipitation: {
    geometry: 'polygon',
    source: 'GPM IMERG 24h (V06)',
    unit: 'mm',
    scale: 5000,
    samplePixels: 90,
    cellSizeKm: 6,
    maxFeatures: 10,
    sort: 'desc',
    valuePrecision: 0,
    minValue: 10,
    buildName: (_value, index, city) => `${city.name} rainfall cell ${index + 1}`,
    fetchImage: ({ region, targetDate }) => {
      const start = ee.Date(targetDate).advance(-1, 'day');
      const end = ee.Date(targetDate).advance(1, 'day');
      const collection = ee
        .ImageCollection('NASA/GPM_L3/IMERG_V06')
        .filterBounds(region)
        .filterDate(start, end)
        .select('precipitationCal');
      const total = collection.sum().multiply(0.5).rename('value');
      return total.updateMask(total.gt(0.1));
    },
    describe: describeRain,
  },
  sedac_flood: {
    geometry: 'polygon',
    source: 'JRC Surface Water Occurrence',
    unit: '%',
    scale: 90,
    samplePixels: 160,
    cellSizeKm: 1.8,
    maxFeatures: 18,
    sort: 'desc',
    staticDate: '1984-2020',
    valuePrecision: 0,
    minValue: 15,
    buildName: (_value, index, city) => `${city.name} flood pocket ${index + 1}`,
    fetchImage: ({ region }) => {
      const image = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('occurrence').rename('value');
      return image.clip(region).updateMask(image.gt(10));
    },
    describe: describeFlood,
  },
  ghsl_built: {
    geometry: 'polygon',
    source: 'GHSL Built Surface (2018)',
    unit: '% built',
    scale: 100,
    samplePixels: 200,
    cellSizeKm: 1.5,
    maxFeatures: 18,
    sort: 'desc',
    staticDate: '2018',
    valuePrecision: 0,
    buildName: (_value, index, city) => `${city.name} built-up zone ${index + 1}`,
    fetchImage: ({ region }) => {
      const image = ee.Image('JRC/GHSL/P2016/BUILT_LDSMT_GLOBE_V1').select('built').rename('value');
      return image.clip(region);
    },
    describe: describeBuilt,
  },
  worldpop_population: {
    geometry: 'polygon',
    source: 'WorldPop UN-Adjusted 100m',
    unit: 'people/km²',
    scale: 100,
    samplePixels: 200,
    cellSizeKm: 1.2,
    maxFeatures: 18,
    sort: 'desc',
    staticDate: 'latest',
    valuePrecision: 0,
    minValue: 500,
    buildName: (_value, index, city) => `${city.name} population hotspot ${index + 1}`,
    fetchImage: ({ region, city }) => {
      if (!city.iso) {
        throw new Error(`City ${city.name} is missing ISO country code for WorldPop filtering.`);
      }
      const collection = ee
        .ImageCollection('WorldPop/GP/100m/pop')
        .filter(ee.Filter.eq('country', city.iso))
        .sort('system:time_start', false);
      const image = ee.Image(collection.first()).rename('value');
      return image.clip(region);
    },
    transformValue: raw => raw * 100,
    describe: describePopulation,
  },
  aod: {
    geometry: 'point',
    source: 'Sentinel-5P Aerosol Index',
    unit: 'index',
    scale: 10000,
    samplePixels: 60,
    sort: 'desc',
    valuePrecision: 2,
    minValue: 0.2,
    buildName: (_value, index, city) => `${city.name} aerosol plume ${index + 1}`,
    fetchImage: ({ region, targetDate }) => {
      const start = ee.Date(targetDate).advance(-1, 'day');
      const end = ee.Date(targetDate).advance(1, 'day');
      const collection = ee
        .ImageCollection('COPERNICUS/S5P/NRTI/L3_AER_AI')
        .filterBounds(region)
        .filterDate(start, end)
        .select('absorbing_aerosol_index')
        .map(image => image.rename('value'));
      return collection.sort('system:time_start', false).first();
    },
    maxFeatures: 18,
    describe: describeAOD,
  },
  no2: {
    geometry: 'point',
    source: 'Sentinel-5P NO₂',
    unit: 'µmol/m²',
    scale: 7000,
    samplePixels: 80,
    sort: 'desc',
    valuePrecision: 0,
    minValue: 40,
    buildName: (_value, index, city) => `${city.name} NO₂ cell ${index + 1}`,
    fetchImage: ({ region, targetDate }) => {
      const start = ee.Date(targetDate).advance(-1, 'day');
      const end = ee.Date(targetDate).advance(1, 'day');
      const collection = ee
        .ImageCollection('COPERNICUS/S5P/NRTI/L3_NO2')
        .filterBounds(region)
        .filterDate(start, end)
        .select('NO2_column_number_density')
        .map(image => image.rename('value'));
      return collection.sort('system:time_start', false).first();
    },
    transformValue: raw => raw * 1e6,
    describe: describeNO2,
  },
  nightlights: {
    geometry: 'point',
    source: 'VIIRS DNB Monthly',
    unit: 'nW/cm²/sr',
    scale: 500,
    samplePixels: 60,
    sort: 'desc',
    valuePrecision: 1,
    minValue: 1,
    buildName: (_value, index, city) => `${city.name} night light ${index + 1}`,
    fetchImage: ({ region, targetDate }) => {
      const date = ee.Date(targetDate);
      const monthStart = date.startOf('month');
      const monthEnd = monthStart.advance(1, 'month');
      let collection = ee
        .ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMCFG')
        .filterBounds(region)
        .filterDate(monthStart, monthEnd)
        .select('avg_rad');
      const count = collection.size();
      collection = ee.ImageCollection(ee.Algorithms.If(count.gt(0), collection, ee
        .ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMCFG')
        .filterBounds(region)
        .filterDate(monthStart.advance(-1, 'month'), monthStart)
        .select('avg_rad')));
      return ee.Image(collection.sort('system:time_start', false).first()).rename('value');
    },
    maxFeatures: 20,
    describe: describeNight,
  },
};

const loadCredentials = async () => {
  const keyPath = process.env.GEE_SERVICE_ACCOUNT_KEY_PATH;
  const keyJson = process.env.GEE_SERVICE_ACCOUNT_KEY;

  if (!keyPath && !keyJson) {
    throw new Error(
      'Google Earth Engine service account credentials are required. Set GEE_SERVICE_ACCOUNT_KEY_PATH or GEE_SERVICE_ACCOUNT_KEY.',
    );
  }

  if (keyJson) {
    return JSON.parse(keyJson);
  }

  const resolvedPath = path.resolve(keyPath);
  const raw = await fs.readFile(resolvedPath, 'utf-8');
  return JSON.parse(raw);
};

const authenticate = async credentials =>
  new Promise((resolve, reject) => {
    ee.data.authenticateViaPrivateKey(credentials, () => {
      ee.initialize(null, null, resolve, reject, PROJECT_ID);
    }, reject);
  });

const rectangleFromPoint = (coordinates, cellSizeKm) => {
  const [lon, lat] = coordinates;
  const halfDeg = kmToDegrees(cellSizeKm) / 2;
  const minLon = lon - halfDeg;
  const maxLon = lon + halfDeg;
  const minLat = lat - halfDeg;
  const maxLat = lat + halfDeg;

  const ring = [
    [minLon, minLat],
    [maxLon, minLat],
    [maxLon, maxLat],
    [minLon, maxLat],
    [minLon, minLat],
  ];

  return {
    type: 'Polygon',
    coordinates: [ring],
  };
};

const fetchFeatureCollection = async ({ image, definition, region, city }) => {
  const sample = image
    .sample({
      region,
      scale: definition.scale,
      numPixels: definition.samplePixels,
      seed: 42,
      geometries: true,
      tileScale: 4,
    })
    .filter(ee.Filter.notNull(['value']));

  const info = await sample.getInfo();
  return (info?.features ?? []).map((feature, index) => {
    const coordinates = feature?.geometry?.coordinates;
    const rawValue = feature?.properties?.value;
    if (!coordinates || rawValue === undefined || rawValue === null) {
      return null;
    }

    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) {
      return null;
    }

    const transformedValue = definition.transformValue
      ? definition.transformValue(numericValue, city)
      : numericValue;

    if (definition.minValue !== undefined && transformedValue < definition.minValue) {
      return null;
    }

    const precision = definition.valuePrecision ?? 2;
    const value = Number(transformedValue.toFixed(precision));
    const narrative = definition.describe ? definition.describe(value) : undefined;

    const geometry = definition.geometry === 'polygon'
      ? rectangleFromPoint(coordinates, definition.cellSizeKm ?? 2)
      : { type: 'Point', coordinates };

    return {
      type: 'Feature',
      geometry,
      properties: {
        name: `${city.name} hotspot ${index + 1}`,
        value,
        unit: definition.unit,
        narrative,
      },
    };
  }).filter(Boolean);
};

const enrichProperties = (features, definition, city, sourceDate) =>
  features.map((feature, index) => {
    const value = feature.properties.value;
    const label = definition.buildName
      ? definition.buildName(value, index, city)
      : feature.properties.name || `${city.name} area ${index + 1}`;

    return {
      ...feature,
      properties: {
        ...feature.properties,
        name: label,
        source: definition.source,
        sourceDate,
      },
    };
  });

const sortFeatures = (features, definition) => {
  const sorted = [...features].sort((a, b) => {
    const aValue = a.properties.value ?? 0;
    const bValue = b.properties.value ?? 0;
    return definition.sort === 'asc' ? aValue - bValue : bValue - aValue;
  });
  if (!definition.maxFeatures) return sorted;
  return sorted.slice(0, definition.maxFeatures);
};

const exportGeoJSON = async ({ city, layerId, features, sourceDate, definition }) => {
  const slug = slugify(city.name);
  const collection = {
    type: 'FeatureCollection',
    features,
    metadata: {
      city: city.name,
      layer: layerId,
      sourceDate,
      generatedAt: new Date().toISOString(),
      source: definition.source,
    },
  };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const datedFile = path.join(OUTPUT_DIR, `${slug}-${layerId}-${sourceDate || 'latest'}.geojson`);
  const latestFile = path.join(OUTPUT_DIR, `${slug}-${layerId}-latest.geojson`);

  const serialized = JSON.stringify(collection, null, 2);
  await fs.writeFile(datedFile, serialized);
  await fs.writeFile(latestFile, serialized);
};

const processLayer = async ({ city, layerId, definition, region, targetDate }) => {
  const image = definition.fetchImage({ region, targetDate, city });

  if (!image) {
    console.warn(`No image returned for ${layerId} in ${city.name}`);
    return;
  }

  const computedDate = await getImageDate(image);
  const sourceDate = definition.staticDate || computedDate || TARGET_DATE;

  const features = await fetchFeatureCollection({ image, definition, region, city });

  if (!features.length) {
    console.warn(`No features sampled for ${layerId} in ${city.name}`);
    return;
  }

  const enriched = enrichProperties(features, definition, city, sourceDate);
  const sorted = sortFeatures(enriched, definition);
  await exportGeoJSON({ city, layerId, features: sorted, sourceDate, definition });

  console.log(`✔ Generated ${sorted.length} features for ${layerId} (${city.name}) from ${definition.source}`);
};

const main = async () => {
  try {
    await loadDependencies();

    OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'demo', 'gee');
    DEFAULT_BUFFER_KM = Number(process.env.GEE_CITY_BUFFER_KM ?? '40');
    TARGET_DATE = process.env.GEE_TARGET_DATE ?? new Date().toISOString().slice(0, 10);
    PROJECT_ID = process.env.GEE_PROJECT_ID || undefined;

    const credentials = await loadCredentials();
    await authenticate(credentials);
    console.log('Authenticated with Google Earth Engine.');

    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    for (const city of CITIES) {
      const bufferKm = city.bufferKm ?? DEFAULT_BUFFER_KM;
      const region = ee.Geometry.Point([city.lon, city.lat]).buffer(bufferKm * 1000).bounds();

      console.log(`\n→ Processing ${city.name} (buffer ${bufferKm} km, target ${TARGET_DATE})`);

      for (const [layerId, definition] of Object.entries(layerDefinitions)) {
        try {
          await processLayer({ city, layerId, definition, region, targetDate: TARGET_DATE });
        } catch (error) {
          console.error(`Failed to build ${layerId} placeholder for ${city.name}:`, error);
        }
      }
    }

    console.log('\nAll demo layers generated. Files are in public/demo/gee');
  } catch (error) {
    console.error('Failed to generate Google Earth Engine demo overlays:', error);
    process.exitCode = 1;
  }
};

await main();
