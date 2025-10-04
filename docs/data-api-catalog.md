# Live Data API Catalog

This catalog consolidates copy-and-paste API calls for every data provider CitySense touches. Update the date, bounding box, or query parameters as needed.

## 1. NASA GIBS — WMTS (daily imagery tiles)

```text
https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MOD11A1_LST_Day_1km/default/2025-10-03/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png
```

- Swap the product ID to access other layers (e.g., `MOD13A1_NDVI_1km`, `GPM_3IMERGHH_06_precipitation`, `MODIS_Combined_Value_Added_AOD`, `OMI_Nitrogen_Dioxide_Tropo_Column_L3`, `VIIRS_SNPP_DayNightBand_ENCC`).
- Use `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml` to enumerate layer names, projections, and valid times.

Leaflet helper:

```ts
L.tileLayer(
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{layer}/default/{time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png',
  { layer: 'MOD11A1_LST_Day_1km', time: '2025-10-03', tileSize: 256, attribution: 'NASA GIBS', maxNativeZoom: 9 }
)
```

## 2. NASA Earthdata Login — mint a bearer token

```bash
curl -u "$EDL_USERNAME:$EDL_PASSWORD" -X POST https://urs.earthdata.nasa.gov/api/users/tokens
```

Use the returned token as `Authorization: Bearer <TOKEN>` for protected services (e.g., SEDAC WCS downloads). The repository provides an interactive helper:

```bash
npm run fetch:earthdata-token -- --save
```

## 3. SEDAC — WMS preview + WCS download

Preview flood hazard (no token required for WMS):

```bash
curl "https://sedac.ciesin.columbia.edu/geoserver/wms?service=WMS&version=1.3.0&request=GetMap&layers=ndh:ndh-flood-hazard-frequency-distribution&bbox=118,4,127,22&crs=EPSG:4326&width=1024&height=512&styles=&format=image/png"
```

Download population density via WCS (token required):

```bash
curl -H "Authorization: Bearer $NASA_EARTHDATA_TOKEN" \
  "https://sedac.ciesin.columbia.edu/geoserver/wcs?service=WCS&version=2.0.1&request=GetCoverage&coverageId=gpw-v4:gpw-v4-population-density_2020&subset=Lat(14,15)&subset2=Long(120,122)&format=image/tiff" -o gpw_density.tif
```

## 4. WorldPop — WMS + raster download

List available collections (STAC):

```bash
curl "https://sdi.worldpop.org/api/collections"
```

Display national population density (1 km) via WMS:

```bash
curl "https://sdi.worldpop.org/geoserver/worldpop/wms?service=WMS&version=1.3.0&request=GetMap&layers=worldpop:ppp_2020_PHL_1km_Aggregated&bbox=118,4,127,22&crs=EPSG:4326&width=1024&height=512&format=image/png&transparent=true" --output worldpop_phl.png
```

Download GeoTIFF mosaics:

```bash
curl -L "https://sdi.worldpop.org/wpdata?iso=PHL&layer=ppp_2020_1km" -o worldpop_phl_2020.tif
```

## 5. GHSL — Built-up surface WMS

```bash
curl "https://ghsl.jrc.ec.europa.eu/ghs_wms?service=WMS&request=GetMap&version=1.3.0&layers=GHS_BUILT_S_E2018_GLOBE_R2019A&bbox=118,4,127,22&crs=EPSG:4326&width=1024&height=512&format=image/png&transparent=true" -o ghsl_built.png
```

## 6. Resource Watch / WRI Aqueduct — dataset query + tiles

List datasets containing "Aqueduct":

```bash
curl "https://api.resourcewatch.org/v1/dataset?search=Aqueduct&application=rw"
```

Query baseline water risk for the Philippines (dataset `1965d5f9-6d05-4ee1-9ced-28cf3834760c`):

```bash
curl --get "https://api.resourcewatch.org/v1/query/1965d5f9-6d05-4ee1-9ced-28cf3834760c" \
  --data-urlencode "sql=select * from data where country_iso='PHL'"
```

Render the published tile service for baseline water stress (layer `4d10a486-77c4-4d58-b89f-474d824b9c6b`):

```text
https://api.resourcewatch.org/v1/layer/4d10a486-77c4-4d58-b89f-474d824b9c6b/tile/gee/{z}/{x}/{y}
```

## 7. Copernicus Data Space Ecosystem — Sentinel OData search

```bash
curl -H "Authorization: Bearer $CDSE_TOKEN" \
  "https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=startswith(Collection/Name,'SENTINEL-2') and OData.CSC.Intersects(area=geography'POLYGON((120.5 15.2,121.1 15.2,121.1 14.5,120.5 14.5,120.5 15.2))') and ContentDate/Start ge 2025-10-01 and Attributes/OData.CSC.FloatAttribute/any(a:a/Name eq 'cloudcoverpercentage' and a/OData.CSC.NullableFloat lt 20)" |
  jq '.value[] | {name: .Name, sensingStart: .ContentDate.Start, cloudCover: (.Attributes[0].Value)}'
```

Replace the polygon coordinates with your area of interest and adjust the date range to suit the campaign.

## 8. CSA RCM — STAC mosaic search

```bash
curl "https://api.stac.rcm-landsat-mosaic.canada.ca/stac/search?collections=rcm-mosaic&bbox=-79.7,43.4,-79.0,43.9&datetime=2025-01-01/2025-10-03"
```

## 9. INDE (Brazil) — dynamic WMS/WFS registration

Retrieve service metadata (example: IBGE cartographic base):

```bash
curl "https://geoservicos.ibge.gov.br/geoserver/ows?service=WMS&request=GetCapabilities"
```

Once the service URL is known, plug it into Leaflet via `L.tileLayer.wms` using the advertised layer names.

## 10. INPE TerraBrasilis / STAC

List STAC collections:

```bash
curl "https://data.inpe.br/stac/collections"
```

Query recent PRODES deforestation alerts (GeoJSON):

```bash
curl "https://terrabrasilis.dpi.inpe.br/queimadas/bdqueimadas?uf=PA&ano=2025"
```

> ⚠️ Always review each provider’s usage policies, rate limits, and attribution requirements before automating downloads or redistributing derived products.
