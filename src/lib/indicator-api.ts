import { getCityCountryISO } from "./worldpop-api";
import { CITY_COORD_LOOKUP } from "./cities";
import { LAYER_CATALOG } from "./layer-catalog";

// Generic function to perform a GetFeatureInfo request
async function getFeatureInfo(
  baseUrl: string,
  layerName: string,
  coords: { lat: number; lon: number },
  bbox: string,
  width: number = 1024,
  height: number = 1024
) {
  const params = new URLSearchParams({
    service: "WMS",
    version: "1.1.1",
    request: "GetFeatureInfo",
    layers: layerName,
    query_layers: layerName,
    styles: "",
    bbox: bbox,
    feature_count: "1",
    height: height.toString(),
    width: width.toString(),
    format: "application/json",
    srs: "EPSG:4326",
    x: (width / 2).toString(),
    y: (height / 2).toString(),
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`GetFeatureInfo request failed: ${response.statusText}`);
    }
    const data = await response.json();
    // The value is often in properties.GRAY_INDEX or similar
    return data.features?.[0]?.properties ?? null;
  } catch (error) {
    console.error(`Error fetching feature info for ${layerName}:`, error);
    return null;
  }
}

// BBOX calculation utility
function getBbox(coords: { lat: number; lon: number }, buffer = 0.05) {
  return [
    coords.lon - buffer,
    coords.lat - buffer,
    coords.lon + buffer,
    coords.lat + buffer,
  ].join(",");
}

export async function fetchPopulationDensity(city: string) {
  const coords = CITY_COORD_LOOKUP[city] ?? CITY_COORD_LOOKUP["Metro Manila"];
  if (!coords) return null;
  const iso = getCityCountryISO(city);
  const layerConfig = LAYER_CATALOG["worldpop_population"];
  if (!layerConfig.wms) return null;

  const layerName = `worldpop:ppp_2020_${iso}_1km_Aggregated`;
  const data = await getFeatureInfo(
    layerConfig.wms.baseUrl,
    layerName,
    coords,
    getBbox(coords)
  );
  return data ? Math.round(data.GRAY_INDEX) : null;
}

export async function fetchBuiltUpSurface(city: string) {
  const coords = CITY_COORD_LOOKUP[city] ?? CITY_COORD_LOOKUP["Metro Manila"];
  if (!coords) return null;
  const layerConfig = LAYER_CATALOG["ghsl_built"];
  if (!layerConfig.wms) return null;

  const data = await getFeatureInfo(
    layerConfig.wms.baseUrl,
    layerConfig.wms.layerName,
    coords,
    getBbox(coords)
  );
  // GHSL returns a value from 0-100
  return data ? Math.round(data.GRAY_INDEX) : null;
}

export async function fetchFloodHazard(city: string) {
  const coords = CITY_COORD_LOOKUP[city] ?? CITY_COORD_LOOKUP["Metro Manila"];
  if (!coords) return null;
  const layerConfig = LAYER_CATALOG["sedac_flood"];
  if (!layerConfig.wms) return null;

  const data = await getFeatureInfo(
    layerConfig.wms.baseUrl,
    layerConfig.wms.layerName,
    coords,
    getBbox(coords)
  );
  // SEDAC flood hazard returns a value from 1-10
  return data ? data.GRAY_INDEX : null;
}

// NOTE: GIBS does not support GetFeatureInfo in application/json format.
// This is a placeholder for where you would parse XML or use a different service.
// For now, these will return null.

export async function fetchLST(city: string, date: string) {
  console.log(city, date); // Keep params to avoid lint errors
  return null; // GIBS JSON GetFeatureInfo not supported
}

export async function fetchNDVI(city: string, date: string) {
  console.log(city, date); // Keep params to avoid lint errors
  return null; // GIBS JSON GetFeatureInfo not supported
}

export async function fetchAOD(city: string, date: string) {
  console.log(city, date); // Keep params to avoid lint errors
  return null; // GIBS JSON GetFeatureInfo not supported
}

export async function fetchNO2(city: string, date: string) {
  console.log(city, date); // Keep params to avoid lint errors
  return null; // GIBS JSON GetFeatureInfo not supported
}
