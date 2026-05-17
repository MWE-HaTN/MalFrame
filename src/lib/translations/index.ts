// Lazy-loaded translations — only the active language is loaded eagerly.
// en is always imported statically (default + fallback). vn loads on demand.

import { en } from "./en";

export type Language = "en" | "vn";

// Async loaders for each language
export async function loadEn(): Promise<Record<string, string>> {
  return en;
}

export async function loadVn(): Promise<Record<string, string>> {
  return (await import("./vn")).vn;
}

// Cache populated by LanguageContext when languages load.
// Module-level so useDashboardData and other non-hook code can read it synchronously.
export const translationCache: Partial<Record<Language, Record<string, string>>> = {
  en,
};

/** Synchronous translation lookup — falls back to English if target language not yet loaded. */
export function tSync(lang: Language, key: string): string {
  const dict = translationCache[lang] || translationCache.en;
  return dict?.[key] || key;
}

// Type-safe translation keys
export type TranslationKey = keyof typeof en;
