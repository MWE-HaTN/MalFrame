// Re-export translations for easy importing
// Each language is in its own file for better code splitting and maintainability

import { en } from "./en";
import { vn } from "./vn";

export type Language = "en" | "vn";

export const translations: Record<Language, Record<string, string>> = {
  en,
  vn,
};

// Type-safe translation keys
export type TranslationKey = keyof typeof en;

// Helper to get all available languages
export const availableLanguages: Language[] = ["en", "vn"];

// Language display names
export const languageNames: Record<Language, string> = {
  en: "English",
  vn: "Tiếng Việt",
};
