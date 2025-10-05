# CitySense Live Geo - Setup Guide

## Prerequisites

- **Node.js** (v18 or higher)
- **Visual Studio Code** (recommended) or any code editor
- **NASA Earthdata Account** (for SEDAC protected layers)

---

## Installation Steps

### 1. Install Dependencies

Open a terminal in VS Code and run:

```bash
npm install
```

### 2. Configure API Keys & Tokens

Create a `.env.local` file in the project root with the following content:

```env
# NASA Earthdata Token (for SEDAC layers)
# Get this from: https://urs.earthdata.nasa.gov/users/tokens
VITE_NASA_EARTHDATA_TOKEN=your_earthdata_bearer_token_here
```

**How to get your NASA Earthdata Token:**

1. Create an account at https://urs.earthdata.nasa.gov/users/new
2. Login and generate a token at https://urs.earthdata.nasa.gov/users/tokens
3. Or use curl to mint a token:

```bash
curl -u "YOUR_USERNAME:YOUR_PASSWORD" -X POST https://urs.earthdata.nasa.gov/api/users/tokens
```

4. Copy the returned token (looks like `eyJ0eXAiOiJKV1QiLCJ...`)
5. Paste it in `.env.local` as shown above

### 3. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080` (or the port shown in terminal).

---

## API Configuration Templates

### NASA GIBS Layers (No Auth Required)

The following layers work without any API keys:

- ✅ Land Surface Temperature (LST)
- ✅ Vegetation Index (NDVI)
- ✅ Precipitation (IMERG)
- ✅ Aerosol Optical Depth (AOD)
- ✅ NO₂ Tropospheric Column
- ✅ Night Lights (VIIRS)

**Implementation:** Already configured in `src/lib/nasa-api.ts`

---

### NASA SEDAC Layers (Auth Required)

Requires NASA Earthdata Bearer Token in `.env.local`

**Available SEDAC Layers:**
- Population Density (GPW v4)
- Urban Extents (GRUMP)
- Flood Hazard Frequency
- Poverty/Child Malnutrition

**Implementation:** Configured in `src/lib/sedac-api.ts`

**Example usage:**

```typescript
import { fetchSEDACMap, SEDAC_LAYERS } from '@/lib/sedac-api';

// Fetch population density map
const bbox: [number, number, number, number] = [120.8, 14.3, 121.2, 14.9]; // Manila
const mapBlob = await fetchSEDACMap('population_density', bbox);
```

---

### WorldPop (No Auth Required)

**Implementation:** Configured in `src/lib/worldpop-api.ts`

**Example:**

```typescript
import { buildWorldPopLayerName, getCityCountryISO } from '@/lib/worldpop-api';

const iso = getCityCountryISO('Metro Manila'); // returns 'PHL'
const layerName = buildWorldPopLayerName(iso); // worldpop:phl_ppp_2020_1km_Aggregated
```

---

### Copernicus Data Space (No Auth for OData)

**Implementation:** Configured in `src/lib/copernicus-api.ts`

**Example:**

```typescript
import { searchSentinelProducts } from '@/lib/copernicus-api';

const products = await searchSentinelProducts({
  bbox: [120.8, 14.3, 121.2, 14.9],
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  cloudCover: 20
});
```

---

### WRI Resource Watch (No Auth Required)

**Implementation:** Configured in `src/lib/wri-api.ts`

**Example:**

```typescript
import { fetchWRIDatasets, queryWRIData } from '@/lib/wri-api';

const datasets = await fetchWRIDatasets({ search: 'water stress' });
const data = await queryWRIData('dataset-id-here', 'SELECT * FROM data LIMIT 10');
```

---

## Available Layers

All layers are configured in `src/lib/layer-catalog.ts`. To add/remove layers from the UI, edit the `activeLayers` state in `src/pages/Index.tsx`.

### Default Active Layers:
- Land Surface Temperature (NASA GIBS)
- Vegetation Index (NASA GIBS)
- Precipitation (NASA GIBS)
- Built-up Surface (GHSL)
- Population Density (WorldPop)

---

## Troubleshooting

### Issue: Map not loading

**Solution:** Check browser console for CORS or network errors. Some WMS services may have rate limits.

### Issue: SEDAC layers not showing

**Solution:** Verify your NASA Earthdata token is:
1. Valid and not expired
2. Correctly set in `.env.local`
3. In Bearer token format (starts with `eyJ`)

### Issue: Blank screen

**Solution:** Check console for TypeScript errors. Run `npm install` again.

---

## Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Fetch NASA Earthdata token interactively (if script is available)
npm run fetch:earthdata-token -- --save
```

---

## Layer Control

Toggle layers in the UI using the Control Panel on the left sidebar, or programmatically by modifying the `activeLayers` array in `Index.tsx`:

```typescript
const [activeLayers, setActiveLayers] = useState<string[]>([
  'lst',           // Land Surface Temperature
  'ndvi',          // Vegetation Index
  'precipitation', // Precipitation
  // Add more layer IDs from layer-catalog.ts
]);
```

---

## Important Notes

1. **NASA Earthdata tokens expire** - You'll need to refresh them periodically
2. **Rate Limits** - Some services have usage quotas; monitor console for 429 errors
3. **CORS** - If you encounter CORS issues, some services may require server-side proxying
4. **Performance** - Avoid enabling too many high-resolution layers simultaneously

---

## Support & Documentation

- [NASA GIBS Documentation](https://nasa-gibs.github.io/gibs-api-docs/)
- [NASA Earthdata Login](https://urs.earthdata.nasa.gov/)
- [SEDAC Data Portal](https://sedac.ciesin.columbia.edu/)
- [WorldPop API](https://www.worldpop.org/)
- [Copernicus Data Space](https://dataspace.copernicus.eu/)
- [Resource Watch API](https://resource-watch.github.io/doc-api/)

---

## Quick Start Checklist

- [ ] Run `npm install`
- [ ] Create `.env.local` file
- [ ] Add NASA Earthdata token to `.env.local`
- [ ] Run `npm run dev`
- [ ] Open browser to `http://localhost:8080`
- [ ] Toggle layers in the Control Panel
- [ ] Verify map loads with satellite imagery

---

**You're all set!** The only manual step is adding your NASA Earthdata token to `.env.local` for protected SEDAC layers.
