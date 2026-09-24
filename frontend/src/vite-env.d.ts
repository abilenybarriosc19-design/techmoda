/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_API_URL?: string;
  VITE_SEMANTIC_SEARCH_URL?: string;
  VITE_SHOPPING_ASSISTANT_URL?: string;
  VITE_GENERATE_DESCRIPTION_URL?: string;
  VITE_SYNTHESIZE_VOICE_URL?: string;
  VITE_TRANSLATE_CATALOG_URL?: string;
  VITE_ANALYZE_SENTIMENT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
