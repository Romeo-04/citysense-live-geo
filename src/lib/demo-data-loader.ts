import type { FeatureCollection } from "geojson";
import { buildSyntheticDemoGeoJSON, type DemoContext } from "./demo-data";

const requestCache = new Map<string, Promise<FeatureCollection | null>>();
const resultCache = new Map<string, FeatureCollection | null>();
const loggedMissingFiles = new Set<string>();

const basePath = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const tryFetchGeoJSON = async (url: string): Promise<FeatureCollection | null> => {
  try {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) {
      if (response.status !== 404 && !loggedMissingFiles.has(url)) {
        console.warn(`Failed to load GEE demo data from ${url}: ${response.status} ${response.statusText}`);
        loggedMissingFiles.add(url);
      }
      return null;
    }
    const json = (await response.json()) as FeatureCollection;
    return json;
  } catch (error) {
    if (!loggedMissingFiles.has(url)) {
      console.warn(`Error fetching GEE demo data from ${url}:`, error);
      loggedMissingFiles.add(url);
    }
    return null;
  }
};

export const loadDemoGeoJSON = (
  layerKey: string,
  city: string,
  selectedDate: string,
  context: DemoContext,
): Promise<FeatureCollection | null> => {
  const cacheKey = `${layerKey}|${city}|${selectedDate}|${context.lat.toFixed(3)}|${context.lon.toFixed(3)}`;

  if (!requestCache.has(cacheKey)) {
    const request = (async () => {
      if (resultCache.has(cacheKey)) {
        return resultCache.get(cacheKey) ?? null;
      }

      const slug = slugify(city || "city");
      const sanitizedDate = selectedDate?.split("T")[0] ?? "";
      const candidates = [
        sanitizedDate ? `${slug}-${layerKey}-${sanitizedDate}.geojson` : null,
        `${slug}-${layerKey}-latest.geojson`,
        `${slug}-${layerKey}.geojson`,
      ].filter(Boolean) as string[];

      for (const candidate of candidates) {
        const url = `${basePath}/demo/gee/${candidate}`;
        const geojson = await tryFetchGeoJSON(url);
        if (geojson) {
          resultCache.set(cacheKey, geojson);
          return geojson;
        }
      }

      const fallback = buildSyntheticDemoGeoJSON(layerKey, context);
      resultCache.set(cacheKey, fallback);
      return fallback;
    })();

    requestCache.set(cacheKey, request);
  }

  return requestCache.get(cacheKey)!;
};

export const clearDemoGeoJSONCache = () => {
  requestCache.clear();
  resultCache.clear();
  loggedMissingFiles.clear();
};
