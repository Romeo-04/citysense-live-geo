/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NASA_EARTHDATA_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
