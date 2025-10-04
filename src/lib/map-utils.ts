export interface TileCoordinate {
  x: number;
  y: number;
}

/**
 * Convert latitude/longitude to WMTS tile coordinates using Web Mercator tiling.
 * Compatible with GoogleMapsCompatible tile matrix sets exposed by NASA GIBS.
 */
export function latLonToTile(lat: number, lon: number, zoom: number): TileCoordinate {
  const latRad = (lat * Math.PI) / 180;
  const n = 2 ** zoom;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export function buildBoundingBox(
  lat: number,
  lon: number,
  bufferDegrees: number
): BoundingBox {
  return {
    west: lon - bufferDegrees,
    south: lat - bufferDegrees,
    east: lon + bufferDegrees,
    north: lat + bufferDegrees,
  };
}

export function formatBoundingBox(bbox: BoundingBox, precision = 3): string {
  const { west, south, east, north } = bbox;
  return [west, south, east, north]
    .map((value) => value.toFixed(precision))
    .join(",");
}

export function polygonFromBoundingBox(bbox: BoundingBox, precision = 3): string {
  const { west, south, east, north } = bbox;
  const format = (value: number) => value.toFixed(precision);
  const points = [
    `${format(west)} ${format(north)}`,
    `${format(east)} ${format(north)}`,
    `${format(east)} ${format(south)}`,
    `${format(west)} ${format(south)}`,
    `${format(west)} ${format(north)}`,
  ];
  return `POLYGON((${points.join(',')}))`;
}
