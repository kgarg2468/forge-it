/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INSFORGE_URL?: string;
  readonly VITE_INSFORGE_KEY?: string;
  readonly VITE_FORGEIT_API_URL?: string;
  readonly VITE_TOOL_ID?: string;
  readonly VITE_TOOL_SLUG?: string;
  readonly VITE_TOOL_NAME?: string;
  readonly VITE_REVIEW_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
