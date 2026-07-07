/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin to prefix API calls with, e.g. https://api.example.com. Leave unset in local dev to use the Vite proxy. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
