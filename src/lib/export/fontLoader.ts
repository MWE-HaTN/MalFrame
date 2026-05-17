/**
 * Font loader for jsPDF Unicode support
 * Loads Roboto font (supports Vietnamese and other Unicode characters)
 */

import { jsPDF } from "jspdf";
import { debugWarn } from "@/lib/debugLogger";

// Cache for loaded fonts (base64)
let robotoRegularBase64: string | null = null;
let robotoBoldBase64: string | null = null;
let fontsLoaded = false;
let fontLoadPromise: Promise<void> | null = null;

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Load font file and convert to base64
 */
async function loadFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load font: ${url}`);
  }
  const buffer = await response.arrayBuffer();
  return arrayBufferToBase64(buffer);
}

/**
 * Load and cache both Roboto fonts
 */
export async function loadFonts(): Promise<void> {
  if (fontsLoaded) return;
  if (fontLoadPromise) return fontLoadPromise;

  fontLoadPromise = (async () => {
    try {
      const [regular, bold] = await Promise.all([
        loadFontAsBase64("/fonts/Roboto-Regular.ttf"),
        loadFontAsBase64("/fonts/Roboto-Bold.ttf"),
      ]);

      robotoRegularBase64 = regular;
      robotoBoldBase64 = bold;
      fontsLoaded = true;
    } catch (error) {
      debugWarn("Failed to load custom fonts, falling back to Helvetica:", error);
      fontLoadPromise = null; // Allow retry on next call
      throw error;
    }
  })();

  return fontLoadPromise;
}

/**
 * Register Roboto fonts with jsPDF instance
 * Call this after creating new jsPDF() and before rendering text
 */
export function registerFonts(pdf: jsPDF): boolean {
  if (!fontsLoaded || !robotoRegularBase64 || !robotoBoldBase64) {
    return false; // Fonts not loaded, use default
  }

  try {
    // Add fonts to Virtual File System
    pdf.addFileToVFS("Roboto-Regular.ttf", robotoRegularBase64);
    pdf.addFileToVFS("Roboto-Bold.ttf", robotoBoldBase64);

    // Register fonts
    pdf.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    pdf.addFont("Roboto-Bold.ttf", "Roboto", "bold");

    return true;
  } catch (error) {
    debugWarn("Failed to register fonts:", error);
    return false;
  }
}

/**
 * Get the font family to use (Roboto if loaded, otherwise Helvetica)
 */
export function getFontFamily(): string {
  return fontsLoaded ? "Roboto" : "helvetica";
}
