/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SUPABASE_TABLE?: string
  readonly VITE_GROUP_SLUG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
