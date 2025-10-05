# NASA Data Access Cheat Sheet

This document lists the primary NASA-specific API calls required to fetch datasets that power the CitySense Live Geo application. For a full multi-agency catalog (NASA, SEDAC, GHSL, WorldPop, Copernicus, Resource Watch, CSA, INDE, INPE), see [`docs/data-api-catalog.md`](./data-api-catalog.md).

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
