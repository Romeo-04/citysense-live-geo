import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { buildGIBSTileURL } from "@/lib/nasa-api";
import {
  buildWorldPopLayerName,
  buildWorldPopDownloadUrl,
  getCityCountryISO,
} from "@/lib/worldpop-api";
import {
  buildBoundingBox,
  formatBoundingBox,
  latLonToTile,
  polygonFromBoundingBox,
} from "@/lib/map-utils";

interface ApiCallPanelProps {
  center: { lat: number; lon: number };
  selectedCity: string;
  selectedDate: string;
  zoom: number;
}

interface ApiCallEntry {
  id: string;
  label: string;
  description: string;
  url: string;
  requiresAuth?: boolean;
  provider: string;
}

const BUFFER_DEGREES = 1.0;
const DEFAULT_WORLDPOP_YEAR = 2020;

function replaceTilePlaceholders(
  template: string,
  zoom: number,
  x: number,
  y: number
): string {
  return template
    .replace("{z}", zoom.toString())
    .replace("{x}", x.toString())
    .replace("{y}", y.toString());
}

export const ApiCallPanel = ({
  center,
  selectedCity,
  selectedDate,
  zoom,
}: ApiCallPanelProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const apiCalls = useMemo<ApiCallEntry[]>(() => {
    const { lat, lon } = center;
    const tileZoom = Math.max(0, Math.round(Math.min(zoom, 11)));
    const tileIndices = latLonToTile(lat, lon, tileZoom);
    const iso = getCityCountryISO(selectedCity);

    const bbox = buildBoundingBox(lat, lon, BUFFER_DEGREES);
    const bboxParam = formatBoundingBox(bbox);
    const polygonWkt = polygonFromBoundingBox(bbox);

    const lstTemplate = buildGIBSTileURL("lst", selectedDate);
    const lstUrl = replaceTilePlaceholders(
      lstTemplate,
      tileZoom,
      tileIndices.x,
      tileIndices.y
    );

    const precipitationTemplate = buildGIBSTileURL("precipitation", selectedDate);
    const precipitationUrl = replaceTilePlaceholders(
      precipitationTemplate,
      Math.min(tileZoom, 6),
      tileIndices.x,
      tileIndices.y
    );

    const sedacWmsUrl =
      `https://sedac.ciesin.columbia.edu/geoserver/wms?service=WMS&version=1.3.0&request=GetMap` +
      `&layers=ndh:ndh-flood-hazard-frequency-distribution&bbox=${bboxParam}` +
      `&crs=EPSG:4326&width=1024&height=512&styles=&format=image/png&transparent=true`;

    const ghslWmsUrl =
      `https://ghsl.jrc.ec.europa.eu/ghs_wms?service=WMS&version=1.3.0&request=GetMap` +
      `&layers=GHS_BUILT_S_E2018_GLOBE_R2019A&bbox=${bboxParam}` +
      `&crs=EPSG:4326&width=1024&height=512&format=image/png&transparent=true`;

    const worldPopLayer = buildWorldPopLayerName(iso, DEFAULT_WORLDPOP_YEAR);
    const worldPopWmsUrl =
      `https://sdi.worldpop.org/geoserver/worldpop/wms?service=WMS&version=1.3.0&request=GetMap` +
      `&layers=${worldPopLayer}&bbox=${bboxParam}` +
      `&crs=EPSG:4326&width=1024&height=512&format=image/png&transparent=true`;

    const worldPopDownloadUrl = buildWorldPopDownloadUrl({
      iso,
      year: DEFAULT_WORLDPOP_YEAR,
    });

    const aqueductSql = encodeURIComponent(
      `select * from data where country_iso='${iso}'`
    );
    const aqueductQueryUrl =
      `https://api.resourcewatch.org/v1/query/1965d5f9-6d05-4ee1-9ced-28cf3834760c?sql=${aqueductSql}`;

    const copernicusOdataUrl =
      `https://catalogue.dataspace.copernicus.eu/odata/v1/Products?` +
      `$filter=startswith(Collection/Name,'SENTINEL-2')` +
      ` and OData.CSC.Intersects(area=geography'${polygonWkt}')` +
      ` and ContentDate/Start ge ${selectedDate}` +
      ` and Attributes/OData.CSC.FloatAttribute/any(a:a/Name eq 'cloudcoverpercentage' and a/OData.CSC.NullableFloat lt 20)`;

    const earthdataTokenCurl =
      "curl -u \"$EDL_USERNAME:$EDL_PASSWORD\" -X POST https://urs.earthdata.nasa.gov/api/users/tokens";

    return [
      {
        id: "gibs-lst",
        label: "NASA GIBS — LST tile",
        description: "Daily MODIS land surface temperature tile for the current map view.",
        url: lstUrl,
        provider: "NASA GIBS",
      },
      {
        id: "gibs-precip",
        label: "NASA GIBS — IMERG precipitation",
        description: "Half-hourly precipitation tile (set TIME to the exact timestamp).",
        url: precipitationUrl,
        provider: "NASA GIBS",
      },
      {
        id: "sedac-wms",
        label: "SEDAC flood hazard WMS",
        description: "WMS preview for flood hazard frequency over the selected city extent.",
        url: sedacWmsUrl,
        provider: "NASA SEDAC",
      },
      {
        id: "ghsl-wms",
        label: "GHSL built-up WMS",
        description: "Built-up surface (2018 release) clipped to the city bounding box.",
        url: ghslWmsUrl,
        provider: "JRC GHSL",
      },
      {
        id: "worldpop-wms",
        label: "WorldPop population WMS",
        description: "WorldPop national mosaic rendered over the city envelope.",
        url: worldPopWmsUrl,
        provider: "WorldPop",
      },
      {
        id: "worldpop-download",
        label: "WorldPop raster download",
        description: "Direct GeoTIFF download via the documented REST helper.",
        url: worldPopDownloadUrl,
        provider: "WorldPop",
      },
      {
        id: "aqueduct-query",
        label: "Resource Watch — Aqueduct SQL",
        description: "Baseline water risk query filtered by the city's ISO3 code.",
        url: aqueductQueryUrl,
        provider: "WRI Resource Watch",
      },
      {
        id: "copernicus-odata",
        label: "Copernicus Data Space search",
        description: "Sentinel-2 search constrained to the city polygon and low cloud cover.",
        url: copernicusOdataUrl,
        provider: "Copernicus Data Space",
      },
      {
        id: "earthdata-token",
        label: "NASA Earthdata token mint",
        description: "Generate or refresh the bearer token required for authenticated downloads.",
        url: earthdataTokenCurl,
        requiresAuth: true,
        provider: "NASA Earthdata Login",
      },
    ];
  }, [center, selectedCity, selectedDate, zoom]);

  const handleCopy = async (id: string, value: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy API call", error);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-card to-card/80 backdrop-blur border-border/50 space-y-4">
      <div>
        <h3 className="font-semibold text-base">Live API callouts</h3>
        <p className="text-sm text-muted-foreground">
          Copy-ready endpoints update with the selected city, date, and map zoom. Use them for debugging,
          automation, or to verify data availability outside the app.
        </p>
      </div>
      <div className="space-y-3">
        {apiCalls.map((call) => (
          <div key={call.id} className="p-3 rounded-md border border-border/60 bg-background/60 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{call.label}</p>
                <p className="text-xs text-muted-foreground">{call.description}</p>
                <p className="text-[11px] text-primary/80 mt-1">{call.provider}{call.requiresAuth ? " · Requires auth" : ""}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={() => handleCopy(call.id, call.url)}
              >
                {copiedId === call.id ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <code className="text-xs whitespace-pre-wrap break-words block text-muted-foreground/90">
                {call.url}
              </code>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ApiCallPanel;
