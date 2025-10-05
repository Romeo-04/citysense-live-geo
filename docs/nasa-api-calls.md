# NASA Data Access Cheat Sheet

This document lists the primary NASA-specific API calls required to fetch datasets that power the CitySense Live Geo application. For a full multi-agency catalog (NASA, SEDAC, GHSL, WorldPop, Copernicus, Resource Watch, CSA, INDE, INPE), see [`docs/data-api-catalog.md`](./data-api-catalog.md).
This document lists the primary API calls required to fetch NASA datasets that power the CitySense Live Geo application. Copy and paste the snippets below into your terminal or client of choice and adjust the parameters (layer names, dates, bounding boxes) for your needs.

## 1. NASA GIBS — WMTS (daily tiles, no auth required)

Get a MODIS land surface temperature (LST) tile for a specific day using EPSG:4326 courtesy syntax:

```
https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MOD11A1_LST_Day_1km/default/2025-10-03/250m/8/xx/yy.png
```

For Leaflet, configure a WMTS tile layer like so:

```ts
L.tileLayer(
  'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/{layer}/default/{time}/250m/{z}/{y}/{x}.png',
  { layer: 'MOD11A1_LST_Day_1km', time: '2025-10-03', tileSize: 256, noWrap: true, attribution: 'NASA GIBS' }
).addTo(map);
```

> Tip: Call `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/1.0.0/WMTSCapabilities.xml` to enumerate available layers and timestamps. For WMS requests append a `TIME` parameter.

## 2. NASA Earthdata Login — obtain a user token

Mint a user token (required for authenticated endpoints such as SEDAC downloads) by calling the Earthdata Login API with HTTP basic auth. Never store raw passwords in code—use environment variables or a secure secret store.

```bash
curl -u "$EDL_USERNAME:$EDL_PASSWORD" -X POST https://urs.earthdata.nasa.gov/api/users/tokens
```

Then call protected endpoints with the bearer token that is returned:

```
Authorization: Bearer <USER_TOKEN>
```

### Automating token minting (recommended)

Run the helper script provided in this repository to mint a token directly from your terminal. The script prompts for your Earthdata credentials (or reads them from `NASA_EARTHDATA_USERNAME` / `NASA_EARTHDATA_PASSWORD` environment variables), requests a token from NASA, and can optionally persist the token to `.env.local` so it never touches source control:

```bash
npm run fetch:earthdata-token -- --save
```

Omit `--save` if you prefer to handle the token manually. The resulting token is stored in `.env.local` as `VITE_NASA_EARTHDATA_TOKEN`, which the frontend helpers read at runtime.

## 3. SEDAC — WMS map example (Population Exposure)

```bash
curl "https://sedac.ciesin.columbia.edu/geoserver/wms?service=WMS&version=1.3.0&request=GetMap&layers=gpw-v4:gpw-v4-population-density_2020&bbox=...&crs=EPSG:4326&width=1024&height=512&styles=&format=image/png"
```

`GetCapabilities` documents may move as SEDAC migrates infrastructure—always check the latest endpoint to confirm layer names.

## 4. Application configuration

Set the NASA Earthdata bearer token used by the frontend helpers in a Vite environment variable (e.g. `.env.local`):

```
VITE_NASA_EARTHDATA_TOKEN=YOUR_TOKEN_HERE
```

The `src/lib/sedac-api.ts` helpers will read this value or accept an override when you invoke them from other modules.

## 5. Hooking a NASA layer into the toggle panel

The layer toggles shown in `ControlPanel` are generated from `src/lib/layer-catalog.ts`, which in turn references the NASA-specific metadata defined in `src/lib/nasa-api.ts`. To add a new NASA GIBS layer that users can toggle on and off:

1. **Register the GIBS layer key and metadata.** Update `src/lib/nasa-api.ts` with a new entry under `GIBS_LAYERS` so the app knows how to build the tile URL (product ID, projection, zoom range, cadence, etc.).

   ```ts
   // src/lib/nasa-api.ts
   export const GIBS_LAYERS: Record<string, GIBSLayerConfig> = {
     // ...existing layers...
     fires: {
       product: 'FIRMS_VIIRS_SNPP_Night',
       projection: 'EPSG:3857',
       tileMatrixSet: 'GoogleMapsCompatible_Level8',
       format: 'png',
       minZoom: 2,
       maxZoom: 11,
       maxNativeZoom: 8,
       description: 'Near real-time VIIRS fire and thermal anomalies',
       cadence: 'daily'
     }
   };
   ```

   > Tip: copy the exact `product`, `tileMatrixSet`, and `format` values from the GIBS [GetCapabilities](https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml) document to avoid 404s.

2. **Expose the layer in the catalog.** Add a matching entry to `src/lib/layer-catalog.ts` so it appears in the toggle list. Reference the `gibsLayerKey` you just registered.

   ```ts
   // src/lib/layer-catalog.ts
   export const LAYER_CATALOG: Record<string, MapLayerConfig> = {
     // ...existing layers...
     fires: {
       id: 'fires',
       name: 'Thermal Anomalies (FIRMS)',
       shortName: 'Fires',
       category: 'Heat & Greenspace',
       provider: 'NASA GIBS (VIIRS FIRMS)',
       description: 'Near real-time fire detections from VIIRS aboard Suomi NPP.',
       defaultOpacity: 0.7,
       zIndex: 460,
       type: 'nasa-gibs',
       gibsLayerKey: 'fires'
     }
   };
   ```

3. **(Optional) enable it by default.** Update the `activeLayers` initializer in `src/pages/Index.tsx` if you want the new layer to be switched on when the app loads.

No extra UI work is needed—the control panel iterates `SORTED_LAYER_LIST`, so the new layer will immediately show up with a toggle. When the user enables it, `MapView` will call `buildGIBSTileURL` to fetch the correct NASA WMTS tiles for the selected date.
