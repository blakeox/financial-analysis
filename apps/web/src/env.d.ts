/// <reference types="astro/client" />

declare global {
  interface ImportMetaEnv {
    /** Optional base URL for API calls from the web app (e.g., https://api.example.com) */
    readonly PUBLIC_API_BASE_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  // Google Analytics gtag declaration
  function gtag(command: string, ...args: unknown[]): void;

  // Extend WindowEventMap with custom events
  interface WindowEventMap {
    'ai-field-update': CustomEvent<import('./utils/aiFieldHighlighter').FieldUpdateEvent>;
    'ai-bulk-field-update': CustomEvent<import('./utils/aiFieldHighlighter').FieldUpdateEvent[]>;
    'calculator-completed': CustomEvent<{
      calculatorId: string;
      result: unknown;
      formData?: unknown;
    }>;
    'journey-context-loaded': CustomEvent<unknown>;
    'model-completed': CustomEvent<unknown>;
  }

  interface DocumentEventMap {
    'model-completed': CustomEvent<unknown>;
  }
}

declare module '*?module' {
  const src: string;
  export default src;
}

export {};
