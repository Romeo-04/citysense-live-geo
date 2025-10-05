# CitySense Live Geo

CitySense is a geospatial intelligence cockpit for urban planners who need live Earth observation feeds to shape climate-resilient policies. The app streams NASA, WorldPop, GHSL, and SEDAC layers into a single Leaflet map, allows rapid layer toggling by theme, and surfaces headline indicators for heat, greenspace, water, and equity.

## Features

- 🔥 **Heat & Greenspace:** MODIS land surface temperature and NDVI (NASA GIBS) with daily/8-day cadence.
- 🌧️ **Water & Flood:** GPM IMERG precipitation and SEDAC flood hazard WMS overlays for rapid situational awareness.
- 🌫️ **Air & Mobility:** MAIAC aerosol optical depth and Aura OMI NO₂ tiles for pollution tracking.
- 🌆 **Urbanization & Equity:** JRC GHSL built-up surfaces and WorldPop population density to highlight exposure hotspots.
- 🗺️ **Live WMTS/WMS integration:** Layer catalog centralizes NASA GIBS, SEDAC, GHSL, and WorldPop endpoints with correct projections and metadata.
- 🔐 **Token management:** Scripted helper to mint NASA Earthdata tokens and optional front-end usage for authenticated downloads.
- 🔗 **Copy-ready API callouts:** In-app panel surfaces city-aware NASA, SEDAC, GHSL, WorldPop, Resource Watch, and Copernicus requests so you can validate responses outside the map.
- 🧪 **Hackathon demo overlays:** Generated placeholder hotspots light up every theme so you can demo the experience without waiting for live WMTS/WMS tiles.

## Getting started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
npm run dev
```

The development server starts on `http://localhost:5173` with hot reload.

> ⚠️ If you build the app (`npm run build`), serve the `dist/` folder with `npm run preview` or any static web server. Opening
> `dist/index.html` directly from the filesystem prevents the bundled GeoJSON demo layers from loading, so the map will appear
> blank even when layers are toggled on.

When the app loads you'll see Metro Manila with daily LST, NDVI, IMERG precipitation, GHSL, and WorldPop layers already toggled. Scroll the left panel to "Live API callouts" to copy the exact requests the map issues—handy for debugging or scripting bulk downloads.

### Demo overlays for presentations

Need a quick pitch-ready walkthrough? Toggle any layer in the control panel and CitySense will render locally generated polygons/points that mimic typical urban heat, vegetation, flood, air quality, and equity hotspots around the selected city center. The placeholders stay in sync with the active layers so the map never appears empty during a demo, even if a remote feed is unavailable. We ship pre-baked GeoJSON samples for Metro Manila under `public/demo/gee/`, so the experience works out of the box—no additional scripts required for the default city.

#### Upgrade the demo with Google Earth Engine snapshots

For hackathons or briefings where you want data-grounded stories without waiting on every live tile, you can pre-seed the demo layers using Google Earth Engine (GEE):

> 💡 The generator relies on the optional `earthengine` and `dotenv` packages. Install them once with `npm install --save-dev earthengine dotenv` (or keep them globally) before running the command below.

1. [Create a GEE service account](https://developers.google.com/earth-engine/cloud/account_manager) (or reuse an existing project) and download a JSON key with Earth Engine access enabled.
2. Expose the credentials to the script via environment variables (shell exports or `.env.local`):

   ```bash
   GEE_SERVICE_ACCOUNT_KEY_PATH=/path/to/gee-key.json \
   GEE_PROJECT_ID=my-ee-project-id \
   GEE_TARGET_DATE=2025-01-03 \
   npm run generate:gee-demo
   ```

   Supported variables:

   - `GEE_SERVICE_ACCOUNT_KEY_PATH` (or `GEE_SERVICE_ACCOUNT_KEY` with the raw JSON string) – required.
   - `GEE_PROJECT_ID` – optional override if your Earth Engine project differs from the service account default.
   - `GEE_TARGET_DATE` – ISO date (`YYYY-MM-DD`) that anchors time-sensitive layers (LST, NDVI, IMERG, Sentinel-5P, VIIRS). Defaults to today.
   - `GEE_CITY_BUFFER_KM` – optional buffer radius (km) around each city center. Defaults to `40`.

3. The script writes GeoJSON features to `public/demo/gee/`. When the Vite dev server restarts, the map will automatically pull those GEE-derived overlays (falling back to synthetic rectangles/points if a file is missing).

Each generated feature includes value, units, source metadata, and a short narrative so the popups clearly state which dataset and acquisition date they represent.

### Environment variables

Create a `.env.local` (gitignored) if you plan to hit authenticated NASA endpoints (e.g., SEDAC downloads):

```bash
VITE_NASA_EARTHDATA_TOKEN=<your_token>
```

Generate the token from NASA Earthdata Login using the bundled helper:

```bash
npm run fetch:earthdata-token -- --save
```

This prompts for your NASA credentials (or reads `NASA_EARTHDATA_USERNAME`/`NASA_EARTHDATA_PASSWORD`) and stores a short-lived bearer token in `.env.local`.

## Data services cheat sheet

| Theme | Layer | Service | Notes |
| --- | --- | --- | --- |
| Heat | `MOD11A1_LST_Day_1km` | NASA GIBS WMTS | Daily daytime LST in EPSG:3857 (`GoogleMapsCompatible_Level9`). |
| Greenspace | `MOD13A1_NDVI_1km` | NASA GIBS WMTS | 8-day NDVI composites. |
| Air | `MODIS_Combined_Value_Added_AOD` | NASA GIBS WMTS | MAIAC aerosol optical depth. |
| Air | `OMI_Nitrogen_Dioxide_Tropo_Column_L3` | NASA GIBS WMTS | Tropospheric NO₂. |
| Water | `GPM_3IMERGHH_06_precipitation` | NASA GIBS WMTS | Half-hourly IMERG precipitation. |
| Water | `ndh:ndh-flood-hazard-frequency-distribution` | SEDAC WMS | Global flood hazard frequency; token optional for preview. |
| Urbanization | `GHS_BUILT_S_E2018_GLOBE_R2019A` | GHSL WMS | Built-up surface (2018 release). |
| Population | `worldpop:ppp_2020_1km_Aggregated` | WorldPop WMS | 1 km national population mosaics. |

Full copy-and-paste API calls—including NASA Earthdata token minting, Copernicus OData queries, WorldPop downloads, and Resource Watch SQL—are documented in [`docs/data-api-catalog.md`](docs/data-api-catalog.md).

When using the Earth Engine generator, the same `.env.local` file can hold the `GEE_*` variables listed above.

## Project scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Type-check and bundle for production. |
| `npm run preview` | Serve the production build locally (required to see demo overlays in `dist/`). |
| `npm run lint` | Run ESLint against the codebase. |
| `npm run fetch:earthdata-token` | Interactive NASA Earthdata token minting helper. |
| `npm run generate:gee-demo` | Sample Google Earth Engine layers and export GeoJSON demo overlays. |

## Attribution & compliance

- NASA GIBS/Worldview imagery courtesy NASA EOSDIS. Respect usage limits and include attribution in exports.
- NASA SEDAC data © CIESIN/Columbia University and NASA. Downloads may require Earthdata Login tokens.
- GHSL built-up surfaces © European Commission, Joint Research Centre.
- WorldPop population density © WorldPop, University of Southampton.
- Resource Watch/Aqueduct indicators © World Resources Institute (API-accessible via SQL endpoints).

Refer to each provider’s terms of use before redistribution.
