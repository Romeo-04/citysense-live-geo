# CitySense Live Geo

CitySense is a geospatial intelligence cockpit for urban planners who need live Earth observation feeds to shape climate-resilient policies. The app streams NASA, WorldPop, GHSL, and SEDAC layers into a single Leaflet map, allows rapid layer toggling by theme, and surfaces headline indicators for heat, greenspace, water, and equity.

## Features

- 🔥 **Heat & Greenspace:** MODIS land surface temperature and NDVI (NASA GIBS) with daily/8-day cadence.
- 🌧️ **Water & Flood:** GPM IMERG precipitation and SEDAC flood hazard WMS overlays for rapid situational awareness.
- 🌫️ **Air & Mobility:** MAIAC aerosol optical depth and Aura OMI NO₂ tiles for pollution tracking.
- 🌆 **Urbanization & Equity:** JRC GHSL built-up surfaces and WorldPop population density to highlight exposure hotspots.
- 🗺️ **Live WMTS/WMS integration:** Layer catalog centralizes NASA GIBS, SEDAC, GHSL, and WorldPop endpoints with correct projections and metadata.
- 🔐 **Token management:** Scripted helper to mint NASA Earthdata tokens and optional front-end usage for authenticated downloads.
- 🤖 **AI weather assistant:** DeepSeek R1 chatbot blends live Open-Meteo feeds with actionable planning advice.

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

### Environment variables

Create a `.env.local` (gitignored) if you plan to hit authenticated NASA endpoints (e.g., SEDAC downloads) and enable the AI assistant:

```bash
VITE_NASA_EARTHDATA_TOKEN=<your_token>
VITE_DEEPSEEK_API_KEY=<your_deepseek_api_key>
# optional overrides
VITE_DEEPSEEK_MODEL=deepseek-reasoner
VITE_DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
```

Generate the token from NASA Earthdata Login using the bundled helper:

```bash
npm run fetch:earthdata-token -- --save
```

This prompts for your NASA credentials (or reads `NASA_EARTHDATA_USERNAME`/`NASA_EARTHDATA_PASSWORD`) and stores a short-lived bearer token in `.env.local`.

To enable the DeepSeek-powered chatbot, create an API key from your DeepSeek console and export it before starting the dev server (PowerShell example shown):

```powershell
$env:VITE_DEEPSEEK_API_KEY = "sk-your-key"
# optional model override
$env:VITE_DEEPSEEK_MODEL = "deepseek-reasoner"
```

If you proxy requests through a different domain, set `VITE_DEEPSEEK_API_URL` accordingly. All values can live in `.env.local` for convenience.

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
## Data source API references

The NASA data services used by CitySense Live Geo (GIBS WMTS tiles and SEDAC WMS/WCS layers) require specific API calls and, in some cases, authentication tokens. See [`docs/nasa-api-calls.md`](docs/nasa-api-calls.md) for copy-and-paste examples covering:

- Retrieving NASA GIBS tiles for a given date.
- Minting an Earthdata Login bearer token.
- Downloading SEDAC map imagery.

To mint and securely store a NASA Earthdata token locally, run:

```sh
npm run fetch:earthdata-token -- --save
```

The script prompts for your NASA Earthdata Login credentials, requests a short-lived bearer token directly from NASA, and writes the token to `.env.local` (already gitignored) so that the frontend helpers can authenticate SEDAC requests without exposing secrets.

Full copy-and-paste API calls—including NASA Earthdata token minting, Copernicus OData queries, WorldPop downloads, and Resource Watch SQL—are documented in [`docs/data-api-catalog.md`](docs/data-api-catalog.md).

## Project scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Type-check and bundle for production. |
| `npm run lint` | Run ESLint against the codebase. |
| `npm run fetch:earthdata-token` | Interactive NASA Earthdata token minting helper. |

## Attribution & compliance

- NASA GIBS/Worldview imagery courtesy NASA EOSDIS. Respect usage limits and include attribution in exports.
- NASA SEDAC data © CIESIN/Columbia University and NASA. Downloads may require Earthdata Login tokens.
- GHSL built-up surfaces © European Commission, Joint Research Centre.
- WorldPop population density © WorldPop, University of Southampton.
- Resource Watch/Aqueduct indicators © World Resources Institute (API-accessible via SQL endpoints).

Refer to each provider’s terms of use before redistribution.
