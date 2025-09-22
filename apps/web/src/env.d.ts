/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Optional base URL for API calls from the web app (e.g., https://api.example.com) */
  readonly PUBLIC_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
